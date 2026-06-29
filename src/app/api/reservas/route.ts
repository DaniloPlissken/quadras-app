import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cria uma Date UTC midnight a partir de "YYYY-MM-DD", evitando deslocamento de timezone.
 * Garante que "2026-06-28" sempre se torne 2026-06-28T00:00:00.000Z independente do timezone do servidor.
 */
function parseDataUTC(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}

/**
 * Retorna o intervalo segunda → domingo da semana que contém a data (UTC).
 * Usado para validar: máximo 1 reserva por "fim de semana" (que inclui feriados na semana).
 */
function getSemanaRange(data: Date): { inicio: Date; fim: Date } {
  const diaSemana = data.getUTCDay() // 0=Dom, 1=Seg, ..., 6=Sáb

  const inicio = new Date(data)
  // Voltar até segunda-feira (day=1)
  // Se domingo (0), voltar 6 dias. Se segunda (1), voltar 0. Se sábado (6), voltar 5.
  const diasAteSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  inicio.setUTCDate(inicio.getUTCDate() - diasAteSegunda)
  inicio.setUTCHours(0, 0, 0, 0)

  const fim = new Date(inicio)
  fim.setUTCDate(fim.getUTCDate() + 6) // domingo
  fim.setUTCHours(23, 59, 59, 999)

  return { inicio, fim }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const data = searchParams.get('data')
  const quadraId = searchParams.get('quadraId')

  if (!data || !quadraId) {
    return NextResponse.json(
      { error: 'Data e quadra são obrigatórios' },
      { status: 400 }
    )
  }

  const dataConsulta = parseDataUTC(data)
  const inicioDoDia = new Date(dataConsulta)
  inicioDoDia.setUTCHours(0, 0, 0, 0)
  const fimDoDia = new Date(dataConsulta)
  fimDoDia.setUTCHours(23, 59, 59, 999)

  const reservas = await prisma.reserva.findMany({
    where: {
      quadraId,
      data: {
        gte: inicioDoDia,
        lte: fimDoDia,
      },
      status: { not: 'CANCELADA_ADMIN' },
    },
  })

  return NextResponse.json(reservas)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { quadraId, userId, data, slot } = body

    if (!quadraId || !userId || !data || !slot) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const dataReserva = parseDataUTC(data)

    // Validar: existe Agenda para esta data + quadra?
    const agenda = await prisma.agenda.findUnique({
      where: {
        data_quadraId: {
          data: dataReserva,
          quadraId,
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
    if (!agenda.horarios.includes(slot)) {
      return NextResponse.json(
        { error: 'Este horário não está disponível para esta data.' },
        { status: 400 }
      )
    }

    // Validar: o slot já foi reservado nesta quadra?
    const slotOcupado = await prisma.reserva.findFirst({
      where: {
        quadraId,
        data: dataReserva,
        slot,
        status: { not: 'CANCELADA_ADMIN' },
      },
    })

    if (slotOcupado) {
      return NextResponse.json(
        { error: 'Este horário já está reservado.' },
        { status: 400 }
      )
    }

    // Validar: o usuário já tem reserva neste fim de semana (seg-dom)?
    const { inicio, fim } = getSemanaRange(dataReserva)

    const reservaDaSemana = await prisma.reserva.findFirst({
      where: {
        userId,
        data: {
          gte: inicio,
          lte: fim,
        },
        status: { not: 'CANCELADA_ADMIN' },
      },
    })

    if (reservaDaSemana) {
      return NextResponse.json(
        { error: 'Você já possui uma reserva para este fim de semana. Limite de 1 reserva por fim de semana.' },
        { status: 400 }
      )
    }

    const reserva = await prisma.reserva.create({
      data: {
        quadraId,
        userId,
        data: dataReserva,
        slot,
      },
    })

    return NextResponse.json(reserva, { status: 201 })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Horário indisponível ou erro interno' },
      { status: 400 }
    )
  }
}