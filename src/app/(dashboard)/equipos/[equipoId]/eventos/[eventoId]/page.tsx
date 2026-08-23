/**
 * app/(dashboard)/equipos/[equipoId]/eventos/[eventoId]/page.tsx
 *
 * Detalle de un evento: info general + lista de participantes con estado de pago.
 * La capitana puede marcar/desmarcar pagos desde esta página.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Copy, Pencil } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getEventoById, checkIsCapitana } from "@/services/eventoService"
import { getTeamSubscriptionStatus } from "@/services/teamService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { ParticipantRow } from "@/components/eventos/ParticipantRow"
import { CerrarEventoButton } from "@/components/eventos/CerrarEventoButton"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { EVENT_TYPE_LABELS } from "@/lib/validations/evento"

export const metadata: Metadata = { title: "Evento — TeamPayment.app" }

// ── Página ────────────────────────────────────────────────────────────────────

export default async function EventoPage({
  params,
}: {
  params: Promise<{ equipoId: string; eventoId: string }>
}) {
  const { equipoId, eventoId } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [result, isCapitana, subscriptionStatus] = await Promise.all([
    getEventoById(eventoId, equipoId, user.id),
    checkIsCapitana(equipoId, user.id),
    getTeamSubscriptionStatus(equipoId),
  ])

  if (!result.success) notFound()

  const evento = result.data
  // RF-56: en modo solo-lectura no se muestran los controles de crear/editar/eliminar
  const puedeEscribir = subscriptionStatus !== "SUSPENDED"

  // Estadísticas de pagos
  const total = evento.participants.length
  const pagos = evento.participants.filter((p) => p.status === "PAGO").length
  const eximidas = evento.participants.filter((p) => p.status === "EXIMIDA").length
  const obligadas = total - eximidas
  const progreso = obligadas > 0 ? Math.round((pagos / obligadas) * 100) : 100

  const totalCobrado = evento.participants.reduce(
    (acc, p) => acc + (p.payment ? Number(p.payment.amount) : 0),
    0
  )
  // RF-21: usar customAmount por participante cuando está definido
  const totalEsperado = evento.participants
    .filter((p) => p.status !== "EXIMIDA")
    .reduce((acc, p) => acc + Number(p.customAmount ?? evento.amountPerPlayer), 0)

  // Desglose por medio de pago
  const cobradoEfectivo = evento.participants.reduce(
    (acc, p) => acc + (p.payment?.medioPago === "EFECTIVO" ? Number(p.payment.amount) : 0),
    0
  )
  const cobradoTransferencia = evento.participants.reduce(
    (acc, p) => acc + (p.payment?.medioPago === "TRANSFERENCIA" ? Number(p.payment.amount) : 0),
    0
  )

  // Subtítulos explicativos de cada card
  const hasCustomAmounts = evento.participants.some((p) => p.customAmount !== null)
  const amountPerPlayer = Number(evento.amountPerPlayer)

  const subtitleCobrado = pagos === 0
    ? "Ningún pago registrado aún"
    : cobradoEfectivo > 0 || cobradoTransferencia > 0
      ? [
          cobradoEfectivo > 0 && `Efectivo: ${formatCurrency(cobradoEfectivo)}`,
          cobradoTransferencia > 0 && `Transfer.: ${formatCurrency(cobradoTransferencia)}`,
        ].filter(Boolean).join(" · ")
      : `${pagos} pago${pagos !== 1 ? "s" : ""} sin medio registrado`

  const subtitlePendiente = hasCustomAmounts
    ? `${obligadas} obligada${obligadas !== 1 ? "s" : ""}${eximidas > 0 ? ` · ${eximidas} eximida${eximidas !== 1 ? "s" : ""}` : ""} · montos variados`
    : eximidas > 0
      ? `${obligadas} de ${total} · ${eximidas} eximida${eximidas !== 1 ? "s" : ""} · ${formatCurrency(amountPerPlayer)} c/u`
      : `${obligadas} jugadoras × ${formatCurrency(amountPerPlayer)}`

  const subtitlePagaron = eximidas > 0
    ? `${total} en total · ${eximidas} eximida${eximidas !== 1 ? "s" : ""}`
    : `${total} participantes · ninguna eximida`

  const isClosed = !!evento.closedAt

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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{evento.name}</h1>
              {isClosed && (
                <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Cerrado
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-col gap-0.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
              <span>{EVENT_TYPE_LABELS[evento.type]}</span>
              <span className="hidden sm:inline">·</span>
              <span>{formatCurrency(Number(evento.amountPerPlayer))} por jugadora</span>
              <span className="hidden sm:inline">·</span>
              <span>Vence {formatDate(evento.dueDate)}</span>
              {isClosed && evento.closedAt && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span>Cerrado el {formatDate(evento.closedAt)}</span>
                </>
              )}
            </div>
          </div>
          {isCapitana && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {!isClosed && puedeEscribir && (
                <CerrarEventoButton equipoId={equipoId} eventoId={eventoId} eventoName={evento.name} />
              )}
              {puedeEscribir && (
                <Link
                  href={`/equipos/${equipoId}/eventos/${eventoId}/editar`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </Link>
              )}
              <Link
                href={`/equipos/${equipoId}/eventos/nuevo?duplicar=${eventoId}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Copy className="size-4" aria-hidden="true" />
                Duplicar
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total cobrado" value={formatCurrency(totalCobrado)} subtitle={subtitleCobrado} />
        <StatCard
          label="Pendiente"
          value={formatCurrency(Math.max(totalEsperado - totalCobrado, 0))}
          subtitle={subtitlePendiente}
        />
        <StatCard label="Pagaron" value={`${pagos} de ${obligadas} (${progreso}%)`} subtitle={subtitlePagaron} />
      </div>

      {/* ── Desglose de costos ────────────────────────────────────────────── */}
      {evento.conceptos.length > 0 && (
        <section aria-labelledby="conceptos-heading">
          <h2 id="conceptos-heading" className="mb-3 text-lg font-semibold">
            Desglose de costos
          </h2>
          <Card size="sm">
            <ul role="list" className="divide-y">
              {evento.conceptos
                .sort((a, b) => a.orden - b.orden)
                .map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-sm">{c.nombre}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(Number(c.monto))}
                    </span>
                  </li>
                ))}
              <li className="flex items-center justify-between gap-3 bg-muted/40 px-4 py-2.5">
                <span className="text-sm font-semibold">Total equipo</span>
                <span className="text-sm font-bold tabular-nums">
                  {formatCurrency(evento.conceptos.reduce((acc, c) => acc + Number(c.monto), 0))}
                </span>
              </li>
            </ul>
          </Card>
        </section>
      )}

      {/* ── Lista de participantes ─────────────────────────────────────────── */}
      <section aria-labelledby="participantes-heading">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="participantes-heading" className="text-lg font-semibold">
            Participantes
          </h2>
          {isCapitana && total > 0 && (
            <p className="text-xs text-muted-foreground">
              Tap en "Pagó" para registrar un pago
            </p>
          )}
        </div>

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
                <ParticipantRow
                  key={participant.id}
                  participant={{
                    ...participant,
                    customAmount: participant.customAmount != null ? Number(participant.customAmount) : null,
                    payment: participant.payment
                      ? {
                          ...participant.payment,
                          amount: Number(participant.payment.amount),
                          medioPago: participant.payment.medioPago,
                        }
                      : null,
                  }}
                  equipoId={equipoId}
                  eventoId={eventoId}
                  isCapitana={isCapitana && puedeEscribir}
                  amountPerPlayer={Number(evento.amountPerPlayer)}
                  isClosed={isClosed}
                />
              ))}
            </ul>
          </Card>
        )}
      </section>

    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <Card size="sm">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold">{value}</p>
        {subtitle && <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
