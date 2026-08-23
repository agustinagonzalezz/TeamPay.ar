/**
 * src/lib/auth/team-access.ts — Guard de escritura por equipo (RF-56).
 *
 * Se llama ADEMÁS de la autorización específica que ya tiene cada mutación
 * (isCapitana, owner principal, etc.) — no la reemplaza. Bloquea cualquier
 * escritura si la Subscription del equipo está SUSPENDED (modo solo-lectura).
 * Un equipo sin Subscription todavía (null) se trata como activo: RF-52/54
 * dependen de que el super admin la configure a mano, y hasta entonces no
 * hay que bloquear equipos que todavía no pasaron por /admin.
 *
 * Devuelve un `reason` tipificado (no un mensaje) — las rutas mapean ese
 * reason a un status HTTP explícito, en vez de adivinar leyendo el texto
 * del error en español.
 */

import { prisma } from "@/lib/prisma"

export type TeamWriteAccessResult =
  | { authorized: true }
  | { authorized: false; reason: "SUBSCRIPTION_SUSPENDED" }

export const SUBSCRIPTION_SUSPENDED_MESSAGE =
  "Esta cuenta está suspendida por falta de pago. Regularizá el pago para poder crear, editar o eliminar de nuevo — mientras tanto podés seguir viendo todos tus datos."

export async function requireTeamWriteAccess(teamId: string): Promise<TeamWriteAccessResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { teamId },
    select: { status: true },
  })

  if (subscription?.status === "SUSPENDED") {
    return { authorized: false, reason: "SUBSCRIPTION_SUSPENDED" }
  }

  return { authorized: true }
}
