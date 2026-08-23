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
  AlertCircle,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getTeamBalance } from "@/services/balanceService"
import { getTeamById } from "@/services/teamService"
import { checkIsCapitana } from "@/services/eventoService"
import { getDeudorasParaWhatsApp } from "@/services/notificacionService"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { WhatsAppMensaje } from "@/components/notificaciones/WhatsAppMensaje"
import { RankingDeudoras } from "@/components/balance/RankingDeudoras"
import { PeriodoFilter } from "@/components/balance/PeriodoFilter"
import { ExportarExcelButton } from "@/components/balance/ExportarExcelButton"
import { formatCurrency, formatDateShort, cn } from "@/lib/utils"
import { EVENT_TYPE_LABELS } from "@/lib/validations/evento"
import type { EventType } from "@/generated/prisma/client"
import type { FiltroFecha } from "@/services/balanceService"

// ── Helpers de período ────────────────────────────────────────────────────────

type PeriodoId = "todos" | "mes" | "trimestre" | "anio" | "custom"

const PERIODO_LABELS: Record<PeriodoId, string> = {
  todos:     "Todos los tiempos",
  mes:       "Este mes",
  trimestre: "Último trimestre",
  anio:      "Este año",
  custom:    "Período personalizado",
}

function getPeriodoFiltro(
  periodo: PeriodoId,
  desde?: string,
  hasta?: string
): FiltroFecha {
  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999)

  if (periodo === "mes") {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    return { desde: inicio, hasta: hoy }
  }
  if (periodo === "trimestre") {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1)
    return { desde: inicio, hasta: hoy }
  }
  if (periodo === "anio") {
    const inicio = new Date(hoy.getFullYear(), 0, 1)
    return { desde: inicio, hasta: hoy }
  }
  if (periodo === "custom" && desde && hasta) {
    return {
      desde: new Date(desde + "T00:00:00"),
      hasta: new Date(hasta + "T23:59:59"),
    }
  }
  return {} // todos — sin filtro
}

export const metadata: Metadata = { title: "Balance — TeamPayment.app" }

// ── Colores por tipo de evento ────────────────────────────────────────────────

const TYPE_BADGE: Record<EventType, string> = {
  CUOTA:    "border border-primary/30 bg-primary/8 text-primary",
  AMISTOSO: "border border-border bg-muted text-muted-foreground",
  TORNEO:   "border border-primary/50 bg-primary/15 text-primary",
  OTRO:     "border border-border bg-muted text-muted-foreground",
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function BalancePage({
  params,
  searchParams,
}: {
  params: Promise<{ equipoId: string }>
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>
}) {
  const { equipoId } = await params
  const { periodo: rawPeriodo, desde, hasta } = await searchParams

  const periodo = (["todos", "mes", "trimestre", "anio", "custom"].includes(rawPeriodo ?? "")
    ? rawPeriodo
    : "todos") as PeriodoId

  const filtro = getPeriodoFiltro(periodo, desde, hasta)

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const isCapitana = await checkIsCapitana(equipoId, user.id)
  if (!isCapitana) redirect(`/equipos/${equipoId}`)

  const [teamResult, balanceResult, deudorasResult] = await Promise.all([
    getTeamById(equipoId, user.id),
    getTeamBalance(equipoId, user.id, filtro),
    getDeudorasParaWhatsApp(equipoId, user.id),
  ])

  if (!teamResult.success) notFound()
  if (!balanceResult.success) notFound()

  const equipo = teamResult.data
  const { totalCobrado, totalGastado, balance, cobradoEfectivo, cobradoTransferencia, eventos, gastos } =
    balanceResult.data

  const balancePositivo = balance >= 0
  const gastosRecientes = gastos.slice(0, 5)
  const deudorasData = deudorasResult.success ? deudorasResult.data : null

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
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Balance</h1>
            <p className="mt-1 text-sm text-muted-foreground">{equipo.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {periodo !== "todos" && (
              <span className="shrink-0 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
                {PERIODO_LABELS[periodo]}
              </span>
            )}
            <ExportarExcelButton equipoId={equipoId} desde={desde} hasta={hasta} />
          </div>
        </div>

        {/* Filtro de período */}
        <div className="mt-4">
          <PeriodoFilter
            periodoActivo={periodo}
            desdeActivo={desde}
            hastaActivo={hasta}
          />
        </div>
      </div>

      {/* ── Resumen financiero ─────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">

        {/* Cobrado */}
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-primary" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground">Total cobrado</span>
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(totalCobrado)}
          </p>
          {(cobradoEfectivo > 0 || cobradoTransferencia > 0) ? (
            <div className="flex flex-col gap-0.5">
              {cobradoEfectivo > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Efectivo: <span className="font-medium text-foreground">{formatCurrency(cobradoEfectivo)}</span>
                </p>
              )}
              {cobradoTransferencia > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Transferencia: <span className="font-medium text-foreground">{formatCurrency(cobradoTransferencia)}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">de pagos de jugadoras</p>
          )}
        </div>

        {/* Gastado */}
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="size-3.5 text-destructive/70" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground">Total gastado</span>
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(totalGastado)}
          </p>
          <p className="text-[11px] text-muted-foreground">en gastos del equipo</p>
        </div>

        {/* Balance neto */}
        <div
          className="flex flex-col gap-1 rounded-xl border px-5 py-4"
          style={{
            borderColor: balancePositivo ? "color-mix(in oklch, var(--primary) 30%, transparent)" : "oklch(0.65 0.19 22 / 0.3)",
            background: balancePositivo ? "color-mix(in oklch, var(--primary) 6%, transparent)" : "oklch(0.65 0.19 22 / 0.06)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <Wallet
              className="size-3.5"
              style={{ color: balancePositivo ? "var(--primary)" : "oklch(0.65 0.19 22)" }}
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-muted-foreground">Balance neto</span>
          </div>
          <p
            className="mt-1 text-xl font-bold tabular-nums"
            style={{ color: balancePositivo ? "var(--primary)" : "oklch(0.72 0.16 22)" }}
          >
            {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
          </p>
          <p className="text-[11px] text-muted-foreground">cobrado − gastado</p>
        </div>

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

      {/* ── Ranking de deudoras ────────────────────────────────────────── */}
      {deudorasData && (
        <section aria-labelledby="ranking-deudoras-heading">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-500" aria-hidden="true" />
            <h2 id="ranking-deudoras-heading" className="text-lg font-semibold">
              Jugadoras con deuda pendiente
            </h2>
          </div>
          <RankingDeudoras data={deudorasData} />
        </section>
      )}

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

      {/* ── NOTIFICAR DEUDORAS — mensaje pre-armado para WhatsApp ─────── */}
      {deudorasData && (
        <section aria-labelledby="whatsapp-heading">
          <div className="mb-4">
            <h2 id="whatsapp-heading" className="text-lg font-semibold">
              Notificar deudoras
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Mensaje listo para copiar y pegar en WhatsApp.
            </p>
          </div>
          <WhatsAppMensaje data={deudorasData} />
        </section>
      )}

    </div>
  )
}
