/**
 * src/app/admin/layout.tsx — Layout raíz del panel de super administración.
 *
 * Único punto de entrada a /admin/** : exige requireSuperAdmin() antes de
 * renderizar cualquier página hija, así todas las rutas bajo /admin quedan
 * protegidas de una sola vez. No comparte layout con el dashboard de equipos
 * — el super admin no es un rol dentro de ningún equipo (RNF-13).
 *
 * Las rutas de API bajo /api/admin/** no pasan por este layout (Next.js no
 * aplica layouts a Route Handlers) — cada una debe llamar a
 * requireSuperAdminApi() de src/lib/auth/super-admin.ts.
 */

import { requireSuperAdmin } from "@/lib/auth/super-admin"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()

  return <>{children}</>
}
