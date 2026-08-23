import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Cria uma Date UTC midnight a partir de "YYYY-MM-DD".
 */
function parseDataUTC(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}

/**
 * Retorna o intervalo segunda → domingo da semana que contém a data (UTC).
 */
function getSemanaRange(data: Date): { inicio: Date; fim: Date } {
  const diaSemana = data.getUTCDay()

  const inicio = new Date(data)
  const diasAteSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  inicio.setUTCDate(inicio.getUTCDate() - diasAteSegunda)
  inicio.setUTCHours(0, 0, 0, 0)

  const fim = new Date(inicio)
  fim.setUTCDate(fim.getUTCDate() + 6)
  fim.setUTCHours(23, 59, 59, 999)

  return { inicio, fim }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Apenas admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { reservaId, novaData, novoSlot } = await req.json()

    if (!reservaId || !novaData || !novoSlot) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Buscar a reserva atual
    const reservaOriginal = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: {
        user: true,
        quadra: true,
        time: true
      }
    })

    if (!reservaOriginal) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    }

    if (reservaOriginal.status !== 'CONFIRMADA') {
      return NextResponse.json({ error: 'Apenas reservas confirmadas podem ser reagendadas' }, { status: 400 })
    }

    const dataReserva = parseDataUTC(novaData)

    // Validar: não permitir datas passadas
    const agora = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })
    const dataAtualStr = formatter.format(agora)
    const hojeUTC = parseDataUTC(dataAtualStr)

    if (dataReserva < hojeUTC) {
      return NextResponse.json(
        { error: 'Não é possível reagendar para datas passadas.' },
        { status: 400 }
      )
    }

    // Validar: existe Agenda para esta data + quadra?
    const agenda = await prisma.agenda.findUnique({
      where: {
        data_quadraId: {
          data: dataReserva,
          quadraId: reservaOriginal.quadraId,
        },
      },
    })

    if (!agenda) {
      return NextResponse.json(
        { error: 'Esta data não está aberta para agendamento.' },
        { status: 400 }
      )
    }

    // Validar: o slot solicitado está na agenda?
    if (!agenda.horarios.includes(novoSlot)) {
      return NextResponse.json(
        { error: 'Este horário não está disponível para esta data.' },
        { status: 400 }
      )
    }

    // Validar: o slot já foi reservado nesta quadra?
    const slotOcupado = await prisma.reserva.findFirst({
      where: {
        quadraId: reservaOriginal.quadraId,
        data: dataReserva,
        slot: novoSlot,
        status: { not: 'CANCELADA_ADMIN' },
        id: { not: reservaId } // ignora a própria reserva
      },
    })

    if (slotOcupado) {
      return NextResponse.json(
        { error: 'Este horário já está reservado.' },
        { status: 400 }
      )
    }

    // Validar limite de 1 reserva por final de semana (apenas se for cidadão comum/time)
    if (reservaOriginal.userId) {
      const { inicio, fim } = getSemanaRange(dataReserva)

      const reservaDaSemana = await prisma.reserva.findFirst({
        where: {
          userId: reservaOriginal.userId,
          data: {
            gte: inicio,
            lte: fim,
          },
          status: { not: 'CANCELADA_ADMIN' },
          id: { not: reservaId } // ignora a própria reserva
        },
      })

      if (reservaDaSemana) {
        return NextResponse.json(
          { error: 'O usuário já possui outra reserva neste fim de semana. Limite de 1 reserva por fim de semana.' },
          { status: 400 }
        )
      }
    }

    // Formatar data antiga para o e-mail
    const formatShort = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
    const dataAntigaStr = formatShort(reservaOriginal.data)
    const horarioAntigo = reservaOriginal.slot

    // Atualiza a reserva
    const reservaAtualizada = await prisma.reserva.update({
      where: { id: reservaId },
      data: {
        data: dataReserva,
        slot: novoSlot,
        operadorId: session.user.id // Registra qual admin fez o reagendamento
      }
    })

    // Enviar email se houver cidadão vinculado (e se tiver email)
    if (reservaOriginal.user?.email) {
      try {
        const { enviarEmailReagendamento } = await import('@/lib/mail')
        
        await enviarEmailReagendamento(
          reservaOriginal.user.email,
          reservaOriginal.user.name || 'Cidadão',
          reservaOriginal.quadra.nome,
          dataAntigaStr,
          horarioAntigo,
          formatShort(dataReserva),
          novoSlot
        )
      } catch (err) {
        console.error('Falha ao enviar e-mail de reagendamento:', err)
      }
    }

    return NextResponse.json(reservaAtualizada, { status: 200 })
  } catch (error) {
    console.error('Erro ao reagendar reserva:', error)
    return NextResponse.json(
      { error: 'Erro interno ao reagendar a reserva' },
      { status: 500 }
    )
  }
}
