/**
 * src/app/api/admin/equipos/[teamId]/subscription/route.ts
 *
 * POST  — crea la Subscription inicial de un equipo (RF-54).
 * PATCH — edita plan, contacto y facturación de una Subscription existente
 *         (RF-53/RF-54).
 *
 * Toda la lógica (incluido el registro en SuperAdminAuditLog) vive en
 * superAdminService.ts — acá solo autorización + validación + delegación.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdminApi } from "@/lib/auth/super-admin"
import { createSubscription, updateSubscriptionInfo } from "@/services/superAdminService"
import { createSubscriptionSchema, updateSubscriptionInfoSchema } from "@/lib/validations/subscription"

type Params = { params: Promise<{ teamId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const admin = await requireSuperAdminApi()
  if (admin instanceof NextResponse) return admin

  const { teamId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Body inválido" }, { status: 400 })
  }

  const parsed = createSubscriptionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const result = await createSubscription(teamId, parsed.data, admin.id)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 409 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

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

  const parsed = updateSubscriptionInfoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const result = await updateSubscriptionInfo(teamId, parsed.data, admin.id)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 409 })
  }

  return NextResponse.json({ success: true })
}
