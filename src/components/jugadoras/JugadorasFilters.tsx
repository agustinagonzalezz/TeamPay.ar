"use client"

import { useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search } from "lucide-react"

type Orden = "nombre_asc" | "nombre_desc" | "camiseta" | "posicion"
type Estado = "ACTIVA" | "INACTIVA" | "TODAS"

const ORDEN_LABELS: Record<Orden, string> = {
  nombre_asc: "Nombre (A-Z)",
  nombre_desc: "Nombre (Z-A)",
  camiseta: "Número de camiseta",
  posicion: "Posición",
}

const ESTADO_LABELS: Record<Estado, string> = {
  ACTIVA: "Activas",
  INACTIVA: "Dadas de baja",
  TODAS: "Todas",
}

const SELECT_CLASSNAME =
  "h-9 shrink-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

interface JugadorasFiltersProps {
  qActual: string
  ordenActual: Orden
  estadoActual: Estado
}

export function JugadorasFilters({ qActual, ordenActual, estadoActual }: JugadorasFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState(qActual)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Si cambia la navegación por fuera (ej: back/forward del navegador), resincronizamos
  // el input durante el render en vez de con un efecto (evita un re-render extra).
  const [qActualPrevio, setQActualPrevio] = useState(qActual)
  if (qActual !== qActualPrevio) {
    setQActualPrevio(qActual)
    setQ(qActual)
  }

  function navigate(next: { q?: string; orden?: Orden; estado?: Estado }) {
    const params = new URLSearchParams()
    const finalQ = next.q ?? q
    const finalOrden = next.orden ?? ordenActual
    const finalEstado = next.estado ?? estadoActual

    if (finalQ) params.set("q", finalQ)
    if (finalOrden !== "nombre_asc") params.set("orden", finalOrden)
    if (finalEstado !== "ACTIVA") params.set("estado", finalEstado)

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
          placeholder="Buscar por nombre..."
          className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>

      <select
        value={ordenActual}
        onChange={(e) => navigate({ orden: e.target.value as Orden })}
        className={SELECT_CLASSNAME}
        aria-label="Ordenar jugadoras"
      >
        {Object.entries(ORDEN_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={estadoActual}
        onChange={(e) => navigate({ estado: e.target.value as Estado })}
        className={SELECT_CLASSNAME}
        aria-label="Filtrar por estado"
      >
        {Object.entries(ESTADO_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
