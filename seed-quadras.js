/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SLOTS_PADRAO = [
  '06:00-08:00',
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
  '20:00-21:45',
];

const SLOTS_TENIS = [
  '06:00-07:00',
  '07:00-08:00',
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
  '18:00-19:00',
  '19:00-20:00',
  '20:00-21:00',
  '21:00-21:45',
];

async function main() {
  console.log('Iniciando população do banco de dados...\n');

  // 1. Modalidades e suas respectivas Quadras
  const modalidadesComQuadras = [
  {
    nome: 'Vôlei',
    quadras: [
      'Quadra 1',
      'Quadra 2',
      'Quadra 3',
      'Quadra 4',
    ],
  },
  {
    nome: 'Beach Tênis',
    quadras: [
      'Quadra 1',
      'Quadra 2',
      'Quadra 3',
      'Quadra 4',
      'Quadra 5',
    ],
  },
  {
    nome: 'Tênis',
    quadras: [
      'Quadra 1',
    ],
  },
  {
    nome: 'Futebol',
    quadras: [
      'Campo 1',
      'Campo 2',
      'Campo 3',
      'Campo 4',
      'Campo 5',
      'Campo 6',
    ],
  },
];

  const todasQuadras = [];

  for (const item of modalidadesComQuadras) {
    const modalidade = await prisma.modalidade.upsert({
      where: { nome: item.nome },
      update: {},
      create: { nome: item.nome },
    });
    console.log(`Modalidade: ${modalidade.nome}`);

    for (const nomeQuadra of item.quadras) {
      const quadra = await prisma.quadra.upsert({
        where: {
          nome_modalidadeId: {
            nome: nomeQuadra,
            modalidadeId: modalidade.id,
          },
        },
        update: { ativa: true },
        create: {
          nome: nomeQuadra,
          modalidadeId: modalidade.id,
          ativa: true,
        },
      });
      todasQuadras.push({ ...quadra, modalidadeNome: modalidade.nome });
      console.log(`Quadra criada/atualizada: ${quadra.nome}`);
    }
  }

  // 2. Gerar Agendas para os próximos 14 dias (incluindo hoje)
  console.log('\nGerando agendas/horários disponíveis para os próximos 14 dias...');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let totalAgendasCriadas = 0;

  for (let i = 0; i < 14; i++) {
    const dataAgenda = new Date(hoje);
    dataAgenda.setDate(dataAgenda.getDate() + i);

    // Ajusta para UTC midnight para consistência com as rotas
    const ano = dataAgenda.getFullYear();
    const mes = dataAgenda.getMonth();
    const dia = dataAgenda.getDate();
    const dataUTC = new Date(Date.UTC(ano, mes, dia));

    for (const quadra of todasQuadras) {
      const horarios =
        quadra.modalidadeNome === 'Tênis' ? [...SLOTS_TENIS] : [...SLOTS_PADRAO];

      await prisma.agenda.upsert({
        where: {
          data_quadraId: {
            data: dataUTC,
            quadraId: quadra.id,
          },
        },
        update: { horarios },
        create: {
          data: dataUTC,
          quadraId: quadra.id,
          horarios,
        },
      });
      totalAgendasCriadas++;
    }
  }

  console.log(`${totalAgendasCriadas} registros de agenda criados/atualizados com sucesso!`);

  // 3. Criar Usuário Comum para testes
  console.log('\nCriando usuário comum para testes...');
  const senhaHash = await bcrypt.hash('123456', 10);
  const usuarioTeste = await prisma.user.upsert({
    where: { email: 'cidadao@teste.com' },
    update: {
      password: senhaHash,
    },
    create: {
      id: '12345678900', // CPF de teste
      name: 'João Cidadão de Teste',
      email: 'cidadao@teste.com',
      password: senhaHash,
      role: 'USER',
    },
  });
  console.log(`Usuário criado: ${usuarioTeste.name} (${usuarioTeste.email} / CPF: ${usuarioTeste.id}) - Senha: 123456`);

  // 4. Criar um Time de exemplo com responsável
  console.log('\nCriando time de teste...');
  const timeTeste = await prisma.time.upsert({
    where: { nome: 'Os Galáticos FC' },
    update: {},
    create: {
      nome: 'Os Galáticos FC',
      responsaveis: {
        create: {
          cpf: '12345678900',
          nome: 'João Cidadão de Teste',
          telefone: '(34) 99999-8888',
          comprovanteResidencia: true,
          antecedentesCriminais: true,
          apto: true,
        },
      },
    },
  });
  console.log(`Time criado: ${timeTeste.nome}`);

  console.log('\nBanco de dados populado com sucesso e pronto para testes!');
}

main()
  .catch((e) => {
    console.error('Erro ao popular banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
