import Link from "next/link"
import { ChevronRight, Users } from "lucide-react"
import type { TeamWithMemberCount } from "@/services/teamService"

interface EquipoCardProps {
  equipo: TeamWithMemberCount
}

export function EquipoCard({ equipo }: EquipoCardProps) {
  const memberCount = equipo._count.members
  const initial = equipo.name.charAt(0).toUpperCase()

  return (
    <Link
      href={`/equipos/${equipo.id}`}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-xl"
    >
      <div className="flex h-full flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 focus-visible:border-primary/40">

        {/* Icono + flecha */}
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
            style={{
              background: "oklch(0.63 0.22 285 / 0.12)",
              color: "oklch(0.63 0.22 285)",
            }}
            aria-hidden="true"
          >
            {initial}
          </div>
          <ChevronRight
            className="mt-0.5 size-4 shrink-0 text-muted-foreground/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>

        {/* Nombre + descripción */}
        <div className="mt-4">
          <p className="font-semibold tracking-tight text-foreground">
            {equipo.name}
          </p>
          {equipo.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {equipo.description}
            </p>
          )}
        </div>

        {/* Jugadoras */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {memberCount === 1
              ? "1 jugadora activa"
              : `${memberCount} jugadoras activas`}
          </span>
        </div>

      </div>
    </Link>
  )
}
