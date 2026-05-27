/**
 * src/app/(dashboard)/layout.tsx — Layout del grupo de rutas (dashboard)
 *
 * Server Component que:
 *   • Verifica que el usuario esté autenticado (doble chequeo después del proxy)
 *   • Provee la shell del dashboard: sidebar + área de contenido
 *
 * El proxy (src/proxy.ts) ya redirige usuarios no autenticados a /login,
 * pero la verificación acá protege ante errores de configuración del proxy.
 */

import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">⚽</span>
            <span className="font-semibold tracking-tight">TeamPay.ar</span>
          </div>

          <Link
            href="/perfil"
            className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-muted"
            title="Mi perfil"
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "Avatar"}
                className="size-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user.name ?? user.email}
            </span>
          </Link>
        </div>
      </header>

      {/* ── Contenido ────────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  )
}
