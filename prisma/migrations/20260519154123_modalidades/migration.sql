/*
  Warnings:

  - A unique constraint covering the columns `[nome,modalidadeId]` on the table `Quadra` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `modalidadeId` to the `Quadra` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Quadra_nome_key";

-- AlterTable
ALTER TABLE "Quadra" ADD COLUMN     "modalidadeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Modalidade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Modalidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Modalidade_nome_key" ON "Modalidade"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Quadra_nome_modalidadeId_key" ON "Quadra"("nome", "modalidadeId");

-- AddForeignKey
ALTER TABLE "Quadra" ADD CONSTRAINT "Quadra_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "Modalidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
