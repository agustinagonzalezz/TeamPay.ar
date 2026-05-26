/**
 * src/services/jugadoraService.ts — Capa de servicio para Jugadoras (TeamMember)
 *
 * Toda la lógica relacionada con miembros de equipo.
 * Verifica autorización (solo la capitana puede agregar/dar de baja jugadoras).
 */

import { prisma } from "@/lib/prisma"
import type { AddJugadoraInput } from "@/lib/validations/jugadora"
import type { TeamMember } from "@/generated/prisma/client"

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ── isCapitana ────────────────────────────────────────────────────────────────

/**
 * Verifica si el usuario es la capitana (owner) del equipo.
 */
async function isCapitana(teamId: string, userId: string): Promise<boolean> {
  const team = await prisma.team.findFirst({
    where: { id: teamId, ownerId: userId },
    select: { id: true },
  })
  return !!team
}

// ── getJugadorasByTeam ────────────────────────────────────────────────────────

/**
 * Retorna todas las jugadoras activas del equipo.
 * Verifica que el solicitante sea miembro del equipo.
 */
export async function getJugadorasByTeam(
  teamId: string,
  userId: string
): Promise<ServiceResult<TeamMember[]>> {
  try {
    // Verificar que el usuario pertenece al equipo
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (!membership) {
      return { success: false, error: "No tenés acceso a este equipo." }
    }

    const jugadoras = await prisma.teamMember.findMany({
      where: { teamId, status: "ACTIVA" },
      orderBy: { name: "asc" },
    })

    return { success: true, data: jugadoras }
  } catch (error) {
    console.error("[jugadoraService.getJugadorasByTeam]", error)
    return { success: false, error: "No se pudieron cargar las jugadoras." }
  }
}

// ── addJugadora ───────────────────────────────────────────────────────────────

/**
 * Agrega una nueva jugadora al equipo (sin cuenta de usuario).
 * Solo la capitana puede hacerlo.
 */
export async function addJugadora(
  teamId: string,
  input: AddJugadoraInput,
  userId: string
): Promise<ServiceResult<TeamMember>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede agregar jugadoras." }
    }

    const jugadora = await prisma.teamMember.create({
      data: {
        teamId,
        name: input.name.trim(),
        status: "ACTIVA",
      },
    })

    return { success: true, data: jugadora }
  } catch (error) {
    console.error("[jugadoraService.addJugadora]", error)
    return { success: false, error: "No se pudo agregar la jugadora. Intentá de nuevo." }
  }
}

// ── removeJugadora ────────────────────────────────────────────────────────────

/**
 * Da de baja (INACTIVA) a una jugadora del equipo.
 * Solo la capitana puede hacerlo.
 * No se puede dar de baja a la propia capitana.
 */
export async function removeJugadora(
  jugadoraId: string,
  teamId: string,
  userId: string
): Promise<ServiceResult<TeamMember>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede dar de baja jugadoras." }
    }

    // No permitir que la capitana se dé de baja a sí misma
    const jugadora = await prisma.teamMember.findFirst({
      where: { id: jugadoraId, teamId },
      select: { id: true, userId: true },
    })

    if (!jugadora) {
      return { success: false, error: "Jugadora no encontrada." }
    }

    if (jugadora.userId === userId) {
      return { success: false, error: "No podés darte de baja del equipo que administrás." }
    }

    const updated = await prisma.teamMember.update({
      where: { id: jugadoraId },
      data: { status: "INACTIVA" },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error("[jugadoraService.removeJugadora]", error)
    return { success: false, error: "No se pudo dar de baja la jugadora." }
  }
}
