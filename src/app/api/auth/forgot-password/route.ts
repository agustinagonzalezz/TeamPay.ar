/**
 * src/app/api/auth/forgot-password/route.ts
 *
 * POST /api/auth/forgot-password — solicita el restablecimiento de contraseña.
 * Responde siempre { success: true } con 200, exista o no la cuenta, para evitar
 * enumeración de usuarios.
 */

import { NextResponse } from "next/server"
import { requestPasswordReset } from "@/services/authService"
import { forgotPasswordSchema } from "@/lib/validations/auth"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const { success: withinLimit } = await checkRateLimit(getClientIp(req))
  if (!withinLimit) {
    return NextResponse.json(
      { success: false, error: "Demasiados intentos. Esperá unos minutos y probá de nuevo." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Body inválido" }, { status: 400 })
  }

  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Ingresá un email válido" }, { status: 422 })
  }

  await requestPasswordReset(parsed.data.email)

  return NextResponse.json({ success: true })
}
