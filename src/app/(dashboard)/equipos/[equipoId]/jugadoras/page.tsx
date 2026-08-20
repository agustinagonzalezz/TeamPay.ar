/**
 * app/(dashboard)/equipos/[equipoId]/jugadoras/page.tsx — Gestión de jugadoras
 *
 * Server Component que muestra la lista completa de jugadoras activas.
 * Si el usuario es la capitana, muestra además el formulario para agregar
 * y el botón de dar de baja en cada fila.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getTeamById } from "@/services/teamService"
import {
  getJugadorasByTeam,
  type JugadorasEstado,
  type JugadorasOrden,
} from "@/services/jugadoraService"
import { AddJugadoraForm } from "@/components/jugadoras/AddJugadoraForm"
import { JugadorasFilters } from "@/components/jugadoras/JugadorasFilters"
import { RemoveJugadoraButton } from "@/components/jugadoras/RemoveJugadoraButton"
import { EditJugadoraButton } from "@/components/jugadoras/EditJugadoraButton"
import { CoCapitanaButton } from "@/components/jugadoras/CoCapitanaButton"
import { CopyInviteLinkButton } from "@/components/equipos/CopyInviteLinkButton"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Jugadoras — TeamPayment.app",
}

const ORDENES_VALIDOS: JugadorasOrden[] = ["nombre_asc", "nombre_desc", "camiseta", "posicion"]
const ESTADOS_VALIDOS: JugadorasEstado[] = ["ACTIVA", "INACTIVA", "TODAS"]

export default async function JugadorasPage({
  params,
  searchParams,
}: {
  params: Promise<{ equipoId: string }>
  searchParams: Promise<{ q?: string; orden?: string; estado?: string }>
}) {
  const { equipoId } = await params
  const { q, orden: rawOrden, estado: rawEstado } = await searchParams

  const orden = (ORDENES_VALIDOS.includes(rawOrden as JugadorasOrden) ? rawOrden : "nombre_asc") as JugadorasOrden
  const estado = (ESTADOS_VALIDOS.includes(rawEstado as JugadorasEstado) ? rawEstado : "ACTIVA") as JugadorasEstado

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // Verificar acceso al equipo
  const teamResult = await getTeamById(equipoId, user.id)
  if (!teamResult.success) notFound()

  const equipo = teamResult.data
  const esCapitana = equipo.ownerId === user.id
  const esCapitanaPrincipal = equipo.ownerId === user.id  // solo el owner puede gestionar co-capitanas

  // Obtener jugadoras
  const jugadorasResult = await getJugadorasByTeam(equipoId, user.id, { search: q, orden, estado })
  if (!jugadorasResult.success) notFound()

  const jugadoras = jugadorasResult.data
  const hayFiltrosActivos = Boolean(q) || orden !== "nombre_asc" || estado !== "ACTIVA"

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <Link
          href={`/equipos/${equipoId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-3")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {equipo.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Jugadoras</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {jugadoras.length} {jugadoras.length === 1 ? "jugadora" : "jugadoras"}
          {estado === "ACTIVA" && " activas"}
          {estado === "INACTIVA" && " dadas de baja"}
          {" "}en el equipo
        </p>
      </div>

      {/* ── Formulario para agregar (solo capitana) ─────────────────────── */}
      {esCapitana && <AddJugadoraForm equipoId={equipoId} />}

      {/* ── Link de invitación (solo capitana) ──────────────────────────── */}
      {esCapitana && (
        <div className="rounded-xl border bg-muted/30 px-4 py-4">
          <p className="text-sm font-medium">Invitar jugadoras</p>
          <p className="mt-0.5 text-xs text-muted-foreground mb-3">
            Compartí este link para que las jugadoras se unan con su cuenta de Google.
          </p>
          <CopyInviteLinkButton equipoId={equipoId} />
        </div>
      )}

      {/* ── Búsqueda / orden / filtro por estado ─────────────────────────── */}
      <JugadorasFilters qActual={q ?? ""} ordenActual={orden} estadoActual={estado} />

      {/* ── Lista de jugadoras ───────────────────────────────────────────── */}
      {jugadoras.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {hayFiltrosActivos
              ? "No hay jugadoras que coincidan con esos filtros."
              : "Todavía no hay jugadoras. ¡Agregá la primera!"}
          </p>
        </div>
      ) : (
        <Card size="sm">
          <ul role="list" className="divide-y">
            {jugadoras.map((jugadora) => {
              const esLaCapitana = jugadora.userId === equipo.ownerId

              return (
                <li
                  key={jugadora.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Avatar con inicial */}
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                    aria-hidden="true"
                  >
                    {jugadora.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Nombre + badge */}
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        {jugadora.shirtNumber && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                            #{jugadora.shirtNumber}
                          </span>
                        )}
                        <span className="text-sm font-medium">{jugadora.name}</span>
                        {esCapitana && (
                          <EditJugadoraButton
                            equipoId={equipoId}
                            jugadoraId={jugadora.id}
                            nombreActual={jugadora.name}
                            phoneActual={jugadora.phone}
                            positionActual={jugadora.position}
                            shirtNumberActual={jugadora.shirtNumber}
                          />
                        )}
                        {esLaCapitana && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Capitana
                          </span>
                        )}
                        {jugadora.isCoCapitana && !esLaCapitana && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Capitana
                          </span>
                        )}
                        {jugadora.userId && !esLaCapitana && !jugadora.isCoCapitana && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Con cuenta
                          </span>
                        )}
                        {jugadora.status === "INACTIVA" && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            Dada de baja
                          </span>
                        )}
                      </div>
                      {jugadora.position && (
                        <span className="text-xs text-muted-foreground">{jugadora.position}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Botón co-capitana: solo capitana principal, sobre miembros con cuenta */}
                      {esCapitanaPrincipal && !esLaCapitana && jugadora.userId && (
                        <CoCapitanaButton
                          equipoId={equipoId}
                          jugadoraId={jugadora.id}
                          jugadoraName={jugadora.name}
                          isCoCapitana={jugadora.isCoCapitana}
                        />
                      )}
                      {/* Botón de baja: solo capitana, no sobre sí misma, no si ya está inactiva */}
                      {esCapitana && !esLaCapitana && jugadora.status === "ACTIVA" && (
                        <RemoveJugadoraButton
                          equipoId={equipoId}
                          jugadoraId={jugadora.id}
                          jugadoraName={jugadora.name}
                        />
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
