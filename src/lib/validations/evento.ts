/**
 * src/lib/validations/evento.ts — Schemas de Zod para la entidad Evento
 */

import { z } from "zod"

export const EVENT_TYPE_LABELS = {
  CUOTA: "Cuota mensual",
  AMISTOSO: "Amistoso",
  TORNEO: "Torneo",
  OTRO: "Otro",
} as const

export const conceptoSchema = z.object({
  nombre: z.string().min(1).max(100).trim(),
  monto: z.number().positive(),
})

export type ConceptoInput = z.infer<typeof conceptoSchema>

export const createEventoSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres")
    .trim(),

  type: z.enum(["CUOTA", "AMISTOSO", "TORNEO", "OTRO"], {
    error: "Seleccioná un tipo de evento",
  }),

  // Monto TOTAL del evento; el service lo divide por la cantidad de jugadoras
  totalAmount: z
    .number({ error: "Ingresá un monto válido" })
    .positive("El monto debe ser mayor a 0")
    .max(99_999_999, "El monto es demasiado alto"),

  // Viene como "YYYY-MM-DD" del input date nativo
  dueDate: z
    .string()
    .min(1, "La fecha es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),

  // Desglose opcional de conceptos (ej: Entrenador, Cancha)
  conceptos: z.array(conceptoSchema).optional(),
})

export type CreateEventoInput = z.infer<typeof createEventoSchema>

export const updateEventoSchema = createEventoSchema.partial()
export type UpdateEventoInput = z.infer<typeof updateEventoSchema>
