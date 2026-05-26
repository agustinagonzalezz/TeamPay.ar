/**
 * src/components/eventos/EventoCard.tsx — Tarjeta de evento para el listado
 *
 * Muestra nombre, tipo, monto, fecha y barra de progreso de pagos.
 * Server Component.
 */

import Link from "next/link"
import { Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { EVENT_TYPE_LABELS } from "@/lib/validations/evento"
import type { EventoListItem } from "@/services/eventoService"

// ── Colores por tipo de evento ────────────────────────────────────────────────

const TYPE_BADGE_CLASSES: Record<string, string> = {
  CUOTA:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  AMISTOSO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  TORNEO:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  OTRO:     "bg-muted text-muted-foreground",
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface EventoCardProps {
  evento: EventoListItem
  equipoId: string
}

// ── Componente ────────────────────────────────────────────────────────────────

export function EventoCard({ evento, equipoId }: EventoCardProps) {
  const total = evento.participants.length
  const pagos = evento.participants.filter((p) => p.status === "PAGO").length
  const eximidas = evento.participants.filter((p) => p.status === "EXIMIDA").length
  const obligadas = total - eximidas // quienes deben pagar
  const progreso = obligadas > 0 ? Math.round((pagos / obligadas) * 100) : 100

  return (
    <Link
      href={`/equipos/${equipoId}/eventos/${evento.id}`}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-xl"
    >
      <Card
        size="sm"
        className="h-full transition-shadow group-hover:shadow-md group-focus-visible:shadow-md"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-sm leading-snug">
              {evento.name}
            </CardTitle>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_CLASSES[evento.type] ?? TYPE_BADGE_CLASSES.OTRO}`}
            >
              {EVENT_TYPE_LABELS[evento.type]}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {/* Monto y fecha */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">
              {formatCurrency(Number(evento.amountPerPlayer))}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="size-3.5" aria-hidden="true" />
              {formatDateShort(evento.dueDate)}
            </span>
          </div>

          {/* Barra de progreso de pagos */}
          {total > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{pagos} de {obligadas} pagaron</span>
                <span>{progreso}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progreso}%` }}
                  role="progressbar"
                  aria-valuenow={progreso}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
