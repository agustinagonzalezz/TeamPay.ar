/**
 * src/app/api/auth/reset-password/route.ts
 *
 * POST /api/auth/reset-password — restablece la contraseña a partir de un token
 * de un solo uso generado por /api/auth/forgot-password.
 */

import { NextResponse } from "next/server"
import { resetPassword } from "@/services/authService"
import { resetPasswordSchema } from "@/lib/validations/auth"
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

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const result = await resetPassword(parsed.data.token, parsed.data.newPassword)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
