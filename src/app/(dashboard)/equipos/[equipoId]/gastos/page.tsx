/**
 * app/(dashboard)/equipos/[equipoId]/gastos/page.tsx
 *
 * Lista de gastos del equipo con formulario de carga para la capitana.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Receipt } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getGastosByTeam } from "@/services/gastoService"
import { getTeamById } from "@/services/teamService"
import { requireTeamWriteAccess } from "@/lib/auth/team-access"
import { GastoForm } from "@/components/gastos/GastoForm"
import { DeleteGastoButton } from "@/components/gastos/DeleteGastoButton"
import { EditGastoButton } from "@/components/gastos/EditGastoButton"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { formatCurrency, formatDateShort, cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Gastos — TeamPayment.app" }

// ── Página ────────────────────────────────────────────────────────────────────

export default async function GastosPage({
  params,
}: {
  params: Promise<{ equipoId: string }>
}) {
  const { equipoId } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [teamResult, gastosResult, writeAccess] = await Promise.all([
    getTeamById(equipoId, user.id),
    getGastosByTeam(equipoId, user.id),
    requireTeamWriteAccess(equipoId),
  ])

  if (!teamResult.success) notFound()

  const equipo = teamResult.data
  const esCapitana = equipo.ownerId === user.id
  const gastos = gastosResult.success ? gastosResult.data : []
  // RF-56: en modo solo-lectura no se muestran los controles de crear/editar/eliminar
  const puedeEscribir = writeAccess.authorized

  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.amount), 0)

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

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gastos del equipo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {equipo.name} · Egresos operativos (cancha, entrenador, etc.)
            </p>
          </div>
          {gastos.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total gastado</p>
              <p className="text-lg font-bold">{formatCurrency(totalGastos)}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Formulario (solo capitana) ─────────────────────────────────── */}
      {esCapitana && puedeEscribir && (
        <section aria-labelledby="nuevo-gasto-heading">
          <h2 id="nuevo-gasto-heading" className="mb-4 text-lg font-semibold">
            Registrar gasto
          </h2>
          <Card size="sm">
            <CardContent className="pt-4">
              <GastoForm equipoId={equipoId} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Lista de gastos ────────────────────────────────────────────── */}
      <section aria-labelledby="lista-gastos-heading">
        <h2 id="lista-gastos-heading" className="mb-4 text-lg font-semibold">
          Historial
        </h2>

        {gastos.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <Receipt
              className="mx-auto mb-3 size-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-muted-foreground">
              Todavía no hay gastos registrados.
            </p>
            {esCapitana && puedeEscribir && (
              <p className="mt-1 text-xs text-muted-foreground">
                Usá el formulario de arriba para agregar el primero.
              </p>
            )}
          </div>
        ) : (
          <Card size="sm">
            <ul role="list" className="divide-y">
              {gastos.map((gasto) => (
                <li
                  key={gasto.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Ícono */}
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"
                    aria-hidden="true"
                  >
                    <Receipt className="size-4 text-muted-foreground" />
                  </div>

                  {/* Descripción */}
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {gasto.concept}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {gasto.paidTo} · {formatDateShort(gasto.paidAt)}
                    </span>
                  </div>

                  {/* Monto + acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(Number(gasto.amount))}
                    </span>
                    {esCapitana && puedeEscribir && (
                      <>
                        <EditGastoButton
                          equipoId={equipoId}
                          gastoId={gasto.id}
                          concepto={gasto.concept}
                          monto={Number(gasto.amount)}
                          paidTo={gasto.paidTo}
                          paidAt={gasto.paidAt.toISOString().split("T")[0]}
                        />
                        <DeleteGastoButton
                          gastoId={gasto.id}
                          equipoId={equipoId}
                          concepto={gasto.concept}
                        />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Total al pie */}
            {gastos.length > 1 && (
              <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-sm font-bold tabular-nums">
                  {formatCurrency(totalGastos)}
                </span>
              </div>
            )}
          </Card>
        )}
      </section>

    </div>
  )
}
