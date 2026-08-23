"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Lock, Loader2 } from "lucide-react"
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
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CerrarEventoButtonProps {
  equipoId: string
  eventoId: string
  eventoName: string
}

export function CerrarEventoButton({ equipoId, eventoId, eventoName }: CerrarEventoButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClose() {
    setLoading(true)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/eventos/${eventoId}/close`, { method: "POST" })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "No se pudo cerrar el evento.")
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        disabled={loading}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-amber-300/60 text-amber-700 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-700/40 dark:text-amber-400")}
      >
        <Lock className="size-4" />
        Cerrar evento
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cerrar el evento &quot;{eventoName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Una vez cerrado no se podrán registrar más pagos. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleClose} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? "Cerrando..." : "Cerrar evento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
