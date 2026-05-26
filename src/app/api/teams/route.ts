/**
 * src/app/api/teams/route.ts — API route para equipos
 *
 * POST /api/teams — Crear un nuevo equipo
 *
 * Node.js runtime (usa Prisma).
 * La validación con Zod ocurre acá; la lógica de negocio está en teamService.
 */

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createTeam } from "@/services/teamService"
import { createTeamSchema } from "@/lib/validations/team"

export async function POST(request: Request) {
  // ── Autenticación ──────────────────────────────────────────────────────────
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    )
  }

  // ── Parseo del body ────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: "Body inválido" },
      { status: 400 }
    )
  }

  // ── Validación con Zod ─────────────────────────────────────────────────────
  const parsed = createTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Datos inválidos",
        // Formatea los errores de Zod para el cliente
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    )
  }

  // ── Lógica de negocio ──────────────────────────────────────────────────────
  const result = await createTeam(parsed.data, user.id)

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
