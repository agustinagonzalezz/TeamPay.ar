import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createGastoSchema } from "@/lib/validations/gasto"
import { deleteGasto, updateGasto } from "@/services/gastoService"

type Params = { params: Promise<{ equipoId: string; gastoId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ success: false, error: "No autorizado" }, { status: 401 })

  const { equipoId, gastoId } = await params
  const body: unknown = await req.json()
  const parsed = createGastoSchema.partial().safeParse(body)
  if (!parsed.success) {
    return Response.json({ success: false, fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const result = await updateGasto(gastoId, equipoId, parsed.data, user.id)
  if (!result.success) return Response.json(result, { status: 403 })
  return Response.json(result)
}

export async function DELETE(
  _req: Request,
  { params }: Params
) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ success: false, error: "No autorizado" }, { status: 401 })

  const { equipoId, gastoId } = await params
  const result = await deleteGasto(gastoId, equipoId, user.id)
  if (!result.success) return Response.json({ success: false, error: result.error }, { status: 400 })
  return Response.json({ success: true, data: result.data })
}
