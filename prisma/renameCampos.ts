import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const campos = await prisma.quadra.findMany({
    where: { nome: { startsWith: 'Campo ' } }
  })

  const mapToLetters: Record<string, string> = {
    'Campo 1': 'Campo A',
    'Campo 2': 'Campo B',
    'Campo 3': 'Campo C',
    'Campo 4': 'Campo D',
    'Campo 5': 'Campo E',
    'Campo 6': 'Campo F',
  }

  for (const c of campos) {
    if (mapToLetters[c.nome]) {
      await prisma.quadra.update({
        where: { id: c.id },
        data: { nome: mapToLetters[c.nome] }
      })
      console.log(`Atualizado ${c.nome} -> ${mapToLetters[c.nome]}`)
    }
  }

  console.log('Todos os campos foram atualizados com sucesso.')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
