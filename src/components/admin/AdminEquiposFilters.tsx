"use client"

import { useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search } from "lucide-react"
import type { AdminStatusFilter } from "@/services/superAdminService"

const STATUS_LABELS: Record<"TODOS" | AdminStatusFilter, string> = {
  TODOS: "Todos los estados",
  SIN_CONFIGURAR: "Sin configurar",
  TRIALING: "En trial",
  ACTIVE: "Activo",
  PAST_DUE: "Pago vencido",
  SUSPENDED: "Suspendido",
  CANCELED: "Cancelado",
}

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]

interface AdminEquiposFiltersProps {
  qActual: string
  statusActual: "TODOS" | AdminStatusFilter
}

export function AdminEquiposFilters({ qActual, statusActual }: AdminEquiposFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState(qActual)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Resincroniza durante el render (ej: back/forward del navegador) en vez de
  // con un efecto, evitando un re-render extra.
  const [qActualPrevio, setQActualPrevio] = useState(qActual)
  if (qActual !== qActualPrevio) {
    setQActualPrevio(qActual)
    setQ(qActual)
  }

  function navigate(next: { q?: string; status?: "TODOS" | AdminStatusFilter }) {
    const params = new URLSearchParams()
    const finalQ = next.q ?? q
    const finalStatus = next.status ?? statusActual

    if (finalQ) params.set("q", finalQ)
    if (finalStatus !== "TODOS") params.set("status", finalStatus)

    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function handleSearchChange(value: string) {
    setQ(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate({ q: value }), 400)
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="text"
          value={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar equipo por nombre..."
          className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>

      <select
        value={statusActual}
        onChange={(e) => navigate({ status: e.target.value as "TODOS" | AdminStatusFilter })}
        className="h-9 shrink-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        aria-label="Filtrar por estado de suscripción"
      >
        {STATUS_OPTIONS.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value]}
          </option>
        ))}
      </select>
    </div>
  )
}
