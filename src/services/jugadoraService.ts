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

// ── getUnlinkedMembers ────────────────────────────────────────────────────────

/**
 * Retorna los TeamMember activos del equipo que NO tienen cuenta vinculada.
 * Usado en la página de invitación para mostrar la opción "¿Sos vos?".
 */
export async function getUnlinkedMembers(
  teamId: string
): Promise<ServiceResult<Pick<TeamMember, "id" | "name">[]>> {
  try {
    const members = await prisma.teamMember.findMany({
      where: { teamId, status: "ACTIVA", userId: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
    return { success: true, data: members }
  } catch (error) {
    console.error("[jugadoraService.getUnlinkedMembers]", error)
    return { success: false, error: "No se pudo cargar el equipo." }
  }
}

// ── linkToExistingMember ──────────────────────────────────────────────────────

/**
 * Vincula una cuenta de usuario a un TeamMember existente (creado manualmente).
 * Preserva todo el historial: EventParticipant, Payments, etc.
 *
 * Verifica:
 *   • El TeamMember pertenece al equipo indicado
 *   • El TeamMember aún no tiene userId (no fue reclamado por otra cuenta)
 *   • El userId no tiene ya otro TeamMember activo en ese equipo
 */
export async function linkToExistingMember(
  memberId: string,
  teamId: string,
  userId: string
): Promise<ServiceResult<TeamMember>> {
  try {
    // Verificar que el member existe y pertenece al equipo
    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, teamId, status: "ACTIVA" },
      select: { id: true, userId: true },
    })

    if (!member) {
      return { success: false, error: "Jugadora no encontrada en el equipo." }
    }
    if (member.userId !== null) {
      return { success: false, error: "Este perfil ya fue reclamado por otra cuenta." }
    }

    // Verificar que el usuario no tenga ya otro TeamMember en este equipo
    const duplicate = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (duplicate) {
      return { success: false, error: "YA_ES_MIEMBRO" }
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { userId },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error("[jugadoraService.linkToExistingMember]", error)
    return { success: false, error: "No se pudo vincular la cuenta. Intentá de nuevo." }
  }
}

// ── joinTeam ──────────────────────────────────────────────────────────────────

/**
 * Une a un usuario autenticado a un equipo mediante el link de invitación.
 * Crea un nuevo TeamMember vinculado al userId.
 * Si ya existe una membresía activa para ese userId en el equipo, devuelve error.
 */
export async function joinTeam(
  teamId: string,
  userId: string,
  userName: string
): Promise<ServiceResult<TeamMember>> {
  try {
    // Verificar que el equipo exista
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    })
    if (!team) {
      return { success: false, error: "El equipo no existe." }
    }

    // Verificar si ya es miembro activo
    const existing = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (existing) {
      return { success: false, error: "YA_ES_MIEMBRO" }
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        name: userName,
        status: "ACTIVA",
      },
    })

    return { success: true, data: member }
  } catch (error) {
    console.error("[jugadoraService.joinTeam]", error)
    return { success: false, error: "No se pudo unirse al equipo. Intentá de nuevo." }
  }
}

// ── removeJugadora ────────────────────────────────────────────────────────────

/**
 * Da de baja (INACTIVA) a una jugadora del equipo.
 * Solo la capitana puede hacerlo.
 * No se puede dar de baja a la propia capitana.
 */
// ── updateJugadora ────────────────────────────────────────────────────────────

export async function updateJugadora(
  jugadoraId: string,
  teamId: string,
  name: string,
  userId: string
): Promise<ServiceResult<TeamMember>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede editar jugadoras." }
    }
    const member = await prisma.teamMember.findFirst({ where: { id: jugadoraId, teamId } })
    if (!member) return { success: false, error: "Jugadora no encontrada." }

    const updated = await prisma.teamMember.update({
      where: { id: jugadoraId },
      data: { name: name.trim() },
    })
    return { success: true, data: updated }
  } catch (error) {
    console.error("[jugadoraService.updateJugadora]", error)
    return { success: false, error: "No se pudo actualizar la jugadora." }
  }
}

// ── removeJugadora ────────────────────────────────────────────────────────────

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
