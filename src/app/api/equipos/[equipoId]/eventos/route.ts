/**
 * src/app/api/equipos/[equipoId]/eventos/route.ts
 *
 * GET  — listar eventos del equipo
 * POST — crear evento (solo capitana)
 */

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getEventosByTeam, createEvento } from "@/services/eventoService"
import { createEventoSchema } from "@/lib/validations/evento"

type RouteParams = { params: Promise<{ equipoId: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })

  const { equipoId } = await params
  const result = await getEventosByTeam(equipoId, user.id)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 403 })
  }
  return NextResponse.json({ success: true, data: result.data })
}

export async function POST(req: Request, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Body inválido" }, { status: 400 })
  }

  const parsed = createEventoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { equipoId } = await params
  const result = await createEvento(equipoId, parsed.data, user.id)

  if (!result.success) {
    const status = result.code === "NOT_CAPITANA" || result.code === "SUBSCRIPTION_SUSPENDED" ? 403 : 500
    return NextResponse.json({ success: false, error: result.error }, { status })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
