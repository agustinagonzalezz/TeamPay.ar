/**
 * src/lib/validations/jugadora.ts — Schemas de Zod para la entidad Jugadora (TeamMember)
 */

import { z } from "zod"

const nameSchema = z
  .string()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(60, "El nombre no puede superar los 60 caracteres")
  .trim()

const phoneSchema = z
  .string()
  .max(20, "El teléfono no puede superar los 20 caracteres")
  .trim()
  .nullable()
  .optional()

const positionSchema = z
  .string()
  .max(30, "La posición no puede superar los 30 caracteres")
  .trim()
  .nullable()
  .optional()

const shirtNumberSchema = z
  .number({ error: "Ingresá un número válido" })
  .int("El número de camiseta debe ser un entero")
  .min(1, "El número de camiseta debe estar entre 1 y 99")
  .max(99, "El número de camiseta debe estar entre 1 y 99")
  .nullable()
  .optional()

export const addJugadoraSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  position: positionSchema,
  shirtNumber: shirtNumberSchema,
})

export type AddJugadoraInput = z.infer<typeof addJugadoraSchema>

export const updateJugadoraSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  position: positionSchema,
  shirtNumber: shirtNumberSchema,
})

export type UpdateJugadoraInput = z.infer<typeof updateJugadoraSchema>
