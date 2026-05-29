"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, X, Loader2 } from "lucide-react"

interface EditJugadoraButtonProps {
  equipoId: string
  jugadoraId: string
  nombreActual: string
}

export function EditJugadoraButton({ equipoId, jugadoraId, nombreActual }: EditJugadoraButtonProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [nombre, setNombre] = useState(nombreActual)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setNombre(nombreActual)
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError(null)
  }

  async function save() {
    const trimmed = nombre.trim()
    if (trimmed.length < 2) { setError("Mínimo 2 caracteres"); return }
    if (trimmed === nombreActual) { setEditing(false); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/jugadoras/${jugadoraId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
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
      <button
        onClick={startEdit}
        className="rounded p-1 text-muted-foreground/50 transition-colors hover:text-primary"
        title="Editar nombre"
        aria-label={`Editar ${nombreActual}`}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save()
            if (e.key === "Escape") cancel()
          }}
          className="h-7 w-44 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <button
          onClick={save}
          disabled={loading}
          className="rounded p-1 text-primary hover:bg-primary/10 disabled:opacity-50"
          title="Confirmar"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        </button>
        <button
          onClick={cancel}
          disabled={loading}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          title="Cancelar"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
