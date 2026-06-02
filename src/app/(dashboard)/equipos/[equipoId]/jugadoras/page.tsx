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
import { getJugadorasByTeam } from "@/services/jugadoraService"
import { AddJugadoraForm } from "@/components/jugadoras/AddJugadoraForm"
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

export default async function JugadorasPage({
  params,
}: {
  params: Promise<{ equipoId: string }>
}) {
  const { equipoId } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // Verificar acceso al equipo
  const teamResult = await getTeamById(equipoId, user.id)
  if (!teamResult.success) notFound()

  const equipo = teamResult.data
  const esCapitana = equipo.ownerId === user.id
  const esCapitanaPrincipal = equipo.ownerId === user.id  // solo el owner puede gestionar co-capitanas

  // Obtener jugadoras
  const jugadorasResult = await getJugadorasByTeam(equipoId, user.id)
  if (!jugadorasResult.success) notFound()

  const jugadoras = jugadorasResult.data

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
          {jugadoras.length === 1
            ? "1 jugadora activa en el equipo"
            : `${jugadoras.length} jugadoras activas en el equipo`}
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

      {/* ── Lista de jugadoras ───────────────────────────────────────────── */}
      {jugadoras.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no hay jugadoras. ¡Agregá la primera!
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{jugadora.name}</span>
                      {esCapitana && (
                        <EditJugadoraButton
                          equipoId={equipoId}
                          jugadoraId={jugadora.id}
                          nombreActual={jugadora.name}
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
                      {/* Botón de baja: solo capitana, no sobre sí misma */}
                      {esCapitana && !esLaCapitana && (
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
