/**
 * src/lib/validations/jugadora.ts — Schemas de Zod para la entidad Jugadora (TeamMember)
 */

import { z } from "zod"

export const addJugadoraSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "El nombre no puede superar los 60 caracteres")
    .trim(),
})

export type AddJugadoraInput = z.infer<typeof addJugadoraSchema>
