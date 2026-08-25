import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

function parseDataUTC(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}

function getSemanaRange(dataBase: string) {
  const d = parseDataUTC(dataBase)
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  
  const inicio = new Date(d)
  inicio.setUTCDate(diff)
  inicio.setUTCHours(0, 0, 0, 0)

  const fim = new Date(inicio)
  fim.setUTCDate(inicio.getUTCDate() + 6)
  fim.setUTCHours(23, 59, 59, 999)

  return { inicio, fim }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dataBase = searchParams.get('dataBase')
  const quadraId = searchParams.get('quadraId')

  if (!dataBase) {
    return NextResponse.json({ error: 'dataBase é obrigatório' }, { status: 400 })
  }

  const { inicio, fim } = getSemanaRange(dataBase)

  const agendaWhere: Prisma.AgendaWhereInput = {
    data: {
      gte: inicio,
      lte: fim
    },
    ...(quadraId ? { quadraId } : {})
  }

  const agendas = await prisma.agenda.findMany({
    where: agendaWhere,
    orderBy: { data: 'asc' }
  })

  const reservaWhere: Prisma.ReservaWhereInput = {
    data: {
      gte: inicio,
      lte: fim
    },
    ...(quadraId ? { quadraId } : {}),
    status: { not: 'CANCELADA_ADMIN' }
  }

  const reservas = await prisma.reserva.findMany({
    where: reservaWhere,
    include: {
      user: { select: { id: true, name: true, email: true, telefone: true } },
      time: {
        include: {
          responsaveis: { include: { pessoa: true } }
        }
      }
    }
  })

  return NextResponse.json({ agendas, reservas })
}

export async function POST(req: Request) {
  // POST para bloquear horários livres da semana
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { dataBase, quadraId } = await req.json()
    if (!dataBase || !quadraId) {
      return NextResponse.json({ error: 'dataBase e quadraId são obrigatórios' }, { status: 400 })
    }

    const { inicio, fim } = getSemanaRange(dataBase)

    const agendas = await prisma.agenda.findMany({
      where: {
        quadraId,
        data: { gte: inicio, lte: fim }
      }
    })

    const reservas = await prisma.reserva.findMany({
      where: {
        quadraId,
        data: { gte: inicio, lte: fim },
        status: { not: 'CANCELADA_ADMIN' }
      }
    })

    let horariosBloqueados = 0

    // Para cada agenda (dia) na semana
    for (const agenda of agendas) {
      // Encontra reservas daquele dia
      const reservasDoDia = reservas.filter(r => r.data.toISOString() === agenda.data.toISOString())
      const slotsReservados = reservasDoDia.map(r => r.slot)

      // Se um horário não está nos slotsReservados, ele deve ser removido
      const novosHorarios = agenda.horarios.filter(h => slotsReservados.includes(h))

      if (novosHorarios.length !== agenda.horarios.length) {
        horariosBloqueados += (agenda.horarios.length - novosHorarios.length)

        if (novosHorarios.length === 0) {
          await prisma.agenda.delete({ where: { id: agenda.id } })
        } else {
          await prisma.agenda.update({
            where: { id: agenda.id },
            data: { horarios: novosHorarios }
          })
        }
      }
    }

    return NextResponse.json({ success: true, horariosBloqueados })
  } catch (error: unknown) {
    console.error('Erro ao bloquear semana:', error)
    return NextResponse.json({ error: 'Erro ao processar bloqueio' }, { status: 500 })
  }
}
