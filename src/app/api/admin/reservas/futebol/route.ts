import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseDataUTC(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}

function getSemanaRange(data: Date): { inicio: Date; fim: Date } {
  const diaSemana = data.getUTCDay() // 0=Dom, 1=Seg, ..., 6=Sáb

  const inicio = new Date(data)
  const diasAteSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  inicio.setUTCDate(inicio.getUTCDate() - diasAteSegunda)
  inicio.setUTCHours(0, 0, 0, 0)

  const fim = new Date(inicio)
  fim.setUTCDate(fim.getUTCDate() + 6) // domingo
  fim.setUTCHours(23, 59, 59, 999)

  return { inicio, fim }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado.' },
        { status: 401 }
      )
    }

    const operadorId = session.user.id
    const body = await req.json()
    const { timeId, quadraId, data, slot } = body

    if (!timeId || !quadraId || !data || !slot) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const time = await prisma.time.findUnique({
      where: { id: timeId }
    })

    if (!time || time.status !== 'APTO') {
      return NextResponse.json(
        { error: 'O time selecionado não está APTO para agendamentos.' },
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

    if (!agenda || !agenda.horarios.includes(slot)) {
      return NextResponse.json(
        { error: 'Este horário não está disponível na agenda da quadra.' },
        { status: 400 }
      )
    }

    // Validar: conflito de horário
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
        { error: 'Este horário já está reservado por outro time.' },
        { status: 400 }
      )
    }

    // Validar Cota do Time: 1 reserva por fim de semana
    const { inicio, fim } = getSemanaRange(dataReserva)

    const reservaDaSemana = await prisma.reserva.findFirst({
      where: {
        timeId,
        data: {
          gte: inicio,
          lte: fim,
        },
        status: { not: 'CANCELADA_ADMIN' },
      },
    })

    if (reservaDaSemana) {
      return NextResponse.json(
        { error: 'Este time já possui uma reserva para este fim de semana.' },
        { status: 400 }
      )
    }

    // Criar a reserva sem userId, com operadorId e timeId
    const reserva = await prisma.reserva.create({
      data: {
        quadraId,
        timeId,
        data: dataReserva,
        slot,
        operadorId,
        // userId é deixado como nulo
      }
    })

    return NextResponse.json(reserva, { status: 201 })
  } catch (error) {
    console.error('Erro na criação da reserva admin:', error)
    return NextResponse.json(
      { error: 'Erro ao criar a reserva.' },
      { status: 500 }
    )
  }
}
