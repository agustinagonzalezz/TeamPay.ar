"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeleteAccountButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmCount = prompt(
      "Esta acción es IRREVERSIBLE. Se eliminarán:\n• Tu cuenta\n• Todos tus equipos\n• Todos los eventos, pagos y gastos asociados\n\nEscribí 'eliminar cuenta' para confirmar:"
    )
    if (confirmCount !== "eliminar cuenta") return

    setLoading(true)
    try {
      const res = await fetch("/api/perfil/delete-account", { method: "POST" })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) {
        alert(data.error ?? "No se pudo eliminar la cuenta.")
        return
      }
      // Logout automático + redirección
      await signOut({ redirect: false })
      router.push("/")
    } catch {
      alert("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="border-destructive/40 text-destructive hover:bg-destructive/10"
      disabled={loading}
      onClick={handleDelete}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      {loading ? "Eliminando..." : "Eliminar mi cuenta"}
    </Button>
  )
}
