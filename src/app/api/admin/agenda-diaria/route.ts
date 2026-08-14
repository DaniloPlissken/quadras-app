import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

function parseDataUTC(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const data = searchParams.get('data')
  const quadraId = searchParams.get('quadraId')
  const modalidade = searchParams.get('modalidade') // Opcional, para caso queira filtrar direto no backend

  if (!data) {
    return NextResponse.json({ error: 'data é obrigatório' }, { status: 400 })
  }

  // Define meia-noite até 23:59:59 daquele dia específico
  const inicio = parseDataUTC(data)
  
  const fim = new Date(inicio)
  fim.setUTCHours(23, 59, 59, 999)

  const quadraFiltro: Prisma.QuadraWhereInput = {}
  if (quadraId && quadraId !== 'todas') {
    quadraFiltro.id = quadraId
  }
  if (modalidade && modalidade !== 'todas') {
    quadraFiltro.modalidade = { nome: modalidade }
  }

  // Buscar apenas as quadras que dão match no filtro
  const quadras = await prisma.quadra.findMany({
    where: {
      ativa: true,
      ...quadraFiltro
    },
    include: {
      modalidade: true
    }
  })

  const quadraIds = quadras.map(q => q.id)

  const agendaWhere: Prisma.AgendaWhereInput = {
    data: {
      gte: inicio,
      lte: fim
    },
    quadraId: { in: quadraIds }
  }

  const agendas = await prisma.agenda.findMany({
    where: agendaWhere,
    orderBy: { quadraId: 'asc' }
  })

  const reservaWhere: Prisma.ReservaWhereInput = {
    data: {
      gte: inicio,
      lte: fim
    },
    quadraId: { in: quadraIds },
    status: { not: 'CANCELADA_ADMIN' }
  }

  const reservas = await prisma.reserva.findMany({
    where: reservaWhere,
    include: {
      user: { select: { id: true, name: true, email: true } },
      time: {
        include: {
          responsaveis: true
        }
      }
    }
  })

  return NextResponse.json({ quadras, agendas, reservas })
}
