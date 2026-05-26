/**
 * app/(dashboard)/equipos/[equipoId]/eventos/[eventoId]/page.tsx
 *
 * Detalle de un evento: info general + lista de participantes con estado de pago.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, MinusCircle } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getEventoById } from "@/services/eventoService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { EVENT_TYPE_LABELS } from "@/lib/validations/evento"
import type { ParticipantStatus } from "@/generated/prisma/client"

export const metadata: Metadata = { title: "Evento — TeamPay.ar" }

// ── Página ────────────────────────────────────────────────────────────────────

export default async function EventoPage({
  params,
}: {
  params: Promise<{ equipoId: string; eventoId: string }>
}) {
  const { equipoId, eventoId } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const result = await getEventoById(eventoId, equipoId, user.id)
  if (!result.success) notFound()

  const evento = result.data

  // Estadísticas de pagos
  const total = evento.participants.length
  const pagos = evento.participants.filter((p) => p.status === "PAGO").length
  const pendientes = evento.participants.filter((p) => p.status === "PENDIENTE").length
  const eximidas = evento.participants.filter((p) => p.status === "EXIMIDA").length
  const obligadas = total - eximidas
  const progreso = obligadas > 0 ? Math.round((pagos / obligadas) * 100) : 100

  const totalCobrado = evento.participants.reduce(
    (acc, p) => acc + (p.payment ? Number(p.payment.amount) : 0),
    0
  )
  const totalEsperado = obligadas * Number(evento.amountPerPlayer)

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <Link
          href={`/equipos/${equipoId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-3")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al equipo
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{evento.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{EVENT_TYPE_LABELS[evento.type]}</span>
              <span>·</span>
              <span>{formatCurrency(Number(evento.amountPerPlayer))} por jugadora</span>
              <span>·</span>
              <span>Vence {formatDate(evento.dueDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total cobrado" value={formatCurrency(totalCobrado)} />
        <StatCard label="Pendiente" value={formatCurrency(Math.max(totalEsperado - totalCobrado, 0))} />
        <StatCard label="Progreso" value={`${pagos}/${obligadas} (${progreso}%)`} />
      </div>

      {/* ── Lista de participantes ─────────────────────────────────────────── */}
      <section aria-labelledby="participantes-heading">
        <h2 id="participantes-heading" className="mb-4 text-lg font-semibold">
          Participantes
        </h2>

        {evento.participants.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No hay participantes registrados para este evento.
            </p>
          </div>
        ) : (
          <Card size="sm">
            <ul role="list" className="divide-y">
              {evento.participants.map((participant) => (
                <li
                  key={participant.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Ícono de estado */}
                  <StatusIcon status={participant.status} />

                  {/* Nombre */}
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {participant.teamMember.name}
                    </span>

                    <div className="flex items-center gap-3">
                      {/* Monto pagado si existe */}
                      {participant.payment && (
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(Number(participant.payment.amount))}
                        </span>
                      )}
                      {/* Badge de estado */}
                      <StatusBadge status={participant.status} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

    </div>
  )
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function StatusIcon({ status }: { status: ParticipantStatus }) {
  if (status === "PAGO") {
    return (
      <CheckCircle2
        className="size-5 shrink-0 text-green-500"
        aria-label="Pagó"
      />
    )
  }
  if (status === "EXIMIDA") {
    return (
      <MinusCircle
        className="size-5 shrink-0 text-muted-foreground"
        aria-label="Eximida"
      />
    )
  }
  return (
    <Clock
      className="size-5 shrink-0 text-amber-500"
      aria-label="Pendiente"
    />
  )
}

const STATUS_BADGE: Record<ParticipantStatus, { label: string; className: string }> = {
  PAGO:      { label: "Pagó",      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  PENDIENTE: { label: "Pendiente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  EXIMIDA:   { label: "Eximida",   className: "bg-muted text-muted-foreground" },
}

function StatusBadge({ status }: { status: ParticipantStatus }) {
  const { label, className } = STATUS_BADGE[status]
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  )
}
