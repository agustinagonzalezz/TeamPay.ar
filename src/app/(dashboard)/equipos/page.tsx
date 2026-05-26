/**
 * app/(dashboard)/equipos/page.tsx — Listado de equipos del usuario
 *
 * Server Component que:
 *   • Obtiene los equipos del usuario autenticado via teamService
 *   • Muestra un grid de tarjetas con EquipoCard
 *   • Muestra estado vacío con CTA a "Crear equipo" si no hay equipos
 */

import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getTeamsByUser } from "@/services/teamService"
import { EquipoCard } from "@/components/dashboard/EquipoCard"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Mis equipos — TeamPay.ar",
  description: "Administrá los pagos de tus equipos de fútbol",
}

export default async function EquiposPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const result = await getTeamsByUser(user.id)

  // Error de servicio — mostrar mensaje genérico
  if (!result.success) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {result.error}
        </div>
      </div>
    )
  }

  const equipos = result.data

  return (
    <div className="flex flex-col gap-6">
      <PageHeader />

      {equipos.length === 0 ? (
        // ── Estado vacío ───────────────────────────────────────────────────
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <div
            className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl"
            aria-hidden="true"
          >
            ⚽
          </div>
          <div>
            <p className="font-medium">Todavía no tenés equipos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Creá tu primer equipo para empezar a gestionar los pagos
            </p>
          </div>
          <Link href="/equipos/nuevo" className={cn(buttonVariants())}>
            <Plus className="size-4" aria-hidden="true" />
            Crear equipo
          </Link>
        </div>
      ) : (
        // ── Grid de equipos ────────────────────────────────────────────────
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipos.map((equipo) => (
            <EquipoCard key={equipo.id} equipo={equipo} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis equipos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todos los equipos en los que participás
        </p>
      </div>
      <Link href="/equipos/nuevo" className={cn(buttonVariants({ size: "sm" }))}>
        <Plus className="size-4" aria-hidden="true" />
        Nuevo equipo
      </Link>
    </div>
  )
}
