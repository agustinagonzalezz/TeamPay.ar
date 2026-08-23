/**
 * src/components/admin/AdminMetricsCards.tsx — Fila de métricas del panel
 * de super admin (RF-59): total de equipos, desglose por estado de
 * suscripción y MRR estimado.
 */

import { Building2, LayoutGrid, CircleDollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { AdminMetrics, AdminStatusFilter } from "@/services/superAdminService"

const STATUS_LABELS: Record<AdminStatusFilter, string> = {
  TRIALING: "En trial",
  ACTIVE: "Activo",
  PAST_DUE: "Pago vencido",
  SUSPENDED: "Suspendido",
  CANCELED: "Cancelado",
  SIN_CONFIGURAR: "Sin configurar",
}

const STATUS_ORDER: AdminStatusFilter[] = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "SUSPENDED",
  "CANCELED",
  "SIN_CONFIGURAR",
]

export function AdminMetricsCards({ metrics }: { metrics: AdminMetrics }) {
  const { totalTeams, byStatus, mrrArs, activeTeamsMissingPrice } = metrics

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {/* Total de equipos */}
      <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Building2 className="size-3.5 text-primary" aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground">Equipos registrados</span>
        </div>
        <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{totalTeams}</p>
      </div>

      {/* Desglose por estado */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="size-3.5 text-primary" aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground">Por estado de suscripción</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex items-center justify-between gap-2">
              <dt className="text-[11px] text-muted-foreground">{STATUS_LABELS[status]}</dt>
              <dd className="text-xs font-semibold tabular-nums text-foreground">{byStatus[status]}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* MRR estimado */}
      <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-1.5">
          <CircleDollarSign className="size-3.5 text-primary" aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground">MRR estimado</span>
        </div>
        <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{formatCurrency(mrrArs)}</p>
        <p className="text-[11px] text-muted-foreground">
          Suma de precios de equipos activos con precio cargado.
          {activeTeamsMissingPrice > 0 && (
            <>
              {" "}
              {activeTeamsMissingPrice} {activeTeamsMissingPrice === 1 ? "equipo activo no tiene" : "equipos activos no tienen"} precio cargado, no {activeTeamsMissingPrice === 1 ? "está incluido" : "están incluidos"}.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
