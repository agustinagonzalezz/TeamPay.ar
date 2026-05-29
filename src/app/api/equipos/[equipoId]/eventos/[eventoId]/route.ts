import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { updateEventoSchema } from "@/lib/validations/evento"
import { updateEvento, deleteEvento } from "@/services/eventoService"
import { getJugadorasByTeam } from "@/services/jugadoraService"

type Params = { params: Promise<{ equipoId: string; eventoId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  const { equipoId, eventoId } = await params
  const body: unknown = await req.json()
  const parsed = updateEventoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const jugadorasResult = await getJugadorasByTeam(equipoId, user.id)
  const playerCount = jugadorasResult.success ? jugadorasResult.data.length : 0

  const result = await updateEvento(eventoId, equipoId, parsed.data, user.id, playerCount)
  if (!result.success) return NextResponse.json(result, { status: 403 })
  return NextResponse.json(result)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  const { equipoId, eventoId } = await params
  const result = await deleteEvento(eventoId, equipoId, user.id)
  if (!result.success) return NextResponse.json(result, { status: result.error.includes("pagos") ? 409 : 403 })
  return NextResponse.json(result)
}
