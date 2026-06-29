/*
  Warnings:

  - A unique constraint covering the columns `[data,userId]` on the table `Reserva` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Reserva_data_userId_key" ON "Reserva"("data", "userId");
