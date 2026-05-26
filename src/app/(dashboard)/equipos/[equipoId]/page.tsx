/**
 * app/(dashboard)/equipos/[equipoId]/page.tsx — Dashboard del equipo
 *
 * Muestra la información del equipo, la lista de jugadoras activas
 * y secciones de eventos y gastos (en estado vacío hasta implementarlos).
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { redirect } from "next/navigation"
import { ArrowLeft, Users, Calendar, Receipt, Plus } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getTeamDetails } from "@/services/teamService"
import { getEventosByTeam } from "@/services/eventoService"
import { EventoCard } from "@/components/eventos/EventoCard"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ── Metadata dinámica ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ equipoId: string }>
}): Promise<Metadata> {
  return {
    title: "Equipo — TeamPay.ar",
  }
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>
}) {
  const { equipoId } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [teamResult, eventosResult] = await Promise.all([
    getTeamDetails(equipoId, user.id),
    getEventosByTeam(equipoId, user.id),
  ])

  if (!teamResult.success) notFound()

  const equipo = teamResult.data
  const esCapitana = equipo.ownerId === user.id
  const eventos = eventosResult.success ? eventosResult.data : []

  return (
    <div className="flex flex-col gap-8">

      {/* ── Navegación ────────────────────────────────────────────────── */}
      <div>
        <Link
          href="/equipos"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 mb-3"
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Mis equipos
        </Link>

        {/* Encabezado del equipo */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{equipo.name}</h1>
            {equipo.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {equipo.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats rápidas ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="size-5 text-muted-foreground" />}
          label="Jugadoras activas"
          value={equipo._count.members}
        />
        <StatCard
          icon={<Calendar className="size-5 text-muted-foreground" />}
          label="Eventos"
          value={equipo._count.events}
        />
        <StatCard
          icon={<Receipt className="size-5 text-muted-foreground" />}
          label="Balance"
          value="—"
        />
      </div>

      {/* ── Jugadoras ─────────────────────────────────────────────────── */}
      <section aria-labelledby="jugadoras-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="jugadoras-heading"
            className="text-lg font-semibold"
          >
            Jugadoras
          </h2>
          {esCapitana && (
            <Link
              href={`/equipos/${equipoId}/jugadoras`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar
            </Link>
          )}
        </div>

        {equipo.members.length === 0 ? (
          <EmptyState mensaje="Todavía no hay jugadoras en este equipo." />
        ) : (
          <Card size="sm">
            <ul role="list" className="divide-y">
              {equipo.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Avatar placeholder con inicial */}
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                    aria-hidden="true"
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm font-medium">{member.name}</span>
                    {member.userId === equipo.ownerId && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Capitana
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {/* ── Eventos ───────────────────────────────────────────────────── */}
      <section aria-labelledby="eventos-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="eventos-heading"
            className="text-lg font-semibold"
          >
            Eventos
          </h2>
          {esCapitana && (
            <Link
              href={`/equipos/${equipoId}/eventos/nuevo`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuevo evento
            </Link>
          )}
        </div>
        {eventos.length === 0 ? (
          <EmptyState mensaje="Todavía no hay eventos. Creá el primero para empezar a registrar pagos." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {eventos.slice(0, 6).map((evento) => (
              <EventoCard key={evento.id} evento={evento} equipoId={equipoId} />
            ))}
          </div>
        )}

        {eventos.length > 6 && (
          <Link
            href={`/equipos/${equipoId}/eventos`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-2")}
          >
            Ver todos los eventos ({eventos.length})
          </Link>
        )}
      </section>

    </div>
  )
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <Card size="sm">
      <CardHeader className="flex-row items-center gap-2 pb-1">
        {icon}
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-dashed py-10 text-center">
      <p className="text-sm text-muted-foreground">{mensaje}</p>
    </div>
  )
}
