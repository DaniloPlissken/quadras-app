import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const times = await prisma.time.findMany({
    include: {
      responsavel: { select: { name: true, id: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(times)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { nome, cpfResponsavel } = body

    if (!nome || !cpfResponsavel) {
      return NextResponse.json(
        { error: 'Nome do time e CPF do responsável são obrigatórios.' },
        { status: 400 }
      )
    }

    const cpfLimpo = cpfResponsavel.replace(/\D/g, '')

    // CPF é o id do User
    const user = await prisma.user.findUnique({
      where: { id: cpfLimpo },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Nenhum usuário encontrado com esse CPF.' },
        { status: 404 }
      )
    }

    const time = await prisma.time.create({
      data: {
        nome,
        userId: user.id,
      },
      include: {
        responsavel: { select: { name: true, id: true, email: true } },
      },
    })

    return NextResponse.json(time, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao criar time:', error)
    const message = error instanceof Error && error.message.includes('Unique')
      ? 'Já existe um time com esse nome.'
      : 'Erro ao criar time.'
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
        { error: 'ID do time é obrigatório' },
        { status: 400 }
      )
    }

    await prisma.time.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao remover time:', error)
    return NextResponse.json(
      { error: 'Erro ao remover time' },
      { status: 500 }
    )
  }
}
