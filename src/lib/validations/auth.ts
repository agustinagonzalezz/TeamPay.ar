/**
 * src/lib/validations/auth.ts — Schemas de Zod para registro/login con email y contraseña
 */

import { z } from "zod"

const emailSchema = z
  .string()
  .min(1, "El email es obligatorio")
  .email("Ingresá un email válido")
  .trim()
  .toLowerCase()

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(60, "El nombre no puede superar los 60 caracteres")
      .trim(),
    email: emailSchema,
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Za-z]/, "La contraseña debe tener al menos una letra")
      .regex(/[0-9]/, "La contraseña debe tener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
})

export type LoginInput = z.infer<typeof loginSchema>
