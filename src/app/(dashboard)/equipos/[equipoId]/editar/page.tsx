import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getTeamById } from "@/services/teamService"
import { EditarEquipoForm } from "@/components/equipos/EditarEquipoForm"

export default async function EditarEquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>
}) {
  const { equipoId } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const result = await getTeamById(equipoId, user.id)
  if (!result.success) notFound()

  const equipo = result.data
  if (equipo.ownerId !== user.id) redirect(`/equipos/${equipoId}`)

  return (
    <EditarEquipoForm
      equipoId={equipoId}
      nombre={equipo.name}
      descripcion={equipo.description ?? ""}
      logoUrl={equipo.logoUrl ?? null}
    />
  )
}
