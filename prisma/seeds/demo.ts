import { prisma, ensureDevEnvironment, gerarCpfValido, getDefaultPasswordHash, SLOTS_GERAL, SLOTS_TENIS, faker } from './utils';
import { addDays, startOfDay, getDay } from 'date-fns';

async function main() {
  ensureDevEnvironment();
  faker.seed(123);

  console.log('🚀 Iniciando Seed de Demonstração (Fim de Semana Lotado)...');

  const pwd = await getDefaultPasswordHash();

  const adminId = 'admin';
  await prisma.user.upsert({
    where: { email: 'admin@futel.mg.gov.br' },
    update: {},
    create: {
      id: adminId,
      name: 'Admin FUTEL',
      email: 'admin@futel.mg.gov.br',
      password: pwd,
      role: 'ADMIN',
    }
  });

  const quadras = await prisma.quadra.findMany({ include: { modalidade: true } });
  if (quadras.length === 0) {
    console.error('⛔ Nenhuma quadra encontrada. Rode "node prisma/seed.js" primeiro.');
    process.exit(1);
  }

  // Descobrir as datas do próximo fim de semana com segurança de timezone
  // Pega a data local exatamente à meia-noite
  const hoje = startOfDay(new Date());
  let diasParaSabado = 6 - getDay(hoje);
  // Se for hoje (sábado=6), vai jogar pro outro sábado, a menos que consideremos hoje. Vamos jogar para o PRÓXIMO fim de semana sempre.
  if (diasParaSabado <= 0) diasParaSabado += 7; 
  const sabado = addDays(hoje, diasParaSabado);
  const domingo = addDays(sabado, 1);
  
  const datasFinalSemana = [sabado, domingo];

  // Vamos garantir Times para o Futebol
  const timesCriados = [];
  const cpfsUsados = new Set<string>();

  console.log('Gerando Times de Futebol e responsáveis...');
  for (let i = 0; i < 20; i++) {
    const nomeTime = faker.company.name() + ' FC';
    const time = await prisma.time.upsert({
      where: { nome: nomeTime },
      update: {},
      create: {
        nome: nomeTime,
        status: 'APTO',
      }
    });
    timesCriados.push(time);
    
    // Add 2 responsaveis
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

  console.log('Preenchendo Agenda e Reservas exclusivas (1 reserva por usuário) no fim de semana...');
  let totalReservas = 0;
  
  for (const quadra of quadras) {
    const isTenis = quadra.modalidade.nome.toLowerCase() === 'tênis';
    const isFutebol = quadra.modalidade.nome.toLowerCase() === 'futebol';
    const slots = isTenis ? SLOTS_TENIS : SLOTS_GERAL;

    for (const data of datasFinalSemana) {
      await prisma.agenda.upsert({
        where: { data_quadraId: { data, quadraId: quadra.id } },
        update: {},
        create: {
          data,
          quadraId: quadra.id,
          horarios: slots,
        }
      });

      for (const slot of slots) {
        // Criar um usuário 100% exclusivo para não estourar a regra de 1 reserva por fim de semana
        let cpfUnico = gerarCpfValido();
        while(cpfsUsados.has(cpfUnico)) cpfUnico = gerarCpfValido();
        cpfsUsados.add(cpfUnico);

        const userUnico = await prisma.user.create({
          data: {
            id: cpfUnico,
            name: faker.person.fullName(),
            email: faker.internet.email({ provider: 'example.com' }),
            password: pwd,
            telefone: faker.phone.number({ style: 'national' }),
            role: 'USER',
          }
        });

        let timeId = null;
        if (isFutebol) {
          timeId = faker.helpers.arrayElement(timesCriados).id;
        }

        await prisma.reserva.upsert({
          where: { data_slot_quadraId_cancelToken: { data, slot, quadraId: quadra.id, cancelToken: '' } },
          update: {},
          create: {
            userId: userUnico.id,
            quadraId: quadra.id,
            data,
            slot,
            status: 'CONFIRMADA',
            timeId,
          }
        });
        totalReservas++;
      }
    }
  }

  // Hackzinho visual para converter as datas no log sem o fuso problemático
  const fmtStr = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`✅ Fim de semana (${fmtStr(sabado)} e ${fmtStr(domingo)}) lotado com sucesso! (${totalReservas} reservas preenchidas)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
