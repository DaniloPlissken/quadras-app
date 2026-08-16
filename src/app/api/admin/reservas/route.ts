import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Cria uma Date UTC midnight a partir de "YYYY-MM-DD".
 */
function parseDataUTC(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dataInicioStr = searchParams.get('dataInicio')
  const dataFimStr = searchParams.get('dataFim')
  const quadraIdFiltro = searchParams.get('quadraId')
  const modalidadeFiltro = searchParams.get('modalidade')
  const statusFiltro = searchParams.get('status')

  const where: Prisma.ReservaWhereInput = {}

  if (statusFiltro && statusFiltro !== 'todas') {
    where.status = statusFiltro as any
  } else {
    // Se não especificar status, podemos trazer apenas as ativas ou todas? 
    // Por padrão (legado), vamos excluir as canceladas a menos que o status seja explicitamente selecionado.
    where.status = { not: 'CANCELADA_ADMIN' }
  }

  if (dataInicioStr || dataFimStr) {
    const dataRange: Prisma.DateTimeFilter = {}
    if (dataInicioStr) {
      dataRange.gte = parseDataUTC(dataInicioStr)
    }
    if (dataFimStr) {
      const dFim = parseDataUTC(dataFimStr)
      dFim.setUTCHours(23, 59, 59, 999)
      dataRange.lte = dFim
    }
    where.data = dataRange
  }

  if (quadraIdFiltro && quadraIdFiltro !== 'todas') {
    where.quadraId = quadraIdFiltro
  }

  if (modalidadeFiltro && modalidadeFiltro !== 'todas') {
    where.quadra = {
      ...(where.quadra || {}),
      modalidade: { nome: modalidadeFiltro }
    } as any
  }

  const reservas = await prisma.reserva.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } }, // Sem 'id' para proteger CPF
      quadra: { include: { modalidade: true } },
      time: { include: { responsaveis: true } }
    },
    orderBy: [{ data: 'desc' }, { slot: 'asc' }],
  })

  return NextResponse.json(reservas)
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status, motivo } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID e status são obrigatórios.' },
        { status: 400 }
      )
    }

    const reserva = await prisma.reserva.update({
      where: { id },
      data: { 
        status,
        cancelToken: status === 'CANCELADA_ADMIN' ? id : ""
      },
      include: {
        user: true,
        quadra: true
      }
    })

    if (status === 'CANCELADA_ADMIN') {
      try {
        const { enviarEmailCancelamentoAdmin } = await import('@/lib/mail');
        const formatShort = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
        
        const motivoEnvio = motivo || "Reserva cancelada pela equipe de administração sem motivo específico definido.";

        await enviarEmailCancelamentoAdmin(
          reserva.user.email,
          reserva.user.name,
          reserva.quadra.nome,
          formatShort(reserva.data),
          reserva.slot,
          motivoEnvio
        );
      } catch (e) {
        console.error('Falha ao enviar e-mail de cancelamento admin:', e);
      }
    }

    return NextResponse.json(reserva)
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar reserva' },
      { status: 500 }
    )
  }
}
