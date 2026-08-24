import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getJugadorasByTeam } from "@/services/jugadoraService"
import { getEventoForDuplication } from "@/services/eventoService"
import { requireTeamWriteAccess, TEAM_WRITE_ACCESS_MESSAGES } from "@/lib/auth/team-access"
import { NuevoEventoForm } from "@/components/eventos/NuevoEventoForm"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CreateEventoInput } from "@/lib/validations/evento"

/** Suma un mes a una fecha sin overflow (ej: 31 ene → 28/29 feb). */
function addOneMonth(date: Date): string {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + 1)
  if (d.getDate() !== day) d.setDate(0) // último día del mes anterior si hubo overflow
  return d.toISOString().split("T")[0]
}

export default async function NuevoEventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ equipoId: string }>
  searchParams: Promise<{ duplicar?: string }>
}) {
  const { equipoId } = await params
  const { duplicar } = await searchParams

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // RF-56: bloquear el acceso directo al formulario en modo solo-lectura
  const writeAccess = await requireTeamWriteAccess(equipoId)
  if (!writeAccess.authorized) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {TEAM_WRITE_ACCESS_MESSAGES[writeAccess.reason]}
        </p>
        <Link
          href={`/equipos/${equipoId}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
        >
          Volver al equipo
        </Link>
      </div>
    )
  }

  const jugadorasResult = await getJugadorasByTeam(equipoId, user.id)
  const playerCount = jugadorasResult.success ? jugadorasResult.data.length : 0

  // ── Modo duplicación: pre-rellenar con datos del evento fuente ─────────────
  if (duplicar) {
    const sourceResult = await getEventoForDuplication(duplicar, equipoId, user.id)

    if (sourceResult.success) {
      const src = sourceResult.data
      const defaultValues: Partial<CreateEventoInput> = {
        name: src.name,
        type: src.type as CreateEventoInput["type"],
        totalAmount: src.amountPerPlayer * playerCount,
        dueDate: addOneMonth(src.dueDate),
      }

      return (
        <NuevoEventoForm
          equipoId={equipoId}
          playerCount={playerCount}
          isDuplicate
          defaultValues={defaultValues}
          defaultItems={src.conceptos.length > 0 ? src.conceptos : undefined}
        />
      )
    }
    // Si no se encontró el evento fuente, cae al formulario vacío
  }

  return <NuevoEventoForm equipoId={equipoId} playerCount={playerCount} />
}
