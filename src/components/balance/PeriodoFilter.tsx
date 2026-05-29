"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type PeriodoId = "todos" | "mes" | "trimestre" | "anio" | "custom"

const PERIODOS: { id: PeriodoId; label: string }[] = [
  { id: "todos",     label: "Todos" },
  { id: "mes",       label: "Este mes" },
  { id: "trimestre", label: "Trimestre" },
  { id: "anio",      label: "Este año" },
  { id: "custom",    label: "Personalizado" },
]

interface PeriodoFilterProps {
  periodoActivo: PeriodoId
  desdeActivo?: string
  hastaActivo?: string
}

export function PeriodoFilter({
  periodoActivo,
  desdeActivo = "",
  hastaActivo = "",
}: PeriodoFilterProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [showCustom, setShowCustom] = useState(periodoActivo === "custom")
  const [desde, setDesde] = useState(desdeActivo)
  const [hasta, setHasta] = useState(hastaActivo)

  function navigate(periodo: PeriodoId, d?: string, h?: string) {
    const params = new URLSearchParams()
    if (periodo !== "todos") params.set("periodo", periodo)
    if (d) params.set("desde", d)
    if (h) params.set("hasta", h)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function handlePillClick(id: PeriodoId) {
    if (id === "custom") {
      setShowCustom((v) => !v)
      return
    }
    setShowCustom(false)
    navigate(id)
  }

  function handleApplyCustom() {
    if (!desde || !hasta) return
    navigate("custom", desde, hasta)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Pills */}
      <div className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => {
          const isActive =
            p.id === periodoActivo ||
            (p.id === "custom" && periodoActivo === "custom")

          return (
            <button
              key={p.id}
              onClick={() => handlePillClick(p.id)}
              className={cn(
                "rounded-full border px-3.5 py-1 text-xs font-medium transition-all",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Custom date range */}
      {showCustom && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
          <button
            onClick={handleApplyCustom}
            disabled={!desde || !hasta}
            className="h-8 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
