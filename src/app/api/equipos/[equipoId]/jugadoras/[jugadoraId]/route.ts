/**
 * src/app/api/equipos/[equipoId]/jugadoras/[jugadoraId]/route.ts
 *
 * DELETE /api/equipos/[equipoId]/jugadoras/[jugadoraId] — dar de baja una jugadora
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { removeJugadora, updateJugadora, setCoCapitana } from "@/services/jugadoraService"

type RouteParams = { params: Promise<{ equipoId: string; jugadoraId: string }> }

const updateSchema = z.union([
  z.object({ name: z.string().min(2, "Mínimo 2 caracteres").max(60).trim() }),
  z.object({ isCoCapitana: z.boolean() }),
])

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })

  const { equipoId, jugadoraId } = await params
  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const data = parsed.data
  if ("isCoCapitana" in data) {
    const result = await setCoCapitana(jugadoraId, equipoId, data.isCoCapitana, user.id)
    if (!result.success) return NextResponse.json(result, { status: 403 })
    return NextResponse.json(result)
  }

  const result = await updateJugadora(jugadoraId, equipoId, data.name, user.id)
  if (!result.success) return NextResponse.json(result, { status: 403 })
  return NextResponse.json(result)
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  const { equipoId, jugadoraId } = await params
  const result = await removeJugadora(jugadoraId, equipoId, user.id)

  if (!result.success) {
    const status = result.error.includes("capitana") || result.error.includes("podés") ? 403 : 500
    return NextResponse.json({ success: false, error: result.error }, { status })
  }

  return NextResponse.json({ success: true, data: result.data })
}
