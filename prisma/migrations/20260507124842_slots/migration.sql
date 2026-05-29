/*
  Warnings:

  - You are about to drop the column `fim` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `inicio` on the `Reserva` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[data,slot,quadraId]` on the table `Reserva` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `data` to the `Reserva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slot` to the `Reserva` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reserva" DROP COLUMN "fim",
DROP COLUMN "inicio",
ADD COLUMN     "data" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "slot" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_data_slot_quadraId_key" ON "Reserva"("data", "slot", "quadraId");
