/**
 * src/lib/validations/subscription.ts — Schemas de Zod para el módulo de
 * super administración (Subscription). Ver SUPERADMIN.md.
 */

import { z } from "zod"

export const PLAN_VALUES = ["TRIAL", "BASIC", "PRO"] as const
export const SUBSCRIPTION_STATUS_VALUES = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "SUSPENDED",
  "CANCELED",
] as const

const contactBillingFields = {
  contactName: z
    .string()
    .min(2, "El nombre de contacto debe tener al menos 2 caracteres")
    .max(80, "El nombre de contacto no puede superar los 80 caracteres")
    .trim(),
  contactEmail: z
    .string()
    .min(1, "El email de contacto es obligatorio")
    .email("Ingresá un email válido")
    .trim()
    .toLowerCase(),
  contactPhone: z.string().max(30).trim().optional().or(z.literal("")),

  billingName: z.string().max(120).trim().optional().or(z.literal("")),
  billingTaxId: z.string().max(20).trim().optional().or(z.literal("")),
  billingEmail: z
    .string()
    .email("Ingresá un email válido")
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal("")),

  notes: z.string().max(1000).trim().optional().or(z.literal("")),
}

// ── createSubscriptionSchema ──────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  plan: z.enum(PLAN_VALUES),
  status: z.enum(SUBSCRIPTION_STATUS_VALUES),
  trialEndsAt: z.string().trim().optional().or(z.literal("")), // "YYYY-MM-DD"
  currentPeriodEnd: z.string().trim().optional().or(z.literal("")),
  ...contactBillingFields,
})

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>

// ── updateSubscriptionInfoSchema (RF-53/RF-54) ──────────────────────────────────

export const updateSubscriptionInfoSchema = z.object({
  plan: z.enum(PLAN_VALUES),
  ...contactBillingFields,
})

export type UpdateSubscriptionInfoInput = z.infer<typeof updateSubscriptionInfoSchema>

// ── changeSubscriptionStatusSchema (RF-55) ───────────────────────────────────────

export const SUBSCRIPTION_ACTIONS = [
  "ACTIVATE",
  "MARK_PAID",
  "EXTEND_TRIAL",
  "SUSPEND",
  "CANCEL",
  "REACTIVATE",
] as const

export const changeSubscriptionStatusSchema = z.object({
  action: z.enum(SUBSCRIPTION_ACTIONS),
  trialEndsAt: z.string().trim().optional().or(z.literal("")), // requerido solo para EXTEND_TRIAL, se valida en el service
})

export type ChangeSubscriptionStatusInput = z.infer<typeof changeSubscriptionStatusSchema>
