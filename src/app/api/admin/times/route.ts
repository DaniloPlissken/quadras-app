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
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const times = await prisma.time.findMany({
    take: 500,
    include: {
      responsaveis: {
        include: { pessoa: true }
      },
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
    const cpfsTratados = responsaveis.map((r: ResponsavelInput) => r.cpf.replace(/\D/g, ''))
    
    // Validar se algum dos CPFs já está em um time APTO, PENDENTE ou SUSPENSO
    const timesConflitantes = await prisma.time.findFirst({
      where: {
        status: { in: ['APTO', 'PENDENTE', 'SUSPENSO'] },
        responsaveis: {
          some: {
            pessoa: {
              cpf: { in: cpfsTratados }
            }
          }
        }
      }
    })

    if (timesConflitantes) {
      return NextResponse.json(
        { error: 'Um ou mais CPFs informados já estão vinculados a um time ativo.' },
        { status: 400 }
      )
    }

    const pessoasIds = []
    for (const r of responsaveis) {
      const cpfLimpo = r.cpf.replace(/\D/g, '')
      const pessoa = await prisma.pessoa.upsert({
        where: { cpf: cpfLimpo },
        update: {
          nome: r.nome,
          telefone: r.telefone,
          comprovanteResidencia: r.comprovanteResidencia,
          urlComprovante: r.urlComprovante,
          antecedentesCriminais: r.antecedentesCriminais,
          urlAntecedentes: r.urlAntecedentes
        },
        create: {
          cpf: cpfLimpo,
          nome: r.nome,
          telefone: r.telefone,
          comprovanteResidencia: r.comprovanteResidencia || false,
          urlComprovante: r.urlComprovante,
          antecedentesCriminais: r.antecedentesCriminais || false,
          urlAntecedentes: r.urlAntecedentes
        }
      })
      pessoasIds.push(pessoa.id)
    }

    const time = await prisma.time.create({
      data: {
        nome,
        responsaveis: {
          create: pessoasIds.map(id => ({ pessoaId: id }))
        },
      },
      include: {
        responsaveis: {
          include: { pessoa: true }
        }
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
