/**
 * src/app/api/equipos/[equipoId]/eventos/[eventoId]/participantes/[participanteId]/route.ts
 *
 * PATCH — Actualiza el estado de pago de un participante del evento.
 *         Solo la capitana puede usar este endpoint.
 *
 * Body: { status: "PAGO" | "PENDIENTE" | "EXIMIDA" }
 */

import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { updateParticipantStatus } from "@/services/eventoService"

const patchSchema = z.object({
  status: z.enum(["PAGO", "PENDIENTE", "EXIMIDA"], {
    error: "Estado inválido. Debe ser PAGO, PENDIENTE o EXIMIDA.",
  }),
})

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      equipoId: string
      eventoId: string
      participanteId: string
    }>
  }
) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    )
  }

  const { equipoId, participanteId } = await params

  const body: unknown = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { success: false, error: "Datos inválidos", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const result = await updateParticipantStatus(
    participanteId,
    equipoId,
    parsed.data.status,
    user.id
  )

  if (!result.success) {
    return Response.json(
      { success: false, error: result.error },
      { status: 400 }
    )
  }

  return Response.json({ success: true, data: result.data })
}
