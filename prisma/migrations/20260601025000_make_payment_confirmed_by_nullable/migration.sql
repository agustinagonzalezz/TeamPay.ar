-- AlterTable: Make Payment.confirmedById nullable and add onDelete SetNull (RF-05)
ALTER TABLE "Payment" ALTER COLUMN "confirmedById" DROP NOT NULL;

-- DropForeignKey and recreate with onDelete: SetNull
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_confirmedById_fkey";

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
