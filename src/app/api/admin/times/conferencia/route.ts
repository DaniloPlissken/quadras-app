import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { timeId, metodoConferencia, observacaoConferencia } = body

    if (!timeId || !metodoConferencia) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando (timeId ou metodoConferencia)' },
        { status: 400 }
      )
    }

    const timeAtualizado = await prisma.time.update({
      where: { id: timeId },
      data: {
        status: 'APTO',
        metodoConferencia,
        observacaoConferencia: observacaoConferencia || null,
        conferidoPorId: session.user.id,
        conferidoEm: new Date(),
      },
      include: {
        responsaveis: true,
      }
    })

    return NextResponse.json(timeAtualizado)
  } catch (error) {
    console.error('Erro na conferência do time:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar conferência e aptidão do time.' },
      { status: 500 }
    )
  }
}
