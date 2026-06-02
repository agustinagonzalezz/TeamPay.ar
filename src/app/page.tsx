import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "TeamPayment.app — Gestión de pagos para equipos de fútbol",
  description: "Cuotas, gastos y balance de tu equipo de fútbol amateur en un solo lugar. Sin planillas, sin quilombos. Gratis.",
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    number: "01",
    title: "Registrá pagos",
    description: "Marcá quién pagó, cuánto y por qué. Efectivo o transferencia. El historial queda guardado.",
    detail: "Cuotas mensuales · torneos · amistosos · gastos varios",
  },
  {
    number: "02",
    title: "Controlá el balance",
    description: "Ves lo que cobró el equipo y lo que gastó, en tiempo real. Con un click exportás a Excel.",
    detail: "Balance neto · gastos · cobrado por evento · filtros por período",
  },
  {
    number: "03",
    title: "Avisá por WhatsApp",
    description: "Mensaje pre-armado con todos los nombres y montos. Listo para copiar y pegar, con un toque.",
    detail: "Lista de deudoras · monto pendiente · envío directo a WhatsApp",
  },
]

const STEPS = [
  {
    number: "01",
    title: "Entrás con Google",
    description: "Sin contraseñas. Un click y ya estás dentro.",
  },
  {
    number: "02",
    title: "Creás el equipo",
    description: "Le ponés nombre y agregás las jugadoras.",
  },
  {
    number: "03",
    title: "Empezás a registrar",
    description: "Cuotas, gastos, pagos — todo en un lugar.",
  },
]

// ── Página ────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const user = await getCurrentUser()
  if (user) redirect("/equipos")

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#09090f", color: "#f0ede8" }}>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </div>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ borderColor: "#ffffff0f", background: "#09090fee", backdropFilter: "blur(16px)" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded text-[11px] font-bold"
            style={{ background: "oklch(0.52 0.22 285)", color: "#fff" }}
            aria-hidden="true"
          >TP</div>
          <span className="text-sm font-semibold tracking-tight">
            TeamPayment<span style={{ color: "oklch(0.68 0.18 285)" }}>.app</span>
          </span>
        </div>
        <Link
          href="/login"
          className="rounded-lg px-3.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ border: "1px solid #ffffff18", color: "#a09a94" }}
        >
          Iniciar sesión
        </Link>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div className="flex flex-col gap-14 lg:flex-row lg:items-center lg:gap-16">

        {/* Texto */}
        <div className="flex flex-1 flex-col gap-7 min-w-0">
          <span
            className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              background: "oklch(0.52 0.22 285 / 0.1)",
              color: "oklch(0.68 0.18 285)",
              border: "1px solid oklch(0.52 0.22 285 / 0.2)",
            }}
          >
            ⚽ Fútbol amateur argentino
          </span>

          <h1
            className="text-[clamp(3rem,9vw,5.5rem)] font-black uppercase leading-[0.92] tracking-tighter"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            Las cuentas{" "}
            <span style={{ color: "oklch(0.68 0.2 285)" }}>claras,</span>
            <br />
            el equipo{" "}
            <span style={{ color: "oklch(0.68 0.2 285)" }}>unido.</span>
          </h1>

          <p className="max-w-sm text-[15px] leading-relaxed" style={{ color: "#7a7470" }}>
            Cuotas, gastos y balance de tu equipo de fútbol
            en un solo lugar. Sin planillas, sin quilombos.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold tracking-tight transition-all hover:brightness-110"
              style={{ background: "oklch(0.52 0.22 285)", color: "#fff" }}
            >
              Empezá gratis
              <span aria-hidden="true" className="opacity-70">→</span>
            </Link>
            <span className="text-xs" style={{ color: "#3d3835" }}>
              Sin tarjeta · Sin límites
            </span>
          </div>

          <div className="flex gap-8 pt-4 border-t" style={{ borderColor: "#ffffff08" }}>
            {[
              { value: "100%", label: "Gratis para arrancar" },
              { value: "5 min", label: "Setup del equipo" },
              { value: "∞", label: "Jugadoras" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span
                  className="text-2xl font-black tabular-nums leading-none"
                  style={{ fontFamily: "var(--font-barlow)", color: "oklch(0.68 0.2 285)" }}
                >{value}</span>
                <span className="text-[11px] leading-tight" style={{ color: "#3d3835" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mock UI */}
        <div className="w-full lg:w-[390px] shrink-0">
          <MockDashboard />
        </div>
      </div>
    </section>
  )
}

// ── MockDashboard ─────────────────────────────────────────────────────────────

function MockDashboard() {
  return (
    <div
      className="rounded-2xl overflow-hidden text-sm select-none"
      style={{
        background: "#111119",
        border: "1px solid #ffffff10",
        boxShadow: "0 0 60px oklch(0.52 0.22 285 / 0.08), 0 24px 64px #00000060",
      }}
      aria-hidden="true"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#ffffff0a", background: "oklch(0.52 0.22 285 / 0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
            style={{ background: "oklch(0.52 0.22 285)", color: "#fff" }}
          >LP</div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#f0ede8" }}>Las Pibas FC</p>
            <p className="text-[10px]" style={{ color: "oklch(0.68 0.18 285)" }}>Capitana ★</p>
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
          style={{ background: "oklch(0.52 0.22 285 / 0.15)", color: "oklch(0.72 0.2 285)" }}
        >Balance ↗</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-b" style={{ borderColor: "#ffffff0a" }}>
        {[
          { n: "14", label: "Jugadoras" },
          { n: "5", label: "Eventos" },
          { n: "$84.500", label: "Balance" },
        ].map(({ n, label }, i) => (
          <div
            key={label}
            className="flex flex-col gap-0.5 px-3 py-3"
            style={{ borderRight: i < 2 ? "1px solid #ffffff0a" : undefined }}
          >
            <span
              className="text-lg font-bold tabular-nums leading-none"
              style={{ fontFamily: "var(--font-barlow)", color: n.startsWith("$") ? "oklch(0.68 0.2 285)" : "#f0ede8" }}
            >{n}</span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "#3d3835" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Evento */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "#ffffff0a" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium" style={{ color: "#f0ede8" }}>Cuota Junio</span>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{ background: "oklch(0.52 0.22 285 / 0.12)", color: "oklch(0.68 0.18 285)" }}
          >CUOTA</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden mb-1.5" style={{ background: "#ffffff0a" }}>
          <div className="h-full rounded-full" style={{ width: "67%", background: "oklch(0.52 0.22 285)" }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "#3d3835" }}>8/12 pagaron</span>
          <span className="text-[11px] font-semibold" style={{ color: "#f0ede8" }}>67%</span>
        </div>
      </div>

      {/* Gastos */}
      <div className="px-4 pt-3 pb-3">
        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#3d3835" }}>Gastos recientes</p>
        {[
          { concept: "Profe Carla", amount: "−$35.000" },
          { concept: "Cancha Vélez", amount: "−$12.000" },
        ].map(({ concept, amount }, i) => (
          <div
            key={concept}
            className="flex items-center justify-between py-1.5"
            style={{ borderTop: i > 0 ? "1px solid #ffffff06" : undefined }}
          >
            <span className="text-[12px]" style={{ color: "#7a7470" }}>{concept}</span>
            <span className="text-[12px] font-medium tabular-nums" style={{ color: "#f05470" }}>{amount}</span>
          </div>
        ))}
      </div>

      {/* WhatsApp */}
      <div
        className="mx-4 mb-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5"
        style={{ background: "oklch(0.32 0.1 145 / 0.4)", border: "1px solid oklch(0.45 0.15 145 / 0.25)" }}
      >
        <span className="text-sm shrink-0">💬</span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium" style={{ color: "oklch(0.75 0.15 145)" }}>
            4 deudoras · $24.000 pendiente
          </p>
          <p className="text-[10px]" style={{ color: "oklch(0.52 0.12 145)" }}>Mensaje listo para WhatsApp</p>
        </div>
      </div>
    </div>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section style={{ background: "#0d0d14", borderTop: "1px solid #ffffff08", borderBottom: "1px solid #ffffff08" }}>
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-14">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "oklch(0.62 0.18 285)" }}>
            Funcionalidades
          </span>
          <h2
            className="mt-2 text-[clamp(2rem,5vw,3.2rem)] font-black uppercase leading-[0.95] tracking-tighter"
            style={{ fontFamily: "var(--font-barlow)", color: "#f0ede8" }}
          >
            Todo lo que necesitás,{" "}
            <span style={{ color: "oklch(0.68 0.2 285)" }}>nada que no usás.</span>
          </h2>
        </div>

        <div className="flex flex-col border-t" style={{ borderColor: "#ffffff0a" }}>
          {FEATURES.map((f) => (
            <div
              key={f.number}
              className="flex flex-col gap-4 py-8 border-b sm:flex-row sm:items-start sm:gap-10"
              style={{ borderColor: "#ffffff0a" }}
            >
              <span
                className="shrink-0 text-5xl font-black tabular-nums leading-none"
                style={{ fontFamily: "var(--font-barlow)", color: "#ffffff0c" }}
              >{f.number}</span>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold" style={{ color: "#f0ede8" }}>{f.title}</h3>
                <p className="text-[14px] leading-relaxed max-w-lg" style={{ color: "#7a7470" }}>{f.description}</p>
                <p className="text-[11px] font-medium" style={{ color: "oklch(0.62 0.18 285)" }}>{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-14">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "oklch(0.62 0.18 285)" }}>
          Cómo funciona
        </span>
        <h2
          className="mt-2 text-[clamp(2rem,5vw,3.2rem)] font-black uppercase leading-[0.95] tracking-tighter"
          style={{ fontFamily: "var(--font-barlow)", color: "#f0ede8" }}
        >
          Tres pasos.{" "}
          <span style={{ color: "oklch(0.68 0.2 285)" }}>Eso es todo.</span>
        </h2>
      </div>

      <div className="grid sm:grid-cols-3" style={{ border: "1px solid #ffffff0a" }}>
        {STEPS.map((s, i) => (
          <div
            key={s.number}
            className="flex flex-col gap-3 p-7"
            style={{
              borderRight: i < STEPS.length - 1 ? "1px solid #ffffff0a" : undefined,
              borderBottom: "1px solid #ffffff0a",
            }}
          >
            <span
              className="text-6xl font-black tabular-nums leading-none"
              style={{ fontFamily: "var(--font-barlow)", color: "oklch(0.52 0.22 285 / 0.15)" }}
            >{s.number}</span>
            <h3 className="text-[17px] font-bold" style={{ color: "#f0ede8" }}>{s.title}</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "#5a5450" }}>{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="px-5 pb-20">
      <div
        className="mx-auto max-w-6xl rounded-2xl overflow-hidden px-8 py-16 text-center relative"
        style={{ background: "oklch(0.52 0.22 285)" }}
      >
        {/* Texto decorativo de fondo */}
        <p
          className="absolute inset-0 flex items-center justify-center text-[clamp(4rem,15vw,9rem)] font-black uppercase leading-none tracking-tighter pointer-events-none select-none"
          style={{ fontFamily: "var(--font-barlow)", color: "#ffffff0f" }}
          aria-hidden="true"
        >
          GRATIS
        </p>

        <div className="relative">
          <h2
            className="text-[clamp(2.5rem,8vw,4rem)] font-black uppercase leading-none tracking-tighter mb-4"
            style={{ fontFamily: "var(--font-barlow)", color: "#fff" }}
          >
            ¿Lista para arrancar?
          </h2>
          <p className="text-[15px] mb-8" style={{ color: "#ffffffcc" }}>
            Sin tarjeta de crédito. Sin límites de jugadoras.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "#fff", color: "oklch(0.52 0.22 285)" }}
          >
            Empezá gratis
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "#ffffff08" }}>
      <div className="mx-auto max-w-6xl px-5 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex size-5 items-center justify-center rounded text-[9px] font-bold"
            style={{ background: "oklch(0.52 0.22 285 / 0.15)", color: "oklch(0.62 0.18 285)" }}
            aria-hidden="true"
          >TP</div>
          <span className="text-xs" style={{ color: "#2a2520" }}>
            TeamPayment.app © 2026
          </span>
        </div>
        <Link href="/login" className="text-xs transition-opacity hover:opacity-60" style={{ color: "#2a2520" }}>
          Iniciar sesión
        </Link>
      </div>
    </footer>
  )
}
