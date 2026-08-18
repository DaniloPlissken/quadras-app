import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pwd = await bcrypt.hash('123456', 10);
  
  await prisma.user.upsert({
    where: { email: 'cidadao@teste.com' },
    update: {},
    create: {
      id: '12345678900',
      name: 'Cidadão / Usuário Teste',
      email: 'cidadao@teste.com',
      password: pwd,
      role: 'USER',
      telefone: '34999999999',
    }
  });

  console.log('Usuário de teste criado!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
