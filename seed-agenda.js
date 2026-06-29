const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const quadras = await prisma.quadra.findMany()
  if (quadras.length === 0) {
    console.log('Nenhuma quadra encontrada no banco.')
    return
  }

  const quadra = quadras[0]

  const dataAmanha = new Date()
  dataAmanha.setDate(dataAmanha.getDate() + 1)
  dataAmanha.setHours(0, 0, 0, 0)

  try {
    const agenda = await prisma.agenda.create({
      data: {
        data: dataAmanha,
        quadraId: quadra.id,
        horarios: ['06:00-08:00', '08:00-10:00', '18:00-20:00'],
      },
    })
    console.log('✅ Agenda teste criada com sucesso para a data:', dataAmanha.toISOString().split('T')[0])
  } catch(e) {
    console.log('Agenda já existe ou erro:', e.message)
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
