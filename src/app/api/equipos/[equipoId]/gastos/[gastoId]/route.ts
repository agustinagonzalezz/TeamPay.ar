/**
 * src/app/api/equipos/[equipoId]/gastos/[gastoId]/route.ts
 *
 * DELETE — Elimina un gasto (solo capitana)
 */

import { getCurrentUser } from "@/lib/auth"
import { deleteGasto } from "@/services/gastoService"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ equipoId: string; gastoId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  const { equipoId, gastoId } = await params
  const result = await deleteGasto(gastoId, equipoId, user.id)

  if (!result.success) {
    return Response.json({ success: false, error: result.error }, { status: 400 })
  }

  return Response.json({ success: true, data: result.data })
}
