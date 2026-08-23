"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const CONFIRM_TEXT = "eliminar cuenta"

export function DeleteAccountButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) setConfirmText("")
  }

  async function handleDelete() {
    if (confirmText !== CONFIRM_TEXT) return

    setLoading(true)
    try {
      const res = await fetch("/api/perfil/delete-account", { method: "POST" })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "No se pudo eliminar la cuenta.")
        return
      }
      setOpen(false)
      // Logout automático + redirección
      await signOut({ redirect: false })
      router.push("/")
    } catch {
      toast.error("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          />
        }
      >
        <Trash2 className="size-4" />
        Eliminar mi cuenta
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Esta acción es irreversible</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminarán tu cuenta, todos tus equipos, y todos los eventos, pagos y gastos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-delete-account" className="text-sm text-muted-foreground">
            Escribí <span className="font-semibold text-foreground">&quot;{CONFIRM_TEXT}&quot;</span> para confirmar:
          </label>
          <Input
            id="confirm-delete-account"
            autoComplete="off"
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmText !== CONFIRM_TEXT}
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? "Eliminando..." : "Eliminar mi cuenta"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
