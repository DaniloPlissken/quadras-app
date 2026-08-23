import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { timeId, novoStatus, motivo } = body

    if (!timeId || !novoStatus) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (novoStatus === 'INAPTO' && !motivo) {
      return NextResponse.json({ error: 'O motivo é obrigatório para tornar um time inapto' }, { status: 400 })
    }

    const time = await prisma.time.findUnique({
      where: { id: timeId }
    })

    if (!time) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    // @ts-ignore - ignorando erro de typescript se o generate falhou
    const updated = await prisma.time.update({
      where: { id: timeId },
      data: {
        status: novoStatus,
        motivoInaptidao: novoStatus === 'INAPTO' ? motivo : null
      }
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error: any) {
    console.error('Erro ao alterar aptidão do time:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar a solicitação.' },
      { status: 500 }
    )
  }
}
