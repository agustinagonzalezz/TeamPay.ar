"use client"

/**
 * src/components/gastos/DeleteGastoButton.tsx
 *
 * Botón para eliminar un gasto. Pide confirmación antes de proceder.
 * Llama router.refresh() tras el delete para actualizar la lista.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
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
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/equipos/${equipoId}/gastos/${gastoId}`,
        { method: "DELETE" }
      )
      const data = (await res.json()) as { success: boolean; error?: string }

      if (!res.ok || !data.success) {
        toast.error(data.error ?? "No se pudo eliminar el gasto.")
        return
      }

      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
        aria-label={`Eliminar gasto: ${concepto}`}
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar el gasto &quot;{concepto}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
