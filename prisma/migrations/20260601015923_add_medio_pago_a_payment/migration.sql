-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "medioPago" "MedioPago";
