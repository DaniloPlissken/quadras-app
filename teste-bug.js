const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('🧪 Iniciando Teste Manual do Fluxo de Reservas e Cancelamentos...\n');

  try {
    // 1. Pegar dados básicos do seed
    const quadra = await prisma.quadra.findFirst({
      where: { nome: 'Quadra 1', modalidade: { nome: 'Vôlei' } }
    });
    
    const user = await prisma.user.findUnique({
      where: { email: 'cidadao@teste.com' }
    });

    if (!quadra || !user) {
      throw new Error('Quadra ou Usuário de teste não encontrados. Rode o seed novamente.');
    }

    const dataTeste = new Date();
    dataTeste.setUTCDate(dataTeste.getUTCDate() + 2); // Daqui a 2 dias
    dataTeste.setUTCHours(0,0,0,0);
    const slot = '08:00-10:00';

    console.log(`📍 Testando na ${quadra.nome} - Data: ${dataTeste.toISOString().split('T')[0]} - Horário: ${slot}\n`);

    // --- PASSO 1: Criar a primeira reserva ---
    console.log('▶️  PASSO 1: Criando a primeira reserva...');
    const reserva1 = await prisma.reserva.create({
      data: {
        quadraId: quadra.id,
        userId: user.id,
        data: dataTeste,
        slot: slot
      }
    });
    console.log('✅ Reserva 1 criada com sucesso! (ID:', reserva1.id, ')\n');

    // --- PASSO 2: Tentar criar no mesmo horário (DEVE FALHAR) ---
    console.log('▶️  PASSO 2: Tentando criar outra reserva no mesmo horário ativo (Deve ser bloqueado)...');
    try {
      await prisma.reserva.create({
        data: { quadraId: quadra.id, userId: user.id, data: dataTeste, slot: slot }
      });
      console.log('❌ ERRO: A reserva foi criada, mas deveria ter sido bloqueada pela restrição única!');
    } catch (e) {
      if (e.code === 'P2002') {
        console.log('✅ Bloqueado com sucesso pelo banco de dados (Erro P2002).\n');
      } else {
        console.log('⚠️ Erro inesperado:', e.message);
      }
    }

    // --- PASSO 3: Administrador cancela a reserva ---
    console.log('▶️  PASSO 3: Cancelando a Reserva 1 (Simulando o Admin)...');
    await prisma.reserva.update({
      where: { id: reserva1.id },
      data: { 
        status: 'CANCELADA_ADMIN',
        cancelToken: reserva1.id // A correção que aplicamos!
      }
    });
    console.log('✅ Reserva 1 cancelada (status e cancelToken atualizados).\n');

    // --- PASSO 4: Tentar reservar novamente após o cancelamento (O ANTIGO BUG) ---
    console.log('▶️  PASSO 4: Criando uma nova reserva no horário que foi liberado...');
    const reserva2 = await prisma.reserva.create({
      data: {
        quadraId: quadra.id,
        userId: user.id,
        data: dataTeste,
        slot: slot
      }
    });
    console.log('✅ SUCESSO! A nova reserva foi criada sem erros. O bug está resolvido! (ID:', reserva2.id, ')\n');

    // --- Limpeza pós-teste ---
    await prisma.reserva.deleteMany({
      where: { id: { in: [reserva1.id, reserva2.id] } }
    });
    console.log('🧹 Limpeza dos dados de teste concluída.');

  } catch (error) {
    console.error('❌ O teste falhou:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
