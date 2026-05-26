/**
 * src/app/api/equipos/[equipoId]/jugadoras/route.ts
 *
 * GET  /api/equipos/[equipoId]/jugadoras  — listar jugadoras del equipo
 * POST /api/equipos/[equipoId]/jugadoras  — agregar jugadora al equipo
 */

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getJugadorasByTeam, addJugadora } from "@/services/jugadoraService"
import { addJugadoraSchema } from "@/lib/validations/jugadora"

type RouteParams = { params: Promise<{ equipoId: string }> }

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  const { equipoId } = await params
  const result = await getJugadorasByTeam(equipoId, user.id)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: result.data })
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: Request, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Body inválido" }, { status: 400 })
  }

  const parsed = addJugadoraSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { equipoId } = await params
  const result = await addJugadora(equipoId, parsed.data, user.id)

  if (!result.success) {
    const status = result.error.includes("capitana") ? 403 : 500
    return NextResponse.json({ success: false, error: result.error }, { status })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
