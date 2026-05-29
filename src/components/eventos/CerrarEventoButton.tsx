"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Loader2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CerrarEventoButtonProps {
  equipoId: string
  eventoId: string
  eventoName: string
}

export function CerrarEventoButton({ equipoId, eventoId, eventoName }: CerrarEventoButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClose() {
    if (!confirm(`¿Cerrar el evento "${eventoName}"? Una vez cerrado no se podrán registrar más pagos. Esta acción no se puede deshacer.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/eventos/${eventoId}/close`, { method: "POST" })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) { alert(data.error ?? "No se pudo cerrar el evento."); return }
      router.refresh()
    } catch {
      alert("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClose}
      disabled={loading}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-amber-300/60 text-amber-700 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-700/40 dark:text-amber-400")}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
      {loading ? "Cerrando..." : "Cerrar evento"}
    </button>
  )
}
