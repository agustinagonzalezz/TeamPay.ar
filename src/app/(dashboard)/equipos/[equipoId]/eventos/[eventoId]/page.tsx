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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { ParticipantRow } from "@/components/eventos/ParticipantRow"
import { CerrarEventoButton } from "@/components/eventos/CerrarEventoButton"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { EVENT_TYPE_LABELS } from "@/lib/validations/evento"

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

  const [result, isCapitana] = await Promise.all([
    getEventoById(eventoId, equipoId, user.id),
    checkIsCapitana(equipoId, user.id),
  ])

  if (!result.success) notFound()

  const evento = result.data

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

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{evento.name}</h1>
              {isClosed && (
                <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Cerrado
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{EVENT_TYPE_LABELS[evento.type]}</span>
              <span>·</span>
              <span>{formatCurrency(Number(evento.amountPerPlayer))} por jugadora</span>
              <span>·</span>
              <span>Vence {formatDate(evento.dueDate)}</span>
              {isClosed && evento.closedAt && (
                <>
                  <span>·</span>
                  <span>Cerrado el {formatDate(evento.closedAt)}</span>
                </>
              )}
            </div>
          </div>
          {isCapitana && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {!isClosed && (
                <CerrarEventoButton equipoId={equipoId} eventoId={eventoId} eventoName={evento.name} />
              )}
              <Link
                href={`/equipos/${equipoId}/eventos/${eventoId}/editar`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Editar
              </Link>
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
        <StatCard label="Total cobrado" value={formatCurrency(totalCobrado)} />
        <StatCard
          label="Pendiente"
          value={formatCurrency(Math.max(totalEsperado - totalCobrado, 0))}
        />
        <StatCard label="Pagaron" value={`${pagos} de ${obligadas} (${progreso}%)`} />
      </div>

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
                      ? { ...participant.payment, amount: Number(participant.payment.amount) }
                      : null,
                  }}
                  equipoId={equipoId}
                  eventoId={eventoId}
                  isCapitana={isCapitana}
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
