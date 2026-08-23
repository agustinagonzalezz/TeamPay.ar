import { Badge } from "@/components/ui/badge"
import type { SubscriptionStatus, Plan } from "@/generated/prisma/client"

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; className: string }> = {
  TRIALING: { label: "En trial", className: "border-border bg-muted text-muted-foreground" },
  ACTIVE: { label: "Activo", className: "border-transparent bg-primary text-primary-foreground" },
  PAST_DUE: {
    label: "Pago vencido",
    className:
      "border-amber-300/60 bg-amber-100 text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-400",
  },
  SUSPENDED: { label: "Suspendido", className: "border-transparent bg-destructive/10 text-destructive" },
  CANCELED: { label: "Cancelado", className: "border-border bg-muted text-muted-foreground" },
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus | null }) {
  if (!status) {
    return (
      <Badge variant="outline" className="border-dashed text-muted-foreground">
        Sin configurar
      </Badge>
    )
  }

  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}

const PLAN_LABELS: Record<Plan, string> = {
  TRIAL: "Trial",
  BASIC: "Basic",
  PRO: "Pro",
}

export function PlanBadge({ plan }: { plan: Plan | null }) {
  if (!plan) return <span className="text-xs text-muted-foreground">—</span>
  return <Badge variant="secondary">{PLAN_LABELS[plan]}</Badge>
}
