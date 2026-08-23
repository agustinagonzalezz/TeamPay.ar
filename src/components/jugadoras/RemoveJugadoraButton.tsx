"use client"

/**
 * Botón de dar de baja una jugadora. Pide confirmación antes de proceder.
 * Solo se renderiza si el usuario es capitana y la jugadora no es la propia capitana.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove() {
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

      setOpen(false)
      router.refresh()
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={loading}
              aria-label={`Dar de baja a ${jugadoraName}`}
              className="text-muted-foreground hover:text-destructive"
            />
          }
        >
          <Trash2 className="size-3.5" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja a {jugadoraName}?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción la marcará como inactiva.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemove} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {loading ? "Dando de baja..." : "Dar de baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
