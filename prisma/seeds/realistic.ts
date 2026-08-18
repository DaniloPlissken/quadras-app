import { prisma, ensureDevEnvironment, gerarCpfValido, getDefaultPasswordHash, SLOTS_GERAL, SLOTS_TENIS, SLOTS_FUTEBOL_SAB, SLOTS_FUTEBOL_DOM, faker } from './utils';
import { addDays, startOfDay } from 'date-fns';

async function main() {
  ensureDevEnvironment();
  faker.seed(456);

  console.log('📈 Iniciando Seed Realista (Alto Volume)...');

  const pwd = await getDefaultPasswordHash();
  const QTD_USERS = Number(process.env.SEED_USERS) || 150;
  const QTD_TEAMS = Number(process.env.SEED_TEAMS) || 30;
  const DAYS_PAST = Number(process.env.SEED_DAYS_PAST) || 30;
  const DAYS_FUTURE = Number(process.env.SEED_DAYS_FUTURE) || 30;
  const OCCUPANCY_RATE = Number(process.env.SEED_OCCUPANCY_RATE) || 0.6; // 60%

  // 1. Users em Batch
  console.log(`Gerando ${QTD_USERS} usuários...`);
  const cpfsUsados = new Set<string>();
  const usersToCreate = [];
  
  // Garantir Admin e Usuario Teste
  usersToCreate.push({
    id: 'admin',
    name: 'Admin FUTEL',
    email: 'admin@futel.mg.gov.br',
    password: pwd,
    role: 'ADMIN',
  });

  usersToCreate.push({
    id: '12345678900',
    name: 'Cidadão / Usuário Teste',
    email: 'cidadao@teste.com',
    password: pwd,
    role: 'USER',
    telefone: '34999999999',
  });

  for (let i = 0; i < QTD_USERS; i++) {
    let cpf = gerarCpfValido();
    while(cpfsUsados.has(cpf)) cpf = gerarCpfValido();
    cpfsUsados.add(cpf);
    
    usersToCreate.push({
      id: cpf,
      name: faker.person.fullName(),
      email: faker.internet.email({ provider: 'example.com' }),
      password: pwd,
      telefone: faker.phone.number({ style: 'national' }),
      role: 'USER',
    });
  }
  
  for (const u of usersToCreate) {
    if (u.id === 'admin' || u.id === '12345678900') {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: u as any
      });
    }
  }
  await prisma.user.createMany({ 
    data: usersToCreate.filter(u => u.id !== 'admin' && u.id !== '12345678900') as any, 
    skipDuplicates: true 
  });
  
  const allUsers = await prisma.user.findMany({ select: { id: true }, where: { role: 'USER' } });

  // 2. Times de Futebol
  console.log(`Gerando ${QTD_TEAMS} times de futebol...`);
  const quadras = await prisma.quadra.findMany({ include: { modalidade: true } });
  
  if (quadras.length === 0) {
    console.error('⛔ Quadras não encontradas. Rode o seed oficial primeiro.');
    process.exit(1);
  }

  const timesCriados = [];
  for (let i = 0; i < QTD_TEAMS; i++) {
    const nomeTime = faker.company.name() + ' FC';
    const time = await prisma.time.upsert({
      where: { nome: nomeTime },
      update: {},
      create: {
        nome: nomeTime,
        status: faker.helpers.arrayElement(['APTO', 'PENDENTE', 'APTO', 'SUSPENSO']),
      }
    });
    timesCriados.push(time);
    
    for(let j = 0; j < 2; j++) {
      let cpfResp = gerarCpfValido();
      while(cpfsUsados.has(cpfResp)) cpfResp = gerarCpfValido();
      cpfsUsados.add(cpfResp);
      
      const p = await prisma.pessoa.create({
        data: {
          cpf: cpfResp,
          nome: faker.person.fullName(),
          telefone: faker.phone.number({ style: 'national' }),
          comprovanteResidencia: true,
          antecedentesCriminais: true,
        }
      });
      await prisma.responsavelTime.create({
        data: { pessoaId: p.id, timeId: time.id }
      });
    }
  }

  // 3. Agendas & Reservas
  console.log(`Gerando agendas e reservas (-${DAYS_PAST} a +${DAYS_FUTURE} dias)...`);
  const hoje = startOfDay(new Date());
  
  let totalReservas = 0;
  for (const quadra of quadras) {
    const isTenis = quadra.modalidade.nome.toLowerCase() === 'tênis';
    const isFutebol = quadra.modalidade.nome.toLowerCase() === 'futebol';
    let slotsPadrao = isTenis ? SLOTS_TENIS : SLOTS_GERAL;

    for (let d = -DAYS_PAST; d <= DAYS_FUTURE; d++) {
      const data = addDays(hoje, d);
      let slots = slotsPadrao;
      
      if (isFutebol) {
        if (data.getDay() === 6) slots = SLOTS_FUTEBOL_SAB;
        else if (data.getDay() === 0) slots = SLOTS_FUTEBOL_DOM;
      }
      
      if (faker.number.int({ min: 1, max: 10 }) === 1) continue;

      await prisma.agenda.upsert({
        where: { data_quadraId: { data, quadraId: quadra.id } },
        update: {},
        create: {
          data,
          quadraId: quadra.id,
          horarios: slots,
        }
      });

      const reservasBatch = [];
      for (const slot of slots) {
        if (Math.random() < OCCUPANCY_RATE) {
          let timeId = null;
          if (isFutebol && Math.random() < 0.8) {
            timeId = faker.helpers.arrayElement(timesCriados).id;
          }

          let status = 'CONFIRMADA';
          if (d < 0) status = faker.helpers.arrayElement(['CONCLUIDA', 'CONCLUIDA', 'CANCELADA_ADMIN']);
          else if (Math.random() < 0.1) status = 'CANCELADA_ADMIN';

          reservasBatch.push({
            userId: faker.helpers.arrayElement(allUsers).id,
            quadraId: quadra.id,
            data,
            slot,
            timeId,
            status,
          });
        }
      }
      
      if (reservasBatch.length > 0) {
         await prisma.reserva.createMany({
           data: reservasBatch as any,
           skipDuplicates: true
         });
         totalReservas += reservasBatch.length;
      }
    }
  }

  console.log(`✅ Seed Realista finalizado! (${totalReservas} reservas inseridas)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
