import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getEventoById, checkIsCapitana } from "@/services/eventoService"
import { getJugadorasByTeam } from "@/services/jugadoraService"
import { getTeamSubscriptionStatus } from "@/services/teamService"
import { EditarEventoForm } from "@/components/eventos/EditarEventoForm"

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ equipoId: string; eventoId: string }>
}) {
  const { equipoId, eventoId } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [isCapitana, eventoResult, jugadorasResult, subscriptionStatus] = await Promise.all([
    checkIsCapitana(equipoId, user.id),
    getEventoById(eventoId, equipoId, user.id),
    getJugadorasByTeam(equipoId, user.id),
    getTeamSubscriptionStatus(equipoId),
  ])

  if (!isCapitana) redirect(`/equipos/${equipoId}`)
  // RF-56: bloquear el acceso directo al formulario si la cuenta está suspendida
  if (subscriptionStatus === "SUSPENDED") redirect(`/equipos/${equipoId}/eventos/${eventoId}`)
  if (!eventoResult.success) notFound()

  const evento = eventoResult.data
  const playerCount = jugadorasResult.success ? jugadorasResult.data.length : 0
  const dueDate = evento.dueDate.toISOString().split("T")[0]

  const defaultItems = evento.conceptos.length > 0
    ? [...evento.conceptos]
        .sort((a, b) => a.orden - b.orden)
        .map((c) => ({ nombre: c.nombre, monto: Number(c.monto) }))
    : undefined

  return (
    <EditarEventoForm
      equipoId={equipoId}
      eventoId={eventoId}
      playerCount={playerCount}
      defaults={{
        name: evento.name,
        type: evento.type,
        totalAmount: Number(evento.amountPerPlayer) * playerCount,
        dueDate,
      }}
      defaultItems={defaultItems}
    />
  )
}
