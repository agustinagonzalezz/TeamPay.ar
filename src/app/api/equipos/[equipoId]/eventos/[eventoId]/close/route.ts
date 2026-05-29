import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { closeEvento } from "@/services/eventoService"

type Params = { params: Promise<{ equipoId: string; eventoId: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  const { equipoId, eventoId } = await params
  const result = await closeEvento(eventoId, equipoId, user.id)
  if (!result.success) return NextResponse.json(result, { status: 403 })
  return NextResponse.json(result)
}
