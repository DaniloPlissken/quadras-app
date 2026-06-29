import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
  const dataFiltro = searchParams.get('data')
  const quadraIdFiltro = searchParams.get('quadraId')

  const where: Record<string, unknown> = {
    status: { not: 'CANCELADA_ADMIN' },
  }

  if (dataFiltro) {
    const data = parseDataUTC(dataFiltro)
    const fimDoDia = new Date(data)
    fimDoDia.setUTCHours(23, 59, 59, 999)
    where.data = { gte: data, lte: fimDoDia }
  }

  if (quadraIdFiltro) {
    where.quadraId = quadraIdFiltro
  }

  const reservas = await prisma.reserva.findMany({
    where,
    include: {
      user: { select: { name: true, id: true, email: true } },
      quadra: { include: { modalidade: true } },
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
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID e status são obrigatórios.' },
        { status: 400 }
      )
    }

    const reserva = await prisma.reserva.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(reserva)
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar reserva' },
      { status: 500 }
    )
  }
}
