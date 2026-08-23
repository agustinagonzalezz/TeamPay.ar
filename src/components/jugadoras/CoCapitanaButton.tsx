"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Crown, Loader2 } from "lucide-react"
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

interface CoCapitanaButtonProps {
  equipoId: string
  jugadoraId: string
  jugadoraName: string
  isCoCapitana: boolean
}

export function CoCapitanaButton({ equipoId, jugadoraId, jugadoraName, isCoCapitana }: CoCapitanaButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accion = isCoCapitana ? "quitar" : "dar"

  async function handleToggle() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/jugadoras/${jugadoraId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCoCapitana: !isCoCapitana }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) {
        setError(data.error ?? `No se pudo ${accion} el rol.`)
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError("No se pudo conectar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          disabled={loading}
          title={isCoCapitana ? "Quitar co-capitana" : "Hacer co-capitana"}
          className={
            isCoCapitana
              ? "flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-destructive/10 hover:text-destructive transition-colors"
              : "rounded p-1 text-muted-foreground/40 transition-colors hover:text-primary"
          }
        >
          <Crown className="size-3.5" aria-hidden="true" />
          {isCoCapitana && <span>Co-cap ×</span>}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isCoCapitana ? `¿Quitar el rol de co-capitana a ${jugadoraName}?` : `¿Hacer co-capitana a ${jugadoraName}?`}
            </AlertDialogTitle>
            {!isCoCapitana && (
              <AlertDialogDescription>
                Tendrá los mismos permisos de gestión que vos.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={isCoCapitana ? "destructive" : "default"}
              onClick={handleToggle}
              disabled={loading}
            >
              {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isCoCapitana ? "Quitar" : "Hacer co-capitana"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="text-[10px] text-destructive max-w-32 text-right">{error}</p>}
    </div>
  )
}
