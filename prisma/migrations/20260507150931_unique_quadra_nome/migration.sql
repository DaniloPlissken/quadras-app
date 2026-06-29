/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `Quadra` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Quadra_nome_key" ON "Quadra"("nome");
