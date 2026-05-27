/**
 * app/(dashboard)/equipos/[equipoId]/balance/page.tsx
 *
 * Dashboard financiero del equipo.
 *
 * Muestra:
 *   • Resumen: total cobrado, total gastado, balance neto
 *   • Desglose por evento: cobrado vs. esperado con barra de progreso
 *   • Resumen de gastos con link al historial completo
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  Receipt,
  ChevronRight,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getTeamBalance } from "@/services/balanceService"
import { getTeamById } from "@/services/teamService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { formatCurrency, formatDateShort, cn } from "@/lib/utils"
import { EVENT_TYPE_LABELS } from "@/lib/validations/evento"
import type { EventType } from "@/generated/prisma/client"

export const metadata: Metadata = { title: "Balance — TeamPay.ar" }

// ── Colores por tipo de evento ────────────────────────────────────────────────

const TYPE_BADGE: Record<EventType, string> = {
  CUOTA:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  AMISTOSO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  TORNEO:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  OTRO:     "bg-muted text-muted-foreground",
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function BalancePage({
  params,
}: {
  params: Promise<{ equipoId: string }>
}) {
  const { equipoId } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [teamResult, balanceResult] = await Promise.all([
    getTeamById(equipoId, user.id),
    getTeamBalance(equipoId, user.id),
  ])

  if (!teamResult.success) notFound()
  if (!balanceResult.success) notFound()

  const equipo = teamResult.data
  const { totalCobrado, totalGastado, balance, eventos, gastos } =
    balanceResult.data

  const balancePositivo = balance >= 0
  const gastosRecientes = gastos.slice(0, 5)

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <Link
          href={`/equipos/${equipoId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-3")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al equipo
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Balance</h1>
        <p className="mt-1 text-sm text-muted-foreground">{equipo.name}</p>
      </div>

      {/* ── Resumen financiero ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">

        {/* Cobrado */}
        <Card size="sm">
          <CardHeader className="flex-row items-center gap-2 pb-1">
            <TrendingUp className="size-4 text-green-500" aria-hidden="true" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total cobrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalCobrado)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              de pagos de jugadoras
            </p>
          </CardContent>
        </Card>

        {/* Gastado */}
        <Card size="sm">
          <CardHeader className="flex-row items-center gap-2 pb-1">
            <TrendingDown className="size-4 text-red-500" aria-hidden="true" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total gastado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalGastado)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              en gastos del equipo
            </p>
          </CardContent>
        </Card>

        {/* Balance neto */}
        <Card
          size="sm"
          className={cn(
            balancePositivo
              ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10"
              : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10"
          )}
        >
          <CardHeader className="flex-row items-center gap-2 pb-1">
            <Wallet
              className={cn(
                "size-4",
                balancePositivo ? "text-green-500" : "text-red-500"
              )}
              aria-hidden="true"
            />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance neto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-xl font-bold",
                balancePositivo
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {balance >= 0 ? "+" : ""}
              {formatCurrency(balance)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              cobrado − gastado
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ── Desglose por evento ────────────────────────────────────────── */}
      <section aria-labelledby="eventos-balance-heading">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="eventos-balance-heading" className="text-lg font-semibold">
            Por evento
          </h2>
          <Link
            href={`/equipos/${equipoId}/eventos/nuevo`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Nuevo evento
          </Link>
        </div>

        {eventos.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center">
            <Calendar
              className="mx-auto mb-3 size-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Todavía no hay eventos en este equipo.
            </p>
          </div>
        ) : (
          <Card size="sm">
            <ul role="list" className="divide-y">
              {eventos.map((ev) => {
                const pendiente = Math.max(ev.totalEsperado - ev.totalCobrado, 0)
                return (
                  <li key={ev.id}>
                    <Link
                      href={`/equipos/${equipoId}/eventos/${ev.id}`}
                      className="group flex flex-col gap-2 px-4 py-3 hover:bg-muted/40 transition-colors"
                    >
                      {/* Fila superior: nombre + tipo + monto cobrado */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                            {ev.name}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                              TYPE_BADGE[ev.type]
                            )}
                          >
                            {EVENT_TYPE_LABELS[ev.type]}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                            {formatCurrency(ev.totalCobrado)}
                          </span>
                          {pendiente > 0 && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              / {formatCurrency(ev.totalEsperado)}
                            </span>
                          )}
                          <ChevronRight className="size-3.5 text-muted-foreground/50" />
                        </div>
                      </div>

                      {/* Fila inferior: progreso + fecha */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                ev.progreso === 100
                                  ? "bg-green-500"
                                  : "bg-primary"
                              )}
                              style={{ width: `${ev.progreso}%` }}
                              role="progressbar"
                              aria-valuenow={ev.progreso}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {ev.pagaron}/{ev.obligadas} pagaron · {ev.progreso}%
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateShort(ev.dueDate)}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </section>

      {/* ── Gastos recientes ───────────────────────────────────────────── */}
      <section aria-labelledby="gastos-balance-heading">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="gastos-balance-heading" className="text-lg font-semibold">
            Gastos recientes
          </h2>
          <Link
            href={`/equipos/${equipoId}/gastos`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Ver todos
          </Link>
        </div>

        {gastos.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center">
            <Receipt
              className="mx-auto mb-3 size-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Todavía no hay gastos registrados.
            </p>
          </div>
        ) : (
          <Card size="sm">
            <ul role="list" className="divide-y">
              {gastosRecientes.map((gasto) => (
                <li
                  key={gasto.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {gasto.concept}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {gasto.paidTo} · {formatDateShort(gasto.paidAt)}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                    −{formatCurrency(Number(gasto.amount))}
                  </span>
                </li>
              ))}
            </ul>
            {gastos.length > 5 && (
              <div className="border-t px-4 py-2.5">
                <Link
                  href={`/equipos/${equipoId}/gastos`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-center"
                  )}
                >
                  Ver {gastos.length - 5} gastos más
                </Link>
              </div>
            )}
          </Card>
        )}
      </section>

    </div>
  )
}
