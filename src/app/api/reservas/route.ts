import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function parseDataLocal(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

function inicioDaSemana(date: Date) {
  const d = new Date(date)
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia

  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)

  return d
}

function fimDaSemana(date: Date) {
  const inicio = inicioDaSemana(date)
  const fim = new Date(inicio)

  fim.setDate(inicio.getDate() + 6)
  fim.setHours(23, 59, 59, 999)

  return fim
}

function isFimDeSemanaDaSemanaAtual(date: Date) {
  const hoje = new Date()
  const inicio = inicioDaSemana(hoje)
  const fim = fimDaSemana(hoje)

  const data = new Date(date)
  data.setHours(0, 0, 0, 0)

  const dia = data.getDay()
  const ehSabadoOuDomingo = dia === 0 || dia === 6

  return ehSabadoOuDomingo && data >= inicio && data <= fim
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

  const dataConsulta = parseDataLocal(data)
  const inicioSemana = inicioDaSemana(dataConsulta)
  const fimSemana = fimDaSemana(dataConsulta)

  const reservas = await prisma.reserva.findMany({
    where: {
      quadraId,
      data: {
        gte: inicioSemana,
        lte: fimSemana,
      },
    },
  })

  return NextResponse.json(reservas)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { quadraId, userId, data, slot } = body

    const dataReserva = parseDataLocal(data)

    if (!isFimDeSemanaDaSemanaAtual(dataReserva)) {
      return NextResponse.json(
        {
          error:
            'Reservas permitidas apenas para sábado e domingo da semana atual.',
        },
        { status: 400 }
      )
    }

    if (!quadraId || !userId || !data || !slot) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }


const inicioSemana = inicioDaSemana(dataReserva)
const fimSemana = fimDaSemana(dataReserva)

const reservaDoUsuarioNoFimDeSemana = await prisma.reserva.findFirst({
  where: {
    userId,
    data: {
      gte: inicioSemana,
      lte: fimSemana,
    },
  },
})

if (reservaDoUsuarioNoFimDeSemana) {
  return NextResponse.json(
    { error: 'Você já possui uma reserva para este fim de semana.' },
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