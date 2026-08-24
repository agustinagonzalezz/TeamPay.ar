import { AlertTriangle } from "lucide-react"
import type { TeamWriteAccessReason } from "@/lib/auth/team-access"

const COPY: Record<TeamWriteAccessReason, { title: string; body: string }> = {
  SUBSCRIPTION_SUSPENDED: {
    title: "Cuenta suspendida",
    body: "Esta cuenta está suspendida por falta de pago. Podés seguir viendo todos tus datos, pero no podés crear, editar ni eliminar nada hasta que se regularice el pago.",
  },
  TRIAL_EXPIRED: {
    title: "Prueba gratis terminada",
    body: "Tu prueba gratis de 14 días terminó. Podés seguir viendo todos tus datos, pero no podés crear, editar ni eliminar nada hasta activar el plan — contactanos para hacerlo.",
  },
}

/** RF-56b: banner de modo solo-lectura. El texto depende de la causa del bloqueo. */
export function SuspendedBanner({ reason }: { reason: TeamWriteAccessReason }) {
  const copy = COPY[reason]

  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-0.5 text-destructive/90">{copy.body}</p>
      </div>
    </div>
  )
}
