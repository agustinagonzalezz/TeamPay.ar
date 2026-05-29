/**
 * src/lib/validations/gasto.ts — Schemas de Zod para la entidad Gasto
 */

import { z } from "zod"

export const EXPENSE_CATEGORY_LABELS = {
  ENTRENADOR:   "Entrenador",
  CANCHA:       "Cancha",
  ARBITROS:     "Árbitros",
  INDUMENTARIA: "Indumentaria",
  OTRO:         "Otro",
} as const

export const createGastoSchema = z.object({
  concept: z
    .string()
    .min(3, "El concepto debe tener al menos 3 caracteres")
    .max(100, "El concepto no puede superar los 100 caracteres")
    .trim(),

  amount: z
    .number({ error: "Ingresá un monto válido" })
    .positive("El monto debe ser mayor a 0")
    .max(99_999_999, "El monto es demasiado alto"),

  paidTo: z
    .string()
    .min(2, "Ingresá a quién se le pagó")
    .max(100, "No puede superar los 100 caracteres")
    .trim(),

  // "YYYY-MM-DD" del input date nativo
  paidAt: z
    .string()
    .min(1, "La fecha es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),

  category: z.enum(["ENTRENADOR", "CANCHA", "ARBITROS", "INDUMENTARIA", "OTRO"]),
})

export type CreateGastoInput = z.infer<typeof createGastoSchema>
