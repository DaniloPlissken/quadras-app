import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function nomeModalidadePorSlug(slug: string) {
  const mapa: Record<string, string> = {
    volei: 'Vôlei',
    'beach-tenis': 'Beach Tênis',
    tenis: 'Tênis',
    futebol: 'Futebol',
  }

  return mapa[slug]
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const modalidadeSlug = searchParams.get('modalidade')

  if (!modalidadeSlug) {
    return NextResponse.json(
      { error: 'Modalidade é obrigatória' },
      { status: 400 }
    )
  }

  const nomeModalidade = nomeModalidadePorSlug(modalidadeSlug)

  if (!nomeModalidade) {
    return NextResponse.json(
      { error: 'Modalidade inválida' },
      { status: 400 }
    )
  }

  const quadras = await prisma.quadra.findMany({
    where: {
      modalidade: {
        nome: nomeModalidade,
      },
    },
    orderBy: {
      nome: 'asc',
    },
  })

  return NextResponse.json(quadras)
}