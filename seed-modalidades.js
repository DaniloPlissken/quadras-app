const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const modalidades = ['Vôlei', 'Beach Tênis', 'Tênis', 'Futebol']

  for (const nome of modalidades) {
    await prisma.modalidade.upsert({
      where: { nome },
      update: {},
      create: { nome },
    })
    console.log(`✅ Modalidade "${nome}" criada/confirmada.`)
  }

  console.log('\nTodas as modalidades estão no banco!')
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
