"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
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
import { Input } from "@/components/ui/input"
import { SubscriptionStatusBadge } from "@/components/admin/SubscriptionBadges"
import type { SubscriptionStatus } from "@/generated/prisma/client"
import type { ChangeSubscriptionStatusInput } from "@/lib/validations/subscription"

type Action = ChangeSubscriptionStatusInput["action"]

interface SubscriptionStatusActionsProps {
  teamId: string
  statusActual: SubscriptionStatus
}

const SIMPLE_ACTIONS: { action: Action; label: string }[] = [
  { action: "ACTIVATE", label: "Activar" },
  { action: "MARK_PAID", label: "Marcar como pagada" },
  { action: "REACTIVATE", label: "Reactivar" },
]

// RNF-17: acciones destructivas, requieren confirmación explícita antes de ejecutarse.
const DESTRUCTIVE_ACTIONS: { action: Action; label: string; title: string; description: string }[] = [
  {
    action: "SUSPEND",
    label: "Suspender",
    title: "¿Suspender la suscripción?",
    description: "El equipo va a quedar en modo solo-lectura hasta que se reactive.",
  },
  {
    action: "CANCEL",
    label: "Cancelar",
    title: "¿Cancelar la suscripción?",
    description: "Marca la relación comercial con este equipo como finalizada.",
  },
]

export function SubscriptionStatusActions({ teamId, statusActual }: SubscriptionStatusActionsProps) {
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState<Action | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState("")
  const [confirmOpenFor, setConfirmOpenFor] = useState<Action | null>(null)

  async function runAction(action: Action, extra?: { trialEndsAt?: string }) {
    setLoadingAction(action)
    try {
      const res = await fetch(`/api/admin/equipos/${teamId}/subscription/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = (await res.json()) as { success: boolean; error?: string }

      if (!res.ok || !data.success) {
        toast.error(data.error ?? "No se pudo actualizar el estado.")
        return
      }

      toast.success("Estado actualizado.")
      setConfirmOpenFor(null)
      router.refresh()
    } catch {
      toast.error("No se pudo conectar con el servidor.")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="rounded-xl border px-4 py-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Estado de la suscripción</h2>
        <SubscriptionStatusBadge status={statusActual} />
      </div>

      <div className="flex flex-wrap gap-2">
        {SIMPLE_ACTIONS.map(({ action, label }) => (
          <Button
            key={action}
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingAction !== null}
            onClick={() => runAction(action)}
          >
            {loadingAction === action && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            {label}
          </Button>
        ))}

        {DESTRUCTIVE_ACTIONS.map(({ action, label, title, description }) => (
          <AlertDialog
            key={action}
            open={confirmOpenFor === action}
            onOpenChange={(open) => setConfirmOpenFor(open ? action : null)}
          >
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={loadingAction !== null}
                />
              }
            >
              {label}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loadingAction === action}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={loadingAction === action}
                  onClick={() => runAction(action)}
                >
                  {loadingAction === action && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
      </div>

      <div className="mt-4 flex items-end gap-2 border-t pt-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Extender trial hasta</label>
          <Input
            type="date"
            value={trialEndsAt}
            onChange={(e) => setTrialEndsAt(e.target.value)}
            className="h-8 w-40"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!trialEndsAt || loadingAction !== null}
          onClick={() => runAction("EXTEND_TRIAL", { trialEndsAt })}
        >
          {loadingAction === "EXTEND_TRIAL" && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          Extender
        </Button>
      </div>
    </div>
  )
}
