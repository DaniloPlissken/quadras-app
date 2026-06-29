import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const quadras = await prisma.quadra.findMany({
    include: { modalidade: true },
    orderBy: [{ modalidade: { nome: 'asc' } }, { nome: 'asc' }],
  })

  return NextResponse.json(quadras)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { nome, modalidadeId } = body

    if (!nome || !modalidadeId) {
      return NextResponse.json(
        { error: 'Nome e modalidade são obrigatórios.' },
        { status: 400 }
      )
    }

    const quadra = await prisma.quadra.create({
      data: { nome, modalidadeId },
      include: { modalidade: true },
    })

    return NextResponse.json(quadra, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao criar quadra:', error)
    const message = error instanceof Error && error.message.includes('Unique')
      ? 'Já existe uma quadra com esse nome nessa modalidade.'
      : 'Erro ao criar quadra.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da quadra é obrigatório' },
        { status: 400 }
      )
    }

    // Only block if there are ACTIVE (non-cancelled) reservations
    const reservasAtivas = await prisma.reserva.count({
      where: { quadraId: id, status: { not: 'CANCELADA_ADMIN' } },
    })
    if (reservasAtivas > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: existem ${reservasAtivas} reserva(s) ativa(s) vinculadas. Cancele-as primeiro.` },
        { status: 400 }
      )
    }

    // Delete cancelled reservations, agendas, then the quadra
    await prisma.reserva.deleteMany({ where: { quadraId: id, status: 'CANCELADA_ADMIN' } })
    await prisma.agenda.deleteMany({ where: { quadraId: id } })
    await prisma.quadra.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao remover quadra:', error)
    return NextResponse.json(
      { error: 'Erro ao remover quadra' },
      { status: 500 }
    )
  }
}
