/**
 * src/lib/color.ts — Utilidades de color para el tema personalizado por equipo.
 */

/**
 * Devuelve el color de texto (negro o blanco) con mejor contraste sobre un
 * color de fondo hex, según la luminancia relativa (fórmula WCAG).
 * Así la capitana solo elige 2 colores (principal y secundario) y el texto
 * que va encima siempre se lee bien.
 */
export function getContrastForeground(hex: string): "#000000" | "#ffffff" {
  const normalized = hex.replace("#", "")
  const r = parseInt(normalized.substring(0, 2), 16)
  const g = parseInt(normalized.substring(2, 4), 16)
  const b = parseInt(normalized.substring(4, 6), 16)

  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs

  // Umbral estándar (~0.179) donde el contraste contra blanco y negro se empata.
  return luminance > 0.179 ? "#000000" : "#ffffff"
}
