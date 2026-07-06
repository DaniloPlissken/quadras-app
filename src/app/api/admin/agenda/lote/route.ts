import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SLOTS_PADRAO = [
  '06:00-08:00', '08:00-10:00', '10:00-12:00', '12:00-14:00',
  '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-21:45',
]

const SLOTS_TENIS = [
  '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
  '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00',
  '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-21:45',
]

function parseDataUTC(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}

function getMondayAndSunday(dateStr: string) {
  const d = parseDataUTC(dateStr)
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  
  const monday = new Date(d)
  monday.setUTCDate(diff)
  
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  
  return { monday, sunday }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { dataBase, feriadoData } = body

    if (!dataBase) {
      return NextResponse.json(
        { error: 'A data base da semana é obrigatória.' },
        { status: 400 }
      )
    }

    const { monday } = getMondayAndSunday(dataBase)
    
    // Calcula Sabado e Domingo a partir da segunda-feira
    const sabado = new Date(monday)
    sabado.setUTCDate(monday.getUTCDate() + 5)
    
    const domingo = new Date(monday)
    domingo.setUTCDate(monday.getUTCDate() + 6)

    const datasParaInserir: Date[] = [sabado, domingo]

    if (feriadoData) {
      datasParaInserir.push(parseDataUTC(feriadoData))
    }

    const quadras = await prisma.quadra.findMany({
      where: { ativa: true },
      include: { modalidade: true }
    })

    if (quadras.length === 0) {
      return NextResponse.json({ error: 'Nenhuma quadra encontrada no sistema.' }, { status: 400 })
    }

    let contagem = 0

    // Upsert para cada quadra em cada dia selecionado
    for (const quadra of quadras) {
      const horarios = quadra.modalidade.nome === 'Tênis' ? [...SLOTS_TENIS] : [...SLOTS_PADRAO]
      
      for (const data of datasParaInserir) {
        await prisma.agenda.upsert({
          where: {
            data_quadraId: {
              data,
              quadraId: quadra.id,
            },
          },
          update: {
            horarios, // Se já existir, sobrescreve com o padrão
          },
          create: {
            data,
            quadraId: quadra.id,
            horarios,
          },
        })
        contagem++
      }
    }

    return NextResponse.json({ ok: true, agendasAfetadas: contagem }, { status: 201 })
  } catch (error) {
    console.error('Erro ao liberar agendas em lote:', error)
    return NextResponse.json(
      { error: 'Erro interno ao realizar liberação em lote' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { dataBase } = body

    if (!dataBase) {
      return NextResponse.json(
        { error: 'A data base da semana é obrigatória.' },
        { status: 400 }
      )
    }

    const { monday, sunday } = getMondayAndSunday(dataBase)

    // Opção A: Apaga TODA a semana, garantindo limpeza completa
    const res = await prisma.agenda.deleteMany({
      where: {
        data: {
          gte: monday,
          lte: sunday
        }
      }
    })

    return NextResponse.json({ ok: true, agendasAfetadas: res.count })
  } catch (error) {
    console.error('Erro ao remover agendas em lote:', error)
    return NextResponse.json(
      { error: 'Erro interno ao realizar fechamento em lote' },
      { status: 500 }
    )
  }
}
