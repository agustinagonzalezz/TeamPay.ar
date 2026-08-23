/**
 * src/lib/auth/super-admin.ts — Autorización para el panel de super administración.
 *
 * Solo verifica el flag User.isSuperAdmin, consultado fresco desde la base en
 * cada llamada (no confía en ningún dato de sesión/JWT cacheado). No importa
 * ni consulta ningún service de datos internos del equipo (jugadoras, pagos,
 * gastos, eventos) — este archivo es puramente de autorización (RNF-14/RF-57).
 */

import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export interface SuperAdminUser {
  id: string
  name: string | null
  email: string
}

/**
 * Devuelve la usuaria autenticada si es super admin, o null si no está
 * logueada o si isSuperAdmin es false. No redirige ni lanza — para eso usar
 * requireSuperAdmin() (páginas) o requireSuperAdminApi() (API routes).
 */
export async function getSuperAdminUser(): Promise<SuperAdminUser | null> {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) return null

  // Chequeo fresco contra la base — el flag isSuperAdmin no viaja en la sesión/JWT.
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, isSuperAdmin: true },
  })

  if (!user?.isSuperAdmin) return null

  return { id: user.id, name: user.name, email: user.email }
}

/**
 * Guard para Server Components / páginas bajo /admin. Redirige a "/" si la
 * usuaria no está logueada o no es super admin. Usar en
 * src/app/admin/layout.tsx para proteger todas las páginas hijas de una vez.
 */
export async function requireSuperAdmin(): Promise<SuperAdminUser> {
  const admin = await getSuperAdminUser()
  if (!admin) redirect("/")
  return admin
}

/**
 * Guard para Route Handlers bajo /api/admin/**. A diferencia de
 * requireSuperAdmin(), no redirige: devuelve la usuaria o una respuesta 403
 * ya lista para retornar tal cual desde el handler.
 *
 * @example
 * export async function GET() {
 *   const result = await requireSuperAdminApi()
 *   if (result instanceof NextResponse) return result
 *   const adminUserId = result.id
 *   // ...
 * }
 */
export async function requireSuperAdminApi(): Promise<SuperAdminUser | NextResponse> {
  const admin = await getSuperAdminUser()
  if (!admin) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
  }
  return admin
}
