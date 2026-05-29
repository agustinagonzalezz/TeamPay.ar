import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { updateTeamSchema } from "@/lib/validations/team"
import { updateTeam, deleteTeam } from "@/services/teamService"

type Params = { params: Promise<{ equipoId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  const { equipoId } = await params
  const body: unknown = await req.json()
  const parsed = updateTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const result = await updateTeam(equipoId, parsed.data, user.id)
  if (!result.success) return NextResponse.json(result, { status: 403 })
  return NextResponse.json(result)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  const { equipoId } = await params
  const result = await deleteTeam(equipoId, user.id)
  if (!result.success) return NextResponse.json(result, { status: 403 })
  return NextResponse.json(result)
}
