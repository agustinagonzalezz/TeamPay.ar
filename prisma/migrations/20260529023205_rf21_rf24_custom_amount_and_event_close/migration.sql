-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "closedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EventParticipant" ADD COLUMN     "customAmount" DECIMAL(12,2);
