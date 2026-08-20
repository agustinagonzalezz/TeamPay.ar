/**
 * src/app/api/auth/register/route.ts
 *
 * POST /api/auth/register — crea una cuenta con email y contraseña.
 * La cuenta queda sin verificar hasta que se confirme el email.
 */

import { NextResponse } from "next/server"
import { registerUser } from "@/services/authService"
import { registerSchema } from "@/lib/validations/auth"
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

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const result = await registerUser(parsed.data)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 409 })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
