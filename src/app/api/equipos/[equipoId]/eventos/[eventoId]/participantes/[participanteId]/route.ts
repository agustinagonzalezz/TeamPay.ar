import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { updateParticipantStatus, updateParticipantCustomAmount } from "@/services/eventoService"

type Params = { params: Promise<{ equipoId: string; eventoId: string; participanteId: string }> }

// Dos modos: actualizar status (+ paidAmount opcional RF-30) o customAmount (RF-21)
const patchSchema = z.union([
  z.object({
    status: z.enum(["PAGO", "PENDIENTE", "EXIMIDA"]),
    paidAmount: z.number().positive().optional(), // RF-30
  }),
  z.object({
    customAmount: z.number().positive().nullable(), // RF-21
  }),
])

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ success: false, error: "No autorizado" }, { status: 401 })

  const { equipoId, participanteId } = await params
  const body: unknown = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ success: false, error: "Datos inválidos" }, { status: 400 })
  }

  const data = parsed.data

  if ("status" in data) {
    const result = await updateParticipantStatus(
      participanteId, equipoId, data.status, user.id, data.paidAmount
    )
    if (!result.success) return Response.json(result, { status: 400 })
    return Response.json({ success: true, data: result.data })
  }

  // customAmount (RF-21)
  const result = await updateParticipantCustomAmount(
    participanteId, equipoId, data.customAmount, user.id
  )
  if (!result.success) return Response.json(result, { status: 400 })
  return Response.json({ success: true, data: result.data })
}
