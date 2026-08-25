import { prisma, ensureDevEnvironment } from './utils';

async function main() {
  ensureDevEnvironment();

  console.log('🧹 Iniciando limpeza do banco de dados (preservando Quadras e Modalidades)...');

  // Deleta tudo seguindo a ordem de chaves estrangeiras
  await prisma.passwordResetToken.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.agenda.deleteMany();
  await prisma.responsavelTime.deleteMany();
  await prisma.time.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pessoa.deleteMany();

  console.log('✅ Banco de dados limpo com sucesso! (Quadras e Modalidades foram mantidas)');
}

main()
  .catch((e) => {
    console.error('Erro na limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
