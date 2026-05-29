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

  await prisma.user.upsert({
    where: {
      email: 'teste@teste.com',
    },
    update: {},
    create: {
      name: 'Usuário Teste',
      email: 'teste@teste.com',
      password: '123456',
    },
  })

  await prisma.user.upsert({
    where: {
      email: 'teste2@teste.com',
    },
    update: {},
    create: {
      name: 'Usuário Teste 2',
      email: 'teste2@teste.com',
      password: '123456',
    },
  })

  console.log('Seed executado com sucesso!')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })