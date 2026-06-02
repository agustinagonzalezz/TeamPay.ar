/**
 * src/lib/validations/team.ts — Schemas de Zod para la entidad Equipo
 *
 * Se usa en:
 *   • API routes (validación del body)
 *   • Server Actions
 *   • Formularios cliente (zodResolver para react-hook-form)
 */

import { z } from "zod"

// ── createTeamSchema ──────────────────────────────────────────────────────────

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres")
    .trim(),

  description: z
    .string()
    .max(200, "La descripción no puede superar los 200 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),

  logoUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>

// ── updateTeamSchema ──────────────────────────────────────────────────────────

export const updateTeamSchema = createTeamSchema.partial()

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
