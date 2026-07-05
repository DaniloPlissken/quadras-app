import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const hoje = new Date()
    hoje.setUTCHours(0, 0, 0, 0)

    // Traz todas as agendas a partir de hoje
    const agendas = await prisma.agenda.findMany({
      where: {
        data: {
          gte: hoje,
        },
      },
      include: {
        quadra: {
          select: { 
            nome: true,
            modalidade: {
              select: { nome: true }
            }
          }
        }
      },
      orderBy: {
        data: 'asc',
      },
    })

    return NextResponse.json(agendas)
  } catch (error) {
    console.error('Erro ao buscar resumo de agendas:', error)
    return NextResponse.json({ error: 'Erro ao buscar resumo' }, { status: 500 })
  }
}
