-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ENTRENADOR', 'CANCHA', 'ARBITROS', 'INDUMENTARIA', 'OTRO');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "category" "ExpenseCategory" NOT NULL DEFAULT 'OTRO';

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "shirtNumber" INTEGER;
