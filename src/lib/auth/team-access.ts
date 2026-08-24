/**
 * src/lib/auth/team-access.ts — Guard de escritura por equipo (RF-56).
 *
 * Se llama ADEMÁS de la autorización específica que ya tiene cada mutación
 * (isCapitana, owner principal, etc.) — no la reemplaza. Bloquea cualquier
 * escritura si la Subscription del equipo está SUSPENDED (modo solo-lectura)
 * o si sigue en TRIALING con el trial ya vencido (chequeado al vuelo en cada
 * request, sin cron — mismo criterio que requireSuperAdmin).
 * Un equipo sin Subscription todavía (null) se trata como activo — es el
 * caso legacy de equipos creados antes de que createTeam empezara a crear
 * la Subscription de trial automáticamente; no hay que bloquearlos.
 *
 * Devuelve un `reason` tipificado (no un mensaje) — las rutas mapean ese
 * reason a un status HTTP explícito, en vez de adivinar leyendo el texto
 * del error en español. SUBSCRIPTION_SUSPENDED y TRIAL_EXPIRED son reasons
 * separados a propósito: el mensaje que ve la usuaria es distinto en cada
 * caso ("se venció el trial" vs "está suspendida por falta de pago").
 */

import { prisma } from "@/lib/prisma"

export type TeamWriteAccessReason = "SUBSCRIPTION_SUSPENDED" | "TRIAL_EXPIRED"

export type TeamWriteAccessResult =
  | { authorized: true }
  | { authorized: false; reason: TeamWriteAccessReason }

export const SUBSCRIPTION_SUSPENDED_MESSAGE =
  "Esta cuenta está suspendida por falta de pago. Regularizá el pago para poder crear, editar o eliminar de nuevo — mientras tanto podés seguir viendo todos tus datos."

export const TRIAL_EXPIRED_MESSAGE =
  "Tu prueba gratis de 14 días terminó. Contactanos para activar el plan y poder crear, editar o eliminar de nuevo — mientras tanto podés seguir viendo todos tus datos."

/** Mensaje a mostrarle a la usuaria según el reason del bloqueo. */
export const TEAM_WRITE_ACCESS_MESSAGES: Record<TeamWriteAccessReason, string> = {
  SUBSCRIPTION_SUSPENDED: SUBSCRIPTION_SUSPENDED_MESSAGE,
  TRIAL_EXPIRED: TRIAL_EXPIRED_MESSAGE,
}

export async function requireTeamWriteAccess(teamId: string): Promise<TeamWriteAccessResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { teamId },
    select: { status: true, trialEndsAt: true },
  })

  if (!subscription) return { authorized: true }

  if (subscription.status === "SUSPENDED") {
    return { authorized: false, reason: "SUBSCRIPTION_SUSPENDED" }
  }

  if (subscription.status === "TRIALING" && subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
    return { authorized: false, reason: "TRIAL_EXPIRED" }
  }

  return { authorized: true }
}
