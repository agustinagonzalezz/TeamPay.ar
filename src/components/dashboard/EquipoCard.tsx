/**
 * src/components/dashboard/EquipoCard.tsx — Tarjeta de equipo
 *
 * Componente de presentación reutilizable para mostrar un equipo en el listado.
 * Recibe los datos del equipo y un link para navegar al detalle.
 *
 * Server Component (sin estado cliente).
 */

import Link from "next/link"
import { Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TeamWithMemberCount } from "@/services/teamService"

// ── Props ─────────────────────────────────────────────────────────────────────

interface EquipoCardProps {
  equipo: TeamWithMemberCount
}

// ── Componente ────────────────────────────────────────────────────────────────

export function EquipoCard({ equipo }: EquipoCardProps) {
  const memberCount = equipo._count.members

  return (
    <Link
      href={`/equipos/${equipo.id}`}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-xl"
    >
      <Card
        size="sm"
        className="h-full transition-shadow group-hover:shadow-md group-focus-visible:shadow-md"
      >
        <CardHeader>
          <CardTitle className="line-clamp-1 text-base">{equipo.name}</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {equipo.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {equipo.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4 shrink-0" aria-hidden="true" />
            <span>
              {memberCount === 1
                ? "1 jugadora activa"
                : `${memberCount} jugadoras activas`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
