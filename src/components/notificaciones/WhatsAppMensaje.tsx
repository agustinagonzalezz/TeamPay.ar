"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { DeudorasData } from "@/services/notificacionService"

interface WhatsAppMensajeProps {
  data: DeudorasData
}

function buildMensaje(data: DeudorasData): string {
  const { teamName, deudoras, totalPendiente } = data

  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  if (deudoras.length === 0) {
    return `✅ *${teamName.toUpperCase()}*\n¡Todas las jugadoras están al día al ${fecha}! 🎉`
  }

  const lineas = deudoras
    .map((d) => `▪ ${d.name} → ${formatCurrency(d.deuda)}`)
    .join("\n")

  return (
    `💰 *${teamName.toUpperCase()} — Pagos pendientes*\n` +
    `_Al ${fecha}_\n\n` +
    `${lineas}\n\n` +
    `*Total pendiente: ${formatCurrency(totalPendiente)}*\n\n` +
    `_Gestionado con TeamPay.ar_`
  )
}

export function WhatsAppMensaje({ data }: WhatsAppMensajeProps) {
  const [copiado, setCopiado] = useState(false)

  const mensaje = buildMensaje(data)

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(mensaje)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Fallback para navegadores sin clipboard API
      const ta = document.createElement("textarea")
      ta.value = mensaje
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`

  return (
    <div className="flex flex-col gap-4">

      {data.deudoras.length === 0 ? (
        /* ── Estado feliz ──────────────────────────────────────────────── */
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <span className="text-3xl" aria-hidden="true">🎉</span>
          <p className="font-medium text-foreground">¡Todas al día!</p>
          <p className="text-sm text-muted-foreground">
            No hay deudas pendientes en este equipo.
          </p>
        </div>
      ) : (
        <>
          {/* ── Resumen rápido ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {data.deudoras.length === 1
                ? "1 jugadora con deuda"
                : `${data.deudoras.length} jugadoras con deuda`}
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(data.totalPendiente)} total
            </span>
          </div>

          {/* ── Preview del mensaje ─────────────────────────────────────── */}
          <div className="relative">
            {/* Burbuja de WhatsApp */}
            <div
              className="relative rounded-xl rounded-tl-sm px-4 py-3"
              style={{ background: "oklch(0.94 0.02 145)" }}
            >
              <pre
                className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
                style={{ color: "oklch(0.2 0.01 145)" }}
              >
                {mensaje}
              </pre>
              {/* Rabito de la burbuja */}
              <div
                className="absolute -left-2 top-0 size-0"
                style={{
                  borderTop: "8px solid oklch(0.94 0.02 145)",
                  borderLeft: "8px solid transparent",
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* ── Acciones ───────────────────────────────────────────────── */}
          <div className="flex gap-2">
            <button
              onClick={handleCopiar}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copiado ? (
                <>
                  <Check className="size-4 text-primary" aria-hidden="true" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden="true" />
                  Copiar mensaje
                </>
              )}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ background: "oklch(0.55 0.18 145)" }}
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Abrir en WhatsApp
            </a>
          </div>
        </>
      )}

    </div>
  )
}
