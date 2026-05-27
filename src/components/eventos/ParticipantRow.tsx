"use client"

/**
 * src/components/eventos/ParticipantRow.tsx
 *
 * Fila de participante en la página de detalle de un evento.
 * Muestra el nombre, estado de pago y (si es la capitana) botones de acción.
 *
 * UX de pago (solo para la capitana):
 *   PENDIENTE → botón "Pagó" (marca como PAGO) + botón "Eximida"
 *   PAGO      → botón de deshacer (↩) vuelve a PENDIENTE
 *   EXIMIDA   → botón de deshacer (↩) vuelve a PENDIENTE
 *
 * Usa actualización optimista: el estado local cambia de inmediato y se
 * revierte si la API falla. Luego llama router.refresh() para sincronizar
 * el panel de estadísticas del Server Component.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Loader2, MinusCircle, RotateCcw } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import type { ParticipantStatus } from "@/generated/prisma/client"

// ── Tipos ─────────────────────────────────────────────────────────────────────

/**
 * Versión serializable de ParticipantWithDetails.
 * Payment.amount se convierte a number antes de pasar como prop
 * (Prisma Decimal no es serializable entre Server → Client Components).
 */
export type SerializedParticipant = {
  id: string
  eventId: string
  teamMemberId: string
  status: ParticipantStatus
  createdAt: Date
  updatedAt: Date
  teamMember: { id: string; name: string }
  payment: { amount: number; paidAt: Date } | null
}

interface ParticipantRowProps {
  participant: SerializedParticipant
  equipoId: string
  eventoId: string
  isCapitana: boolean
  /** amountPerPlayer del evento — para mostrar el monto en la UI optimista */
  amountPerPlayer: number
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ParticipantRow({
  participant,
  equipoId,
  eventoId,
  isCapitana,
  amountPerPlayer,
}: ParticipantRowProps) {
  const router = useRouter()

  const [status, setStatus] = useState<ParticipantStatus>(participant.status)
  const [paidAmount, setPaidAmount] = useState<number | null>(
    participant.payment ? Number(participant.payment.amount) : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sincronizar cuando el Server Component refresca los datos
  useEffect(() => {
    setStatus(participant.status)
    setPaidAmount(participant.payment ? Number(participant.payment.amount) : null)
  }, [participant.status, participant.payment])

  async function handleStatusChange(newStatus: ParticipantStatus) {
    if (isLoading) return
    setError(null)

    // Guardar estado anterior para revertir en caso de error
    const prevStatus = status
    const prevAmount = paidAmount

    // Actualización optimista
    setStatus(newStatus)
    setPaidAmount(newStatus === "PAGO" ? amountPerPlayer : null)
    setIsLoading(true)

    try {
      const res = await fetch(
        `/api/equipos/${equipoId}/eventos/${eventoId}/participantes/${participant.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      )
      const data = (await res.json()) as { success: boolean; error?: string }

      if (!res.ok || !data.success) {
        // Revertir al estado anterior
        setStatus(prevStatus)
        setPaidAmount(prevAmount)
        setError(data.error ?? "Error al actualizar")
      } else {
        // Refrescar el Server Component para actualizar las estadísticas
        router.refresh()
      }
    } catch {
      setStatus(prevStatus)
      setPaidAmount(prevAmount)
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <li className="flex flex-col px-4 py-3">
      {/* Fila principal */}
      <div className="flex items-center gap-3">
        <StatusIcon status={status} />

        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
          <span className="text-sm font-medium truncate">
            {participant.teamMember.name}
          </span>

          <div className="flex shrink-0 items-center gap-2">
            {/* Monto pagado */}
            {status === "PAGO" && paidAmount !== null && (
              <span className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                {formatCurrency(paidAmount)}
              </span>
            )}

            {/* Badge de estado */}
            <StatusBadge status={status} />

            {/* Acciones (solo capitana) */}
            {isCapitana && (
              <div className="flex items-center">
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <ActionButtons status={status} onChange={handleStatusChange} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje de error inline */}
      {error && (
        <p className="pl-8 mt-1 text-xs text-destructive">{error}</p>
      )}
    </li>
  )
}

// ── Sub-componentes de UI ─────────────────────────────────────────────────────

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

const STATUS_BADGE: Record<
  ParticipantStatus,
  { label: string; className: string }
> = {
  PAGO: {
    label: "Pagó",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  PENDIENTE: {
    label: "Pendiente",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  EXIMIDA: {
    label: "Eximida",
    className: "bg-muted text-muted-foreground",
  },
}

function StatusBadge({ status }: { status: ParticipantStatus }) {
  const { label, className } = STATUS_BADGE[status]
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  )
}

function ActionButtons({
  status,
  onChange,
}: {
  status: ParticipantStatus
  onChange: (status: ParticipantStatus) => void
}) {
  if (status === "PENDIENTE") {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange("PAGO")}
          className={cn(
            "rounded-md border border-green-200 bg-green-50 px-2 py-0.5",
            "text-xs font-medium text-green-700 transition-colors",
            "hover:bg-green-100",
            "dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
          )}
        >
          Pagó
        </button>
        <button
          type="button"
          onClick={() => onChange("EXIMIDA")}
          className="rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Eximida
        </button>
      </div>
    )
  }

  // PAGO o EXIMIDA: botón para volver a PENDIENTE
  return (
    <button
      type="button"
      onClick={() => onChange("PENDIENTE")}
      title="Marcar como pendiente"
      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <RotateCcw className="size-3.5" aria-hidden="true" />
    </button>
  )
}
