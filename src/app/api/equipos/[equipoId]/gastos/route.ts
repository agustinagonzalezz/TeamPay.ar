/**
 * src/app/api/equipos/[equipoId]/gastos/route.ts
 *
 * GET  — Lista los gastos del equipo
 * POST — Crea un nuevo gasto (solo capitana)
 */

import { getCurrentUser } from "@/lib/auth"
import { createGasto, getGastosByTeam } from "@/services/gastoService"
import { createGastoSchema } from "@/lib/validations/gasto"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ equipoId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  const { equipoId } = await params
  const result = await getGastosByTeam(equipoId, user.id)

  if (!result.success) {
    return Response.json({ success: false, error: result.error }, { status: 403 })
  }

  return Response.json({ success: true, data: result.data })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ equipoId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  const { equipoId } = await params
  const body: unknown = await req.json().catch(() => null)
  const parsed = createGastoSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const result = await createGasto(equipoId, parsed.data, user.id)

  if (!result.success) {
    return Response.json({ success: false, error: result.error }, { status: 400 })
  }

  return Response.json({ success: true, data: result.data }, { status: 201 })
}
