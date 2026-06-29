const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@futel.mg.gov.br' },
    update: {
      password: passwordHash,
      role: 'ADMIN',
    },
    create: {
      id: 'admin',        // id especial para o admin (não é CPF)
      name: 'Administrador FUTEL',
      email: 'admin@futel.mg.gov.br',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Admin criado com sucesso:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
