// Prisma 7 — Configuración del CLI (migraciones, seed, datasource).
// El PrismaClient de runtime se configura en src/lib/prisma.ts con PrismaPg adapter.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL (conexión directa, sin pooler) tiene prioridad para el CLI —
    // migrate deploy necesita advisory locks que PgBouncer/el pooler de Neon
    // no soporta bien. En local no existe DIRECT_URL, así que cae a DATABASE_URL.
    // El cliente de runtime (src/lib/prisma.ts) sigue usando DATABASE_URL (pooled).
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
