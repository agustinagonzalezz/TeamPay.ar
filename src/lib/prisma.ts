/**
 * Singleton de PrismaClient para Next.js — Prisma 7.
 *
 * Prisma 7 usa driver adapters para la conexión en runtime.
 * La URL de la base de datos se configura aquí (no en schema.prisma).
 *
 * En desarrollo, Next.js recarga módulos con HMR lo que crearía múltiples
 * instancias del cliente y del pool de conexiones. Este patrón reutiliza
 * la instancia guardándola en globalThis.
 *
 * En producción se crea una única instancia por proceso.
 *
 * El cliente es generado en src/generated/prisma/ con: npx prisma generate
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Revisá el archivo .env"
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
