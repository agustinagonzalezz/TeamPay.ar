/**
 * src/lib/rate-limit.ts — Rate limiting con Upstash Redis para endpoints públicos de auth.
 *
 * Sin UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN configuradas (ej: desarrollo
 * local sin Upstash) no bloqueamos nada — checkRateLimit devuelve siempre éxito.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const WINDOW = "10 m"
const MAX_ATTEMPTS = 5

// Instancia diferida: evita crear el cliente de Redis en tiempo de build,
// cuando las env vars pueden no estar seteadas todavía (mismo motivo que en lib/email.ts).
let ratelimit: Ratelimit | null | undefined

function getRatelimit(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  ratelimit = !url || !token
    ? null
    : new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, WINDOW),
        prefix: "teampay/auth",
      })

  return ratelimit
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const limiter = getRatelimit()
  if (!limiter) return { success: true }

  const { success } = await limiter.limit(identifier)
  return { success }
}

/** Extrae la IP del cliente a partir de los headers que agrega el proxy de Vercel. */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0].trim()

  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp

  return "unknown"
}
