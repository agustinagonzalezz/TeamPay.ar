"use client"

/**
 * src/components/gastos/DeleteGastoButton.tsx
 *
 * Botón para eliminar un gasto. Pide confirmación antes de proceder.
 * Llama router.refresh() tras el delete para actualizar la lista.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"

interface DeleteGastoButtonProps {
  gastoId: string
  equipoId: string
  concepto: string
}

export function DeleteGastoButton({
  gastoId,
  equipoId,
  concepto,
}: DeleteGastoButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar el gasto "${concepto}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/equipos/${equipoId}/gastos/${gastoId}`,
        { method: "DELETE" }
      )
      const data = (await res.json()) as { success: boolean; error?: string }

      if (!res.ok || !data.success) {
        alert(data.error ?? "No se pudo eliminar el gasto.")
        return
      }

      router.refresh()
    } catch {
      alert("Error de conexión. Intentá de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isLoading}
      aria-label={`Eliminar gasto: ${concepto}`}
      className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
    </button>
  )
}
