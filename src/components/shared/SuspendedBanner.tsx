import { AlertTriangle } from "lucide-react"

/** RF-56b: banner de modo solo-lectura por suscripción suspendida. */
export function SuspendedBanner() {
  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">Cuenta suspendida</p>
        <p className="mt-0.5 text-destructive/90">
          Esta cuenta está suspendida por falta de pago. Podés seguir viendo todos tus datos, pero no
          podés crear, editar ni eliminar nada hasta que se regularice el pago.
        </p>
      </div>
    </div>
  )
}
