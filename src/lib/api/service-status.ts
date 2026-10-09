/**
 * src/lib/api/service-status.ts — Mapeo único de `ServiceErrorCode` a status HTTP.
 *
 * Las rutas API usan esta función en vez de repetir el mapeo en cada handler.
 * Los errores de validación del request (body inválido, Zod, etc.) NO pasan por
 * acá: esos los resuelve la ruta directamente con 400/422.
 */
import type { ServiceErrorCode } from "@/types/service-result"

const FORBIDDEN_CODES: ReadonlySet<string> = new Set<ServiceErrorCode>([
  "NOT_CAPITANA",
  "SELF_ACTION_FORBIDDEN",
  "SUBSCRIPTION_SUSPENDED",
  "TRIAL_EXPIRED",
])

export const statusFromServiceCode = (code?: string, fallback = 400): number => {
  if (code && FORBIDDEN_CODES.has(code)) return 403
  if (code === "CONFLICT") return 409
  return fallback
}
