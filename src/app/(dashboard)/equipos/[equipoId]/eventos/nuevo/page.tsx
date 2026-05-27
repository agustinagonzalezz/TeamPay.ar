/**
 * app/(dashboard)/equipos/[equipoId]/eventos/nuevo/page.tsx
 *
 * Server Component: obtiene la cantidad de jugadoras activas y renderiza
 * el formulario (Client Component) pasándolo como prop.
 */

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getJugadorasByTeam } from "@/services/jugadoraService"
import { NuevoEventoForm } from "@/components/eventos/NuevoEventoForm"

export default async function NuevoEventoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>
}) {
  const { equipoId } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // Necesitamos la cantidad de jugadoras para calcular monto por jugadora
  const result = await getJugadorasByTeam(equipoId, user.id)
  const playerCount = result.success ? result.data.length : 0

  return <NuevoEventoForm equipoId={equipoId} playerCount={playerCount} />
}
