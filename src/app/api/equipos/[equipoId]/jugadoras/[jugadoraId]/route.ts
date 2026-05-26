/**
 * src/app/api/equipos/[equipoId]/jugadoras/[jugadoraId]/route.ts
 *
 * DELETE /api/equipos/[equipoId]/jugadoras/[jugadoraId] — dar de baja una jugadora
 */

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { removeJugadora } from "@/services/jugadoraService"

type RouteParams = { params: Promise<{ equipoId: string; jugadoraId: string }> }

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
