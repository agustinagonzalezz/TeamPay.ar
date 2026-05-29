"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface EditGastoButtonProps {
  equipoId: string
  gastoId: string
  concepto: string
  monto: number
  paidTo: string
  paidAt: string // YYYY-MM-DD
}

export function EditGastoButton({ equipoId, gastoId, concepto, monto, paidTo, paidAt }: EditGastoButtonProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ concept: concepto, amount: String(monto), paidTo, paidAt })

  function startEdit() { setForm({ concept: concepto, amount: String(monto), paidTo, paidAt }); setError(null); setEditing(true) }
  function cancel() { setEditing(false); setError(null) }

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function save() {
    if (!form.concept.trim() || !form.paidTo.trim() || !form.paidAt) { setError("Completá todos los campos"); return }
    const amount = Number(form.amount)
    if (!amount || amount <= 0) { setError("Monto inválido"); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/gastos/${gastoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: form.concept, amount, paidTo: form.paidTo, paidAt: form.paidAt }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) { setError(data.error ?? "Error al guardar"); return }
      setEditing(false)
      router.refresh()
    } catch {
      setError("No se pudo conectar.")
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <button onClick={startEdit} className="rounded p-1 text-muted-foreground/50 transition-colors hover:text-primary" title="Editar gasto">
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <div className="col-span-full flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Concepto</label>
          <input value={form.concept} onChange={set("concept")} className="h-7 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Monto</label>
          <input type="number" min="1" value={form.amount} onChange={set("amount")} className="h-7 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pagado a</label>
          <input value={form.paidTo} onChange={set("paidTo")} className="h-7 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Fecha</label>
          <input type="date" value={form.paidAt} onChange={set("paidAt")} className="h-7 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring" />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={loading} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">
          {loading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          {loading ? "Guardando..." : "Guardar"}
        </button>
        <button onClick={cancel} disabled={loading} className="rounded-md border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
          <X className="inline size-3" /> Cancelar
        </button>
      </div>
    </div>
  )
}
