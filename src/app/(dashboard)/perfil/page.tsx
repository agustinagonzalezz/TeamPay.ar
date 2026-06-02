/**
 * app/(dashboard)/perfil/page.tsx — Vista personal de la jugadora
 *
 * Muestra:
 *   • Info del usuario (nombre, email, foto)
 *   • Deudas pendientes en todos los equipos (si hay)
 *   • Historial de pagos y exenciones
 *   • Botón de cerrar sesión
 */

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  CheckCircle2,
  Clock,
  MinusCircle,
  LogOut,
  PartyPopper,
  Calendar,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getMySituacion } from "@/services/perfilService"
import { SignOutButton } from "@/components/shared/SignOutButton"
import { EditNombreButton } from "@/components/shared/EditNombreButton"
import { DeleteAccountButton } from "@/components/shared/DeleteAccountButton"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { EVENT_TYPE_LABELS } from "@/lib/validations/evento"
import type { MiParticipacion } from "@/services/perfilService"

export const metadata: Metadata = { title: "Mi perfil — TeamPay.ar" }

// ── Página ────────────────────────────────────────────────────────────────────

export default async function PerfilPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const result = await getMySituacion(user.id)
  const situacion = result.success
    ? result.data
    : { totalPendiente: 0, totalPagado: 0, pendientes: [], historial: [] }

  const { totalPendiente, totalPagado, pendientes, historial } = situacion
  const estoyAlDia = pendientes.length === 0

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header de perfil ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? "Avatar"}
              className="size-14 rounded-full object-cover ring-2 ring-border"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                {user.name ?? "Sin nombre"}
              </h1>
              <EditNombreButton nombreActual={user.name ?? ""} />
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <SignOutButton />
      </div>

      {/* ── Resumen financiero ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className={cn(
            "rounded-xl border px-4 py-3",
            estoyAlDia
              ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10"
              : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-900/10"
          )}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pendiente de pago
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold",
              estoyAlDia
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-500"
            )}
          >
            {estoyAlDia ? "¡Al día! 🎉" : formatCurrency(totalPendiente)}
          </p>
          {!estoyAlDia && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              en {pendientes.length} evento{pendientes.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total pagado
          </p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalPagado)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            en {historial.filter((h) => h.status === "PAGO").length} evento
            {historial.filter((h) => h.status === "PAGO").length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Deudas pendientes ─────────────────────────────────────────── */}
      <section aria-labelledby="pendientes-heading">
        <h2 id="pendientes-heading" className="mb-4 text-lg font-semibold">
          Pendiente de pago
        </h2>

        {estoyAlDia ? (
          <div className="rounded-xl border border-dashed py-10 text-center">
            <PartyPopper
              className="mx-auto mb-3 size-8 text-green-500"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground">
              ¡Estás al día en todos tus equipos!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No tenés pagos pendientes por ahora.
            </p>
          </div>
        ) : (
          <Card size="sm">
            <ul role="list" className="divide-y">
              {pendientes.map((p) => (
                <ParticipacionRow
                  key={p.participanteId}
                  participacion={p}
                  equipoId={p.equipoId}
                />
              ))}
            </ul>
          </Card>
        )}
      </section>

      {/* ── Historial ─────────────────────────────────────────────────── */}
      {historial.length > 0 && (
        <section aria-labelledby="historial-heading">
          <h2 id="historial-heading" className="mb-4 text-lg font-semibold">
            Historial
          </h2>
          <Card size="sm">
            <ul role="list" className="divide-y">
              {historial.map((p) => (
                <ParticipacionRow
                  key={p.participanteId}
                  participacion={p}
                  equipoId={p.equipoId}
                />
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Estado vacío total */}
      {pendientes.length === 0 && historial.length === 0 && (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <Calendar
            className="mx-auto mb-3 size-8 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-muted-foreground">
            Todavía no participás en ningún evento.
          </p>
          <Link
            href="/equipos"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
          >
            Ver mis equipos
          </Link>
        </div>
      )}

      {/* ── Zona de peligro ────────────────────────────────────────────────── */}
      <div className="max-w-2xl rounded-xl border border-destructive/30 p-6">
        <h2 className="text-sm font-semibold text-destructive">Zona peligrosa</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Eliminar tu cuenta es una acción irreversible. Se borrarán todos tus equipos, eventos, pagos y gastos.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </div>

    </div>
  )
}

// ── Fila de participación ─────────────────────────────────────────────────────

function ParticipacionRow({
  participacion: p,
  equipoId,
}: {
  participacion: MiParticipacion
  equipoId: string
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {/* Ícono de estado */}
      {p.status === "PAGO" && (
        <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-label="Pagó" />
      )}
      {p.status === "PENDIENTE" && (
        <Clock className="size-5 shrink-0 text-amber-500" aria-label="Pendiente" />
      )}
      {p.status === "EXIMIDA" && (
        <MinusCircle className="size-5 shrink-0 text-muted-foreground" aria-label="Eximida" />
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/equipos/${equipoId}/eventos/${p.eventoId}`}
            className="truncate text-sm font-medium hover:text-primary hover:underline transition-colors"
          >
            {p.eventoNombre}
          </Link>
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {EVENT_TYPE_LABELS[p.eventoTipo]}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {p.equipoNombre}
          {p.status === "PAGO" && p.paidAt
            ? ` · Pagado el ${formatDate(p.paidAt)}`
            : ` · Vence ${formatDate(p.dueDate)}`}
        </span>
      </div>

      {/* Monto */}
      <div className="shrink-0 text-right">
        {p.status === "PAGO" && (
          <span className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums">
            {formatCurrency(p.paidAmount ?? p.amountPerPlayer)}
          </span>
        )}
        {p.status === "PENDIENTE" && (
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-500 tabular-nums">
            {formatCurrency(p.amountPerPlayer)}
          </span>
        )}
        {p.status === "EXIMIDA" && (
          <span className="text-xs text-muted-foreground">Eximida</span>
        )}
      </div>
    </li>
  )
}
