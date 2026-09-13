"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { addDays, startOfDay, getDay } from "date-fns";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Não autorizado");
  }
}

function gerarCpfValido(): string {
  const calc = (n: number[]) => {
    const s = n.reduce((acc, val, i) => acc + val * (n.length + 1 - i), 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  n.push(calc(n));
  n.push(calc(n));
  return n.join('');
}

const SLOTS_GERAL = [
  '06:00-08:00', '08:00-10:00', '10:00-12:00', '12:00-14:00',
  '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-21:45'
];

const SLOTS_TENIS = [
  '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
  '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00',
  '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-21:45'
];

const SLOTS_FUTEBOL_SAB = [
  '09:00-11:00', '14:00-16:00', '16:00-18:00'
];

const SLOTS_FUTEBOL_DOM = [
  '08:00-10:00', '10:00-12:00', '15:00-17:00'
];

export async function cleanDatabaseAction() {
  await verifyAdmin();

  // Executando deleções primárias em transação para maior performance
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany(),
    prisma.reserva.deleteMany(),
    prisma.agenda.deleteMany(),
    prisma.responsavelTime.deleteMany(),
    prisma.time.deleteMany(),
  ]);

  // Preservar Admin e cidadao teste
  const usersToKeep = ['teste.admin@futel.mg.gov.br', 'teste.cidadao@futel.mg.gov.br'];
  
  const remainingUsers = await prisma.user.findMany({
    where: { pessoaId: { not: null }, email: { in: usersToKeep } },
    select: { pessoaId: true }
  });
  
  await prisma.user.deleteMany({
    where: {
      email: { notIn: usersToKeep }
    }
  });

  const keepPessoaIds = remainingUsers.map(u => u.pessoaId).filter(Boolean) as string[];

  if (keepPessoaIds.length > 0) {
    await prisma.pessoa.deleteMany({
      where: { id: { notIn: keepPessoaIds } }
    });
  } else {
    await prisma.pessoa.deleteMany();
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Banco de dados limpo com sucesso! (Quadras, Admin e Usuário Teste mantidos)" };
}

export async function runDemoSeedAction() {
  await verifyAdmin();

  const pwd = await bcrypt.hash('123456', 10);
  const quadras = await prisma.quadra.findMany({ include: { modalidade: true } });
  
  if (quadras.length === 0) {
    throw new Error('Nenhuma quadra encontrada. Certifique-se de rodar o seed base localmente.');
  }

  const hoje = new Date();
  const hojeUTC = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));
  let diasParaSabado = 6 - hojeUTC.getUTCDay();
  if (diasParaSabado <= 0) diasParaSabado += 7; 
  
  const sabado = new Date(hojeUTC);
  sabado.setUTCDate(sabado.getUTCDate() + diasParaSabado);
  
  const domingo = new Date(sabado);
  domingo.setUTCDate(domingo.getUTCDate() + 1);
  
  const datasFinalSemana = [sabado, domingo];

  const cpfsUsados = new Set<string>();

  // Estruturas de dados em memória para inserção em lote (bulk insert)
  const timesData: any[] = [];
  const pessoasData: any[] = [];
  const responsaveisData: any[] = [];
  const agendasData: any[] = [];
  const usersData: any[] = [];
  const reservasData: any[] = [];

  const timesCriados = [];

  // Gerar dados dos times
  for (let i = 1; i <= 20; i++) {
    const nomeTime = `Time Teste FC ${i}`;
    const timeId = crypto.randomUUID();
    
    timesData.push({ id: timeId, nome: nomeTime, status: 'APTO' });
    timesCriados.push({ id: timeId, nome: nomeTime });
    
    for(let j = 1; j <= 2; j++) {
      let cpfResp = gerarCpfValido();
      while(cpfsUsados.has(cpfResp)) cpfResp = gerarCpfValido();
      cpfsUsados.add(cpfResp);
      
      const pessoaId = crypto.randomUUID();
      pessoasData.push({
        id: pessoaId,
        cpf: cpfResp,
        nome: `Responsável ${j} do Time ${i}`,
        telefone: `349999999${(i * j) % 10}`,
        comprovanteResidencia: true,
        antecedentesCriminais: true,
      });
      
      responsaveisData.push({
        id: crypto.randomUUID(),
        pessoaId: pessoaId,
        timeId: timeId
      });
    }
  }

  let totalReservas = 0;
  
  // Gerar dados de agendas e reservas
  for (const quadra of quadras) {
    const isTenis = quadra.modalidade.nome.toLowerCase() === 'tênis';
    const isFutebol = quadra.modalidade.nome.toLowerCase() === 'futebol';
    let slotsPadrao = isTenis ? SLOTS_TENIS : SLOTS_GERAL;

    for (const data of datasFinalSemana) {
      let slots = slotsPadrao;
      if (isFutebol) {
        if (data.getDay() === 6) slots = SLOTS_FUTEBOL_SAB;
        else if (data.getDay() === 0) slots = SLOTS_FUTEBOL_DOM;
      }

      agendasData.push({
        id: crypto.randomUUID(),
        data,
        quadraId: quadra.id,
        horarios: slots,
      });

      for (const slot of slots) {
        let cpfUnico = gerarCpfValido();
        while(cpfsUsados.has(cpfUnico)) cpfUnico = gerarCpfValido();
        cpfsUsados.add(cpfUnico);

        usersData.push({
          id: cpfUnico,
          name: `Usuário ${totalReservas + 1}`,
          email: `teste${totalReservas + 1}@futel.mg.gov.br`,
          password: pwd,
          telefone: `34999999999`,
          role: 'USER',
        });

        let timeId = null;
        if (isFutebol) {
          timeId = timesCriados[totalReservas % timesCriados.length].id;
        }

        reservasData.push({
          id: crypto.randomUUID(),
          userId: cpfUnico,
          quadraId: quadra.id,
          data,
          slot,
          status: 'CONFIRMADA',
          timeId,
          cancelToken: '',
        });
        totalReservas++;
      }
    }
  }

  // Executar todas as inserções em lote em uma única transação super rápida
  await prisma.$transaction([
    prisma.time.createMany({ data: timesData, skipDuplicates: true }),
    prisma.pessoa.createMany({ data: pessoasData, skipDuplicates: true }),
    prisma.responsavelTime.createMany({ data: responsaveisData, skipDuplicates: true }),
    prisma.agenda.createMany({ data: agendasData, skipDuplicates: true }),
    prisma.user.createMany({ data: usersData, skipDuplicates: true }),
    prisma.reserva.createMany({ data: reservasData, skipDuplicates: true }),
  ]);

  revalidatePath("/", "layout");
  return { success: true, message: `Seed super rápido finalizado! ${totalReservas} reservas criadas no FDS.` };
}
