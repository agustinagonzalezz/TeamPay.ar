/**
 * app/(dashboard)/unirse/[equipoId]/page.tsx
 *
 * Página de invitación al equipo con flujo "¿Sos vos?".
 *
 * Si existen TeamMember sin cuenta vinculada (creados manualmente por la capitana),
 * se muestra una lista para que la jugadora se identifique — preservando su
 * historial de pagos. Si no hay ninguno, flujo directo de unirse.
 *
 * Opciones:
 *   • Elegir un nombre existente → linkToExistingMember (preserva historial)
 *   • "Soy nueva"                → joinTeam (crea TeamMember nuevo)
 */

import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { Users } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getTeamPublicInfo } from "@/services/teamService"
import {
  getUnlinkedMembers,
  joinTeam,
  linkToExistingMember,
} from "@/services/jugadoraService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Unirse al equipo — TeamPayment.app" }

// ── Página ────────────────────────────────────────────────────────────────────

export default async function UnirseAlEquipoPage({
  params,
  searchParams,
}: {
  params: Promise<{ equipoId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { equipoId } = await params
  const { error } = await searchParams

  const user = await getCurrentUser()
  if (!user) redirect(`/login?callbackUrl=/unirse/${equipoId}`)

  // Obtener info pública del equipo y los miembros sin cuenta
  const [teamResult, unlinkedResult] = await Promise.all([
    getTeamPublicInfo(equipoId),
    getUnlinkedMembers(equipoId),
  ])
  if (!teamResult.success) notFound()

  const equipo = teamResult.data
  const unlinkedMembers = unlinkedResult.success ? unlinkedResult.data : []
  const hasUnlinked = unlinkedMembers.length > 0

  // ── Server Action ─────────────────────────────────────────────────────────
  async function handleJoin(formData: FormData) {
    "use server"

    const currentUser = await getCurrentUser()
    if (!currentUser) redirect(`/login?callbackUrl=/unirse/${equipoId}`)

    const memberId = formData.get("memberId") as string | null

    if (!memberId) {
      redirect(`/unirse/${equipoId}?error=seleccion`)
    }

    if (memberId === "nueva") {
      // Crear nuevo TeamMember
      const result = await joinTeam(
        equipoId,
        currentUser.id,
        currentUser.name ?? currentUser.email ?? "Jugadora"
      )
      if (!result.success && result.error !== "YA_ES_MIEMBRO") {
        redirect(`/unirse/${equipoId}?error=1`)
      }
    } else {
      // Vincular cuenta al TeamMember existente
      const result = await linkToExistingMember(memberId, equipoId, currentUser.id)
      if (!result.success && result.error !== "YA_ES_MIEMBRO") {
        redirect(`/unirse/${equipoId}?error=1`)
      }
    }

    redirect(`/equipos/${equipoId}`)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="items-center gap-3 text-center">
            {/* Avatar del equipo */}
            <div
              className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary"
              aria-hidden="true"
            >
              {equipo.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Te invitaron a unirte a</p>
              <CardTitle className="mt-1 text-2xl">{equipo.name}</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {/* Info del equipo */}
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-center">
              {equipo.description && (
                <p className="mb-2 text-sm text-muted-foreground">{equipo.description}</p>
              )}
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-4" aria-hidden="true" />
                <span>
                  {equipo.memberCount === 1
                    ? "1 jugadora activa"
                    : `${equipo.memberCount} jugadoras activas`}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error === "seleccion"
                  ? "Seleccioná una opción antes de continuar."
                  : "Ocurrió un error. Intentá de nuevo."}
              </div>
            )}

            {/* Formulario */}
            <form action={handleJoin} className="flex flex-col gap-4">

              {hasUnlinked ? (
                /* ── Flujo con selección ─────────────────────────────── */
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold">¿Ya estás en el equipo?</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Si la capitana te agregó antes, elegí tu nombre para vincular
                      tu cuenta y conservar tu historial.
                    </p>
                  </div>

                  <fieldset className="flex flex-col gap-2">
                    <legend className="sr-only">Elegí tu perfil</legend>

                    {/* Opciones: miembros existentes */}
                    {unlinkedMembers.map((member) => (
                      <label
                        key={member.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                          "has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                        )}
                      >
                        <input
                          type="radio"
                          name="memberId"
                          value={member.id}
                          className="accent-primary"
                        />
                        <span className="text-sm font-medium">{member.name}</span>
                      </label>
                    ))}

                    {/* Separador */}
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex-1 border-t" />
                      <span className="text-xs text-muted-foreground">o</span>
                      <div className="flex-1 border-t" />
                    </div>

                    {/* Opción: soy nueva */}
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors",
                        "has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      )}
                    >
                      <input
                        type="radio"
                        name="memberId"
                        value="nueva"
                        className="accent-primary"
                      />
                      <span className="text-sm text-muted-foreground">
                        No estoy en la lista, soy nueva
                      </span>
                    </label>
                  </fieldset>
                </div>
              ) : (
                /* ── Flujo directo (no hay miembros sin cuenta) ──────── */
                <input type="hidden" name="memberId" value="nueva" />
              )}

              {/* Usuario logueado */}
              <p className="text-center text-sm text-muted-foreground">
                Vas a unirte como{" "}
                <span className="font-medium text-foreground">
                  {user.name ?? user.email}
                </span>
              </p>

              <Button type="submit" className="w-full" size="lg">
                {hasUnlinked ? "Confirmar" : "Unirme al equipo"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                La capitana podrá registrar tus pagos y ver tu participación en
                los eventos del equipo.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
