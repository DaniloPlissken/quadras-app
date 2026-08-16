import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ResponsavelInput {
  cpf: string
  nome: string
  telefone: string
  comprovanteResidencia?: boolean
  urlComprovante?: string | null
  antecedentesCriminais?: boolean
  urlAntecedentes?: string | null
  apto?: boolean
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const times = await prisma.time.findMany({
    take: 500,
    include: {
      responsaveis: true,
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
    const { nome, responsaveis } = body

    if (!nome || !responsaveis || !Array.isArray(responsaveis) || responsaveis.length !== 2) {
      return NextResponse.json(
        { error: 'Nome do time e dois responsáveis são obrigatórios.' },
        { status: 400 }
      )
    }

    // Tratar CPF: manter apenas os números e mapear os dados corretamente
    const responsaveisTratados = (responsaveis as ResponsavelInput[]).map((r: ResponsavelInput) => ({
      cpf: r.cpf.replace(/\D/g, ''),
      nome: r.nome,
      telefone: r.telefone,
      comprovanteResidencia: r.comprovanteResidencia,
      urlComprovante: r.urlComprovante,
      antecedentesCriminais: r.antecedentesCriminais,
      urlAntecedentes: r.urlAntecedentes,
      apto: r.apto
    }))

    const time = await prisma.time.create({
      data: {
        nome,
        responsaveis: {
          create: responsaveisTratados,
        },
      },
      include: {
        responsaveis: true,
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
  } catch (error: unknown) {
    console.error('Erro ao remover time:', error)
    return NextResponse.json(
      { error: 'Erro ao remover time' },
      { status: 500 }
    )
  }
}
