import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-13 max-w-5xl items-center justify-between px-4">

          {/* Logotipo */}
          <Link
            href="/equipos"
            className="flex items-center gap-2.5 rounded-md px-1 py-1 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold tracking-tighter"
              style={{ background: "oklch(0.52 0.22 285)", color: "oklch(0.99 0 0)" }}
              aria-hidden="true"
            >
              TP
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              TeamPay<span className="text-primary">.ar</span>
            </span>
          </Link>

          {/* Avatar */}
          <Link
            href="/perfil"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Mi perfil"
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "Avatar"}
                className="size-7 rounded-full object-cover ring-1 ring-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="flex size-7 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: "oklch(0.52 0.22 285 / 0.12)", color: "oklch(0.52 0.22 285)" }}
              >
                {initials}
              </div>
            )}
            <span className="hidden text-xs text-muted-foreground sm:block">
              {user.name?.split(" ")[0] ?? user.email}
            </span>
          </Link>

        </div>
      </header>

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>

    </div>
  )
}
