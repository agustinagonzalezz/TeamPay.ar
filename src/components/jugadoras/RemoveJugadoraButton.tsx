"use client"

/**
 * Botón de dar de baja una jugadora. Pide confirmación antes de proceder.
 * Solo se renderiza si el usuario es capitana y la jugadora no es la propia capitana.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RemoveJugadoraButtonProps {
  equipoId: string
  jugadoraId: string
  jugadoraName: string
}

export function RemoveJugadoraButton({
  equipoId,
  jugadoraId,
  jugadoraName,
}: RemoveJugadoraButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove() {
    const confirmed = window.confirm(
      `¿Dar de baja a ${jugadoraName}? Esta acción la marcará como inactiva.`
    )
    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/equipos/${equipoId}/jugadoras/${jugadoraId}`,
        { method: "DELETE" }
      )
      const data = (await res.json()) as { success: boolean; error?: string }

      if (!res.ok || !data.success) {
        setError(data.error ?? "No se pudo dar de baja.")
        return
      }

      router.refresh()
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleRemove}
        disabled={loading}
        aria-label={`Dar de baja a ${jugadoraName}`}
        className="text-muted-foreground hover:text-destructive"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
