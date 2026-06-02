"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportarExcelButtonProps {
  equipoId: string
  desde?: string
  hasta?: string
}

export function ExportarExcelButton({ equipoId, desde, hasta }: ExportarExcelButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)

      const url = `/api/equipos/${equipoId}/export${params.size > 0 ? `?${params}` : ""}`
      const res = await fetch(url)

      if (!res.ok) {
        alert("No se pudo generar el archivo.")
        return
      }

      const blob = await res.blob()
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename="(.+)"/)
      link.download = match?.[1] ?? "balance.xlsx"
      link.click()
      URL.revokeObjectURL(link.href)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {loading ? "Generando..." : "Exportar Excel"}
    </Button>
  )
}
