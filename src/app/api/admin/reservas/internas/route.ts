import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { quadraId, data, slots, motivo } = body

    if (!quadraId || !data || !slots || !Array.isArray(slots) || slots.length === 0 || !motivo) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Criar a data (no mesmo formato que o restante do sistema)
    const dataAlvo = new Date(data)
    dataAlvo.setUTCHours(0, 0, 0, 0)

    // Validar se nenhum dos slots já está reservado
    const reservasExistentes = await prisma.reserva.findMany({
      where: {
        quadraId,
        data: dataAlvo,
        slot: { in: slots },
        status: 'CONFIRMADA'
      }
    })

    if (reservasExistentes.length > 0) {
      return NextResponse.json(
        { error: 'Um ou mais horários selecionados já estão reservados.' },
        { status: 400 }
      )
    }

    // Criar as reservas internas
    const criarReservas = slots.map(slot => {
      return prisma.reserva.create({
        data: {
          quadraId,
          data: dataAlvo,
          slot,
          status: 'CONFIRMADA',
          isAdminReserva: true,
          motivo,
          operadorId: session.user.id
        }
      })
    })

    await prisma.$transaction(criarReservas)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao criar reservas internas:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar reservas administrativas.' },
      { status: 500 }
    )
  }
}
