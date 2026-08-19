import { PartyPopper } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { DeudorasData } from "@/services/notificacionService"

interface RankingDeudorasProps {
  data: DeudorasData
}

export function RankingDeudoras({ data }: RankingDeudorasProps) {
  const { deudoras, totalPendiente } = data

  if (deudoras.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-10 text-center">
        <PartyPopper
          className="mx-auto mb-3 size-8 text-green-500"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-foreground">
          Todas las jugadoras están al día 🎉
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          No hay deudas pendientes en este equipo.
        </p>
      </div>
    )
  }

  return (
    <Card size="sm">
      <ul role="list" className="divide-y">
        {deudoras.map((deudora, index) => (
          <li
            key={deudora.name}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <span className="flex-1 truncate text-sm font-medium">
              {deudora.name}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-500">
              {formatCurrency(deudora.deuda)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t px-4 py-2.5">
        <span className="text-xs text-muted-foreground">
          {deudoras.length === 1
            ? "1 jugadora con deuda"
            : `${deudoras.length} jugadoras con deuda`}
        </span>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {formatCurrency(totalPendiente)} total
        </span>
      </div>
    </Card>
  )
}
