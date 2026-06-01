"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Loader2, MinusCircle, Pencil, RotateCcw, X, Check } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import type { ParticipantStatus, MedioPago } from "@/generated/prisma/client"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type SerializedParticipant = {
  id: string
  eventId: string
  teamMemberId: string
  status: ParticipantStatus
  customAmount: number | null  // RF-21
  createdAt: Date
  updatedAt: Date
  teamMember: { id: string; name: string }
  payment: { amount: number; paidAt: Date; medioPago: MedioPago | null } | null
}

interface ParticipantRowProps {
  participant: SerializedParticipant
  equipoId: string
  eventoId: string
  isCapitana: boolean
  amountPerPlayer: number
  isClosed: boolean  // RF-24
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ParticipantRow({
  participant,
  equipoId,
  eventoId,
  isCapitana,
  amountPerPlayer,
  isClosed,
}: ParticipantRowProps) {
  const router = useRouter()

  const [status, setStatus] = useState<ParticipantStatus>(participant.status)
  const [paidAmount, setPaidAmount] = useState<number | null>(
    participant.payment ? Number(participant.payment.amount) : null
  )
  const [customAmount, setCustomAmount] = useState<number | null>(participant.customAmount)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form de pago: medio + monto opcional
  const [showPayForm, setShowPayForm] = useState(false)
  const [selectedMedioPago, setSelectedMedioPago] = useState<MedioPago | null>(null)
  const [inputAmount, setInputAmount] = useState("")

  // RF-21: editar monto personalizado
  const [editingCustom, setEditingCustom] = useState(false)
  const [customInput, setCustomInput] = useState("")

  useEffect(() => {
    setStatus(participant.status)
    setPaidAmount(participant.payment ? Number(participant.payment.amount) : null)
    setCustomAmount(participant.customAmount)
  }, [participant.status, participant.payment, participant.customAmount])

  const effectiveAmount = customAmount ?? amountPerPlayer

  // ── Actualizar status ──────────────────────────────────────────────────────

  async function handleStatusChange(
    newStatus: ParticipantStatus,
    overrideAmount?: number,
    medioPago?: MedioPago
  ) {
    if (isLoading) return
    setError(null)
    const prevStatus = status
    const prevAmount = paidAmount

    setStatus(newStatus)
    setPaidAmount(newStatus === "PAGO" ? (overrideAmount ?? effectiveAmount) : null)
    setIsLoading(true)

    try {
      const body: Record<string, unknown> = { status: newStatus }
      if (newStatus === "PAGO" && overrideAmount != null) body.paidAmount = overrideAmount
      if (newStatus === "PAGO" && medioPago) body.medioPago = medioPago

      const res = await fetch(
        `/api/equipos/${equipoId}/eventos/${eventoId}/participantes/${participant.id}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      )
      const data = await res.json() as { success: boolean; error?: string }

      if (!res.ok || !data.success) {
        setStatus(prevStatus)
        setPaidAmount(prevAmount)
        setError(data.error ?? "Error al actualizar")
      } else {
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

  // ── Confirmar pago con medio de pago ───────────────────────────────────────

  function handlePayConfirm() {
    if (!selectedMedioPago) return
    const parsed = Number(inputAmount)
    const overrideAmount = inputAmount && parsed > 0 ? parsed : undefined
    handleStatusChange("PAGO", overrideAmount, selectedMedioPago)
    setShowPayForm(false)
    setInputAmount("")
    setSelectedMedioPago(null)
  }

  function handleCancelPay() {
    setShowPayForm(false)
    setInputAmount("")
    setSelectedMedioPago(null)
  }

  // ── Actualizar customAmount (RF-21) ────────────────────────────────────────

  async function saveCustomAmount() {
    const parsed = customInput === "" ? null : Number(customInput)
    if (parsed !== null && (isNaN(parsed) || parsed <= 0)) {
      setError("Monto inválido")
      return
    }
    setEditingCustom(false)
    setError(null)
    setIsLoading(true)
    const prev = customAmount
    setCustomAmount(parsed)

    try {
      const res = await fetch(
        `/api/equipos/${equipoId}/eventos/${eventoId}/participantes/${participant.id}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customAmount: parsed }) }
      )
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) { setCustomAmount(prev); setError(data.error ?? "Error") }
      else router.refresh()
    } catch {
      setCustomAmount(prev)
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <li className="flex flex-col px-4 py-3">
      <div className="flex items-center gap-3">
        <StatusIcon status={status} />

        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium truncate">{participant.teamMember.name}</span>

            {/* Monto efectivo con edición (RF-21) */}
            {status !== "EXIMIDA" && (
              <div className="flex items-center gap-1 mt-0.5">
                {editingCustom ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      autoFocus
                      type="number"
                      min="1"
                      value={customInput}
                      placeholder={String(amountPerPlayer)}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveCustomAmount(); if (e.key === "Escape") setEditingCustom(false) }}
                      className="h-5 w-24 rounded border border-input bg-background px-1.5 text-xs outline-none focus-visible:border-ring"
                    />
                    <button onClick={saveCustomAmount} className="text-primary"><Check className="size-3" /></button>
                    <button onClick={() => setEditingCustom(false)} className="text-muted-foreground"><X className="size-3" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className={cn("text-xs tabular-nums", customAmount ? "text-primary font-medium" : "text-muted-foreground")}>
                      {formatCurrency(effectiveAmount)}
                      {customAmount && <span className="ml-1 text-[10px] opacity-60">(personalizado)</span>}
                    </span>
                    {isCapitana && !isClosed && (
                      <button
                        onClick={() => { setCustomInput(customAmount ? String(customAmount) : ""); setEditingCustom(true) }}
                        className="rounded p-0.5 text-muted-foreground/40 hover:text-primary"
                        title="Personalizar monto"
                      >
                        <Pencil className="size-2.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {status === "PAGO" && paidAmount !== null && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums text-green-600">
                  {formatCurrency(paidAmount)}
                </span>
                {participant.payment?.medioPago && (
                  <MedioPagoBadge medioPago={participant.payment.medioPago} />
                )}
              </div>
            )}

            <StatusBadge status={status} />

            {isCapitana && !isClosed && (
              <div className="flex items-center">
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <ActionButtons
                    status={status}
                    showPayForm={showPayForm}
                    onShowPayForm={() => setShowPayForm(true)}
                    onChange={handleStatusChange}
                  />
                )}
              </div>
            )}

            {isClosed && status === "PENDIENTE" && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Cerrado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Panel de pago: se expande debajo de la fila */}
      {showPayForm && (
        <div className="mt-2 ml-8 flex flex-col gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
          {/* Selector de medio de pago */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">¿Cómo pagó?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedMedioPago("EFECTIVO")}
                className={cn(
                  "flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedMedioPago === "EFECTIVO"
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                Efectivo
              </button>
              <button
                type="button"
                onClick={() => setSelectedMedioPago("TRANSFERENCIA")}
                className={cn(
                  "flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedMedioPago === "TRANSFERENCIA"
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                Transferencia
              </button>
            </div>
          </div>

          {/* Monto opcional */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Monto</span>
            <span className="text-xs text-muted-foreground">$</span>
            <input
              type="number"
              min="1"
              value={inputAmount}
              placeholder={String(effectiveAmount)}
              onChange={(e) => setInputAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && selectedMedioPago) handlePayConfirm(); if (e.key === "Escape") handleCancelPay() }}
              className="h-7 w-28 rounded border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring"
            />
            <span className="flex-1 text-[10px] text-muted-foreground">(opcional)</span>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePayConfirm}
              disabled={!selectedMedioPago}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                selectedMedioPago
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              )}
            >
              Confirmar pago
            </button>
            <button
              type="button"
              onClick={handleCancelPay}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            {!selectedMedioPago && (
              <span className="text-[10px] text-amber-600">Seleccioná el medio de pago</span>
            )}
          </div>
        </div>
      )}

      {error && <p className="pl-8 mt-1 text-xs text-destructive">{error}</p>}
    </li>
  )
}

// ── Sub-componentes de UI ─────────────────────────────────────────────────────

function StatusIcon({ status }: { status: ParticipantStatus }) {
  if (status === "PAGO") return <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-label="Pagó" />
  if (status === "EXIMIDA") return <MinusCircle className="size-5 shrink-0 text-muted-foreground" aria-label="Eximida" />
  return <Clock className="size-5 shrink-0 text-amber-500" aria-label="Pendiente" />
}

const STATUS_BADGE: Record<ParticipantStatus, { label: string; className: string }> = {
  PAGO:      { label: "Pagó",      className: "bg-green-100 text-green-700" },
  PENDIENTE: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  EXIMIDA:   { label: "Eximida",   className: "bg-muted text-muted-foreground" },
}

function StatusBadge({ status }: { status: ParticipantStatus }) {
  const { label, className } = STATUS_BADGE[status]
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", className)}>{label}</span>
}

function MedioPagoBadge({ medioPago }: { medioPago: MedioPago }) {
  return (
    <span className={cn(
      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
      medioPago === "EFECTIVO"
        ? "bg-green-50 text-green-700 border border-green-200"
        : "bg-blue-50 text-blue-700 border border-blue-200"
    )}>
      {medioPago === "EFECTIVO" ? "Efectivo" : "Transfer."}
    </span>
  )
}

function ActionButtons({
  status,
  showPayForm,
  onShowPayForm,
  onChange,
}: {
  status: ParticipantStatus
  showPayForm: boolean
  onShowPayForm: () => void
  onChange: (status: ParticipantStatus) => void
}) {
  if (status === "PENDIENTE") {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onShowPayForm}
          disabled={showPayForm}
          title="Marcar como pagado"
          className={cn(
            "rounded-md border border-green-200 bg-green-50 px-2 py-0.5",
            "text-xs font-medium text-green-700 transition-colors hover:bg-green-100",
            showPayForm && "opacity-50 cursor-not-allowed"
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
