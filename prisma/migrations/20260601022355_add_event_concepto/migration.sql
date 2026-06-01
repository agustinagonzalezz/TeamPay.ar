-- CreateTable
CREATE TABLE "EventConcepto" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventConcepto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventConcepto_eventId_idx" ON "EventConcepto"("eventId");

-- AddForeignKey
ALTER TABLE "EventConcepto" ADD CONSTRAINT "EventConcepto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
