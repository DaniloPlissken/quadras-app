import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Usuário não autenticado.' },
      { status: 401 }
    )
  }

  const minhasReservas = await prisma.reserva.findMany({
    where: {
      userId: session.user.id,
      status: { not: 'CANCELADA_ADMIN' },
    },
    take: 200,
    orderBy: [{ data: 'desc' }, { slot: 'asc' }],
    select: {
      id: true,
      data: true,
      slot: true,
      quadraId: true,
      status: true,
    }
  })

  return NextResponse.json(minhasReservas)
}
