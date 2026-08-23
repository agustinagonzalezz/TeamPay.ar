/**
 * src/app/admin/page.tsx — Listado de equipos del panel de super administración.
 * RF-52 (listado), RF-53/54 (contacto/facturación visibles), RF-60 (buscar/filtrar).
 *
 * Protegida por src/app/admin/layout.tsx (requireSuperAdmin).
 */

import type { Metadata } from "next"
import Link from "next/link"
import { Building2 } from "lucide-react"
import {
  getTeamsForAdmin,
  type AdminStatusFilter,
} from "@/services/superAdminService"
import { AdminEquiposFilters } from "@/components/admin/AdminEquiposFilters"
import { SubscriptionStatusBadge, PlanBadge } from "@/components/admin/SubscriptionBadges"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { formatDateShort } from "@/lib/utils"

export const metadata: Metadata = { title: "Super admin — Equipos" }

const STATUS_VALUES: AdminStatusFilter[] = [
  "SIN_CONFIGURAR",
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "SUSPENDED",
  "CANCELED",
]

export default async function AdminEquiposPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status: rawStatus } = await searchParams
  const status = (STATUS_VALUES as string[]).includes(rawStatus ?? "")
    ? (rawStatus as AdminStatusFilter)
    : undefined

  const result = await getTeamsForAdmin({ search: q, status })
  const equipos = result.success ? result.data : []

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Equipos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {equipos.length} {equipos.length === 1 ? "equipo registrado" : "equipos registrados"}
        </p>
      </div>

      <AdminEquiposFilters qActual={q ?? ""} statusActual={status ?? "TODOS"} />

      {!result.success ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {result.error}
        </div>
      ) : equipos.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <Building2 className="mx-auto mb-3 size-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No hay equipos que coincidan con esos filtros.
          </p>
        </div>
      ) : (
        <Card size="sm" className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipos.map((equipo) => {
                const contactName = equipo.subscription?.contactName ?? equipo.owner.name ?? "—"
                const contactEmail = equipo.subscription?.contactEmail ?? equipo.owner.email
                const esFallbackDeCapitana = !equipo.subscription

                return (
                  <TableRow key={equipo.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/equipos/${equipo.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {equipo.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{contactName}</span>
                        <span className="text-xs text-muted-foreground">
                          {contactEmail}
                          {esFallbackDeCapitana && " (capitana)"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={equipo.subscription?.plan ?? null} />
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={equipo.subscription?.status ?? null} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateShort(equipo.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
