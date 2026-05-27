import Link from "next/link"
import { Calendar } from "lucide-react"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { EVENT_TYPE_LABELS } from "@/lib/validations/evento"
import type { EventoListItem } from "@/services/eventoService"

// Badges monocromáticos en el tema violeta — sin colores semánticos por tipo
const TYPE_BADGE_CLASSES: Record<string, string> = {
  CUOTA:    "border-primary/30 bg-primary/8 text-primary",
  AMISTOSO: "border-border bg-muted text-muted-foreground",
  TORNEO:   "border-primary/50 bg-primary/15 text-primary",
  OTRO:     "border-border bg-muted text-muted-foreground",
}

interface EventoCardProps {
  evento: EventoListItem
  equipoId: string
}

export function EventoCard({ evento, equipoId }: EventoCardProps) {
  const total = evento.participants.length
  const pagos = evento.participants.filter((p) => p.status === "PAGO").length
  const eximidas = evento.participants.filter((p) => p.status === "EXIMIDA").length
  const obligadas = total - eximidas
  const progreso = obligadas > 0 ? Math.round((pagos / obligadas) * 100) : 100

  return (
    <Link
      href={`/equipos/${equipoId}/eventos/${evento.id}`}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-xl"
    >
      <div className="flex h-full flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30">

        {/* Header: nombre + tipo */}
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {evento.name}
          </p>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_BADGE_CLASSES[evento.type] ?? TYPE_BADGE_CLASSES.OTRO}`}
          >
            {EVENT_TYPE_LABELS[evento.type]}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {/* Monto y fecha */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold tabular-nums text-foreground">
              {formatCurrency(Number(evento.amountPerPlayer))}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" aria-hidden="true" />
              {formatDateShort(evento.dueDate)}
            </span>
          </div>

          {/* Barra de progreso */}
          {total > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{pagos} de {obligadas} pagaron</span>
                <span className={progreso === 100 ? "text-primary font-medium" : ""}>{progreso}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progreso}%`,
                    background: progreso === 100
                      ? "oklch(0.63 0.22 285)"
                      : "oklch(0.63 0.22 285 / 0.6)",
                  }}
                  role="progressbar"
                  aria-valuenow={progreso}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </Link>
  )
}
