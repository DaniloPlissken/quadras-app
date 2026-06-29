const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function criarModalidadeComQuadras(nomeModalidade, nomesQuadras) {
  const modalidade = await prisma.modalidade.upsert({
    where: {
      nome: nomeModalidade,
    },
    update: {},
    create: {
      nome: nomeModalidade,
    },
  })

  for (const nomeQuadra of nomesQuadras) {
    await prisma.quadra.upsert({
      where: {
        nome_modalidadeId: {
          nome: nomeQuadra,
          modalidadeId: modalidade.id,
        },
      },
      update: {},
      create: {
        nome: nomeQuadra,
        modalidadeId: modalidade.id,
      },
    })
  }
}

async function main() {
  await criarModalidadeComQuadras('Vôlei', [
    'Quadra 1',
    'Quadra 2',
    'Quadra 3',
    'Quadra 4',
  ])

  await criarModalidadeComQuadras('Beach Tênis', [
    'Quadra 1',
    'Quadra 2',
    'Quadra 3',
    'Quadra 4',
    'Quadra 5',
  ])

  await criarModalidadeComQuadras('Tênis', ['Quadra 1'])

  await criarModalidadeComQuadras('Futebol', [
    'Campo 1',
    'Campo 2',
    'Campo 3',
    'Campo 4',
    'Campo 5',
    'Campo 6',
  ])

  console.log('Seed executado com sucesso!')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })