import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Plus, TrendingUp, Settings } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getTeamDetails } from "@/services/teamService"
import { getEventosByTeam, checkIsCapitana } from "@/services/eventoService"
import { getGastosByTeam } from "@/services/gastoService"
import { EventoCard } from "@/components/eventos/EventoCard"
import { buttonVariants } from "@/components/ui/button"
import { formatCurrency, cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ equipoId: string }>
}): Promise<Metadata> {
  return { title: "Equipo — TeamPay.ar" }
}

// ── Colores de avatar — paleta violeta / complementaria ───────────────────────

const AVATAR_COLORS = [
  "bg-violet-500/15 text-violet-300",
  "bg-purple-500/15 text-purple-300",
  "bg-fuchsia-500/15 text-fuchsia-300",
  "bg-indigo-500/15 text-indigo-300",
  "bg-blue-500/15 text-blue-300",
  "bg-cyan-500/15 text-cyan-300",
  "bg-teal-500/15 text-teal-300",
  "bg-pink-500/15 text-pink-300",
  "bg-rose-500/15 text-rose-300",
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>
}) {
  const { equipoId } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [teamResult, eventosResult, gastosResult, esCapitana] = await Promise.all([
    getTeamDetails(equipoId, user.id),
    getEventosByTeam(equipoId, user.id),
    getGastosByTeam(equipoId, user.id),
    checkIsCapitana(equipoId, user.id),
  ])

  if (!teamResult.success) notFound()

  const equipo = teamResult.data
  const eventos = eventosResult.success ? eventosResult.data : []
  const gastos = gastosResult.success ? gastosResult.data : []
  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.amount), 0)

  const AVATARS_VISIBLE = 9

  return (
    <div className="flex flex-col gap-10">

      {/* ── Navegación ────────────────────────────────────────────────── */}
      <Link
        href="/equipos"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 -mb-4")}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Mis equipos
      </Link>

      {/* ── HERO — nombre del equipo ───────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-8 sm:px-10 sm:py-10"
        style={{ background: "oklch(0.52 0.22 285)" }}
      >
        {/* Inicial decorativa de fondo */}
        <span
          className="pointer-events-none absolute -right-3 -top-4 select-none leading-none tracking-tighter text-[11rem] font-black sm:text-[14rem]"
          style={{
            fontFamily: "var(--font-barlow)",
            color: "oklch(0.99 0 0 / 0.08)",
          }}
          aria-hidden="true"
        >
          {equipo.name.charAt(0).toUpperCase()}
        </span>

        {/* Franja de acento — violeta más claro */}
        <div
          className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl"
          style={{ background: "linear-gradient(to bottom, oklch(0.82 0.1 285), oklch(0.72 0.16 285))" }}
        />

        {/* Contenido */}
        <div className="relative flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h1
              className="text-5xl font-black leading-none tracking-tight sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-barlow)", color: "oklch(0.99 0 0)" }}
            >
              {equipo.name.toUpperCase()}
            </h1>
            {esCapitana && (
              <Link
                href={`/equipos/${equipoId}/editar`}
                className="shrink-0 rounded-lg p-2 transition-colors hover:bg-white/10"
                title="Editar equipo"
                aria-label="Editar equipo"
              >
                <Settings className="size-5" style={{ color: "oklch(0.99 0 0 / 0.6)" }} aria-hidden="true" />
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {equipo.description && (
              <p className="text-sm" style={{ color: "oklch(0.99 0 0 / 0.65)" }}>
                {equipo.description}
              </p>
            )}
            {esCapitana && (
              <span
                className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                style={{
                  borderColor: "oklch(0.99 0 0 / 0.3)",
                  background: "oklch(0.99 0 0 / 0.12)",
                  color: "oklch(0.99 0 0 / 0.9)",
                }}
              >
                Capitana
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── STATS — scoreboard ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border">

        <div className="flex flex-col gap-0.5 px-4 py-4 sm:px-6">
          <span className="text-2xl font-bold tabular-nums sm:text-3xl">
            {equipo._count.members}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Jugadoras
          </span>
        </div>

        <div className="flex flex-col gap-0.5 px-4 py-4 sm:px-6">
          <span className="text-2xl font-bold tabular-nums sm:text-3xl">
            {equipo._count.events}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Eventos
          </span>
        </div>

        {esCapitana ? (
          <Link
            href={`/equipos/${equipoId}/balance`}
            className="group flex flex-col gap-0.5 px-4 py-4 transition-colors hover:bg-accent/40 sm:px-6"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="text-2xl font-bold tabular-nums sm:text-3xl"
                style={{ color: "oklch(0.52 0.22 285)" }}
              >
                {totalGastos > 0 ? formatCurrency(totalGastos) : "—"}
              </span>
              <TrendingUp
                className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: "oklch(0.52 0.22 285)" }}
                aria-hidden="true"
              />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Gastos · ver balance ↗
            </span>
          </Link>
        ) : (
          <div className="flex flex-col gap-0.5 px-4 py-4 sm:px-6">
            <span
              className="text-2xl font-bold tabular-nums sm:text-3xl"
              style={{ color: "oklch(0.52 0.22 285)" }}
            >
              {totalGastos > 0 ? formatCurrency(totalGastos) : "—"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Gastos
            </span>
          </div>
        )}

      </div>

      {/* ── JUGADORAS — avatares compactos ────────────────────────────── */}
      <section aria-labelledby="jugadoras-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="jugadoras-heading" className="text-base font-semibold tracking-tight">
            Jugadoras
          </h2>
          {esCapitana && (
            <Link
              href={`/equipos/${equipoId}/jugadoras`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Plus className="size-4" aria-hidden="true" />
              Gestionar
            </Link>
          )}
        </div>

        {equipo.members.length === 0 ? (
          <EmptyState mensaje="Todavía no hay jugadoras en este equipo." />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {equipo.members.slice(0, AVATARS_VISIBLE).map((member) => {
              const esLaCapitana = member.userId === equipo.ownerId
              return (
                <div key={member.id} className="group relative" title={member.name}>
                  <div
                    className={cn(
                      "flex size-11 shrink-0 cursor-default items-center justify-center rounded-full text-xs font-bold transition-transform hover:scale-110",
                      avatarColor(member.name)
                    )}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  {(esLaCapitana || member.isCoCapitana) && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[8px] ring-2 ring-background"
                      style={{ background: "oklch(0.52 0.22 285)", color: "oklch(0.99 0 0)" }}
                      aria-label={esLaCapitana ? "Capitana" : "Co-capitana"}
                    >
                      ★
                    </span>
                  )}
                </div>
              )
            })}
            {equipo.members.length > AVATARS_VISIBLE && (
              <Link
                href={`/equipos/${equipoId}/jugadoras`}
                className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                +{equipo.members.length - AVATARS_VISIBLE}
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── EVENTOS ───────────────────────────────────────────────────── */}
      <section aria-labelledby="eventos-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="eventos-heading" className="text-base font-semibold tracking-tight">
            Eventos
          </h2>
          {esCapitana && (
            <Link
              href={`/equipos/${equipoId}/eventos/nuevo`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuevo evento
            </Link>
          )}
        </div>

        {eventos.length === 0 ? (
          <EmptyState mensaje="Todavía no hay eventos. Creá el primero para empezar a registrar pagos." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {eventos.slice(0, 6).map((evento) => (
                <EventoCard key={evento.id} evento={evento} equipoId={equipoId} />
              ))}
            </div>
            {eventos.length > 6 && (
              <Link
                href={`/equipos/${equipoId}/eventos`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-3")}
              >
                Ver todos los eventos ({eventos.length})
              </Link>
            )}
          </>
        )}
      </section>

      {/* ── GASTOS ────────────────────────────────────────────────────── */}
      <section aria-labelledby="gastos-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="gastos-heading" className="text-base font-semibold tracking-tight">
            Gastos
          </h2>
          <Link
            href={`/equipos/${equipoId}/gastos`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {esCapitana ? (
              <><Plus className="size-4" aria-hidden="true" />Agregar</>
            ) : (
              "Ver gastos"
            )}
          </Link>
        </div>

        {gastos.length === 0 ? (
          <EmptyState mensaje="Todavía no hay gastos registrados." />
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {gastos.slice(0, 5).map((gasto, i) => (
                <li
                  key={gasto.id}
                  className={cn(
                    "flex items-center justify-between gap-4 px-4 py-3",
                    i === 0 && "rounded-t-xl",
                    i === Math.min(gastos.length, 5) - 1 && "rounded-b-xl"
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{gasto.concept}</span>
                    <span className="text-xs text-muted-foreground">{gasto.paidTo}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                    {formatCurrency(Number(gasto.amount))}
                  </span>
                </li>
              ))}
            </ul>
            {gastos.length > 5 && (
              <Link
                href={`/equipos/${equipoId}/gastos`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-2")}
              >
                Ver todos los gastos ({gastos.length})
              </Link>
            )}
          </>
        )}
      </section>

    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-10 text-center">
      <p className="text-sm text-muted-foreground">{mensaje}</p>
    </div>
  )
}
