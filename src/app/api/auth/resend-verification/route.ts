/**
 * src/app/api/auth/resend-verification/route.ts
 *
 * POST /api/auth/resend-verification — reenvía el email de verificación.
 * Siempre responde con éxito genérico (exista o no la cuenta) para evitar
 * enumeración de usuarios.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { resendVerificationEmail } from "@/services/authService"

const resendSchema = z.object({
  email: z.string().min(1).email("Ingresá un email válido").trim().toLowerCase(),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Body inválido" }, { status: 400 })
  }

  const parsed = resendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Ingresá un email válido" }, { status: 422 })
  }

  await resendVerificationEmail(parsed.data.email)

  return NextResponse.json({ success: true })
}
