/**
 * src/app/api/admin/equipos/[teamId]/subscription/status/route.ts
 *
 * PATCH — override manual del estado de una suscripción (RF-55): activar,
 * marcar como pagada, extender trial, suspender, cancelar, reactivar. La
 * confirmación explícita para suspender/cancelar (RNF-17) se resuelve en la
 * UI (AlertDialog) antes de llegar acá.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdminApi } from "@/lib/auth/super-admin"
import { changeSubscriptionStatus } from "@/services/superAdminService"
import { changeSubscriptionStatusSchema } from "@/lib/validations/subscription"

type Params = { params: Promise<{ teamId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireSuperAdminApi()
  if (admin instanceof NextResponse) return admin

  const { teamId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Body inválido" }, { status: 400 })
  }

  const parsed = changeSubscriptionStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const result = await changeSubscriptionStatus(teamId, parsed.data.action, admin.id, parsed.data.trialEndsAt)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 409 })
  }

  return NextResponse.json({ success: true })
}
