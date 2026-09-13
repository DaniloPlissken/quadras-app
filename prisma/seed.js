/* eslint-disable @typescript-eslint/no-require-imports */  
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

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

async function criarUsuariosTeste() {
  console.log('Criando usuários de teste...')
  const hashedPassword = await bcrypt.hash('futel2026', 10)

  await prisma.user.upsert({
    where: { id: '00000000000' },
    update: {},
    create: {
      id: '00000000000',
      name: 'Usuário Teste Homologação',
      email: 'teste.cidadao@futel.mg.gov.br',
      password: hashedPassword,
      role: 'USER',
    }
  })

  await prisma.user.upsert({
    where: { email: 'teste.admin@futel.mg.gov.br' },
    update: {},
    create: {
      id: '11111111111',
      name: 'Admin Teste Homologação',
      email: 'teste.admin@futel.mg.gov.br',
      password: hashedPassword,
      role: 'ADMIN',
    }
  })
}

async function main() {
  await criarUsuariosTeste()

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
    'Campo A',
    'Campo B',
    'Campo C',
    'Campo D',
    'Campo E',
    'Campo F',
  ])

  console.log('Seed executado com sucesso!')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })