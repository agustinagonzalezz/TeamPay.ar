/**
 * src/services/teamService.ts — Capa de servicio para la entidad Equipo
 */

import { prisma } from "@/lib/prisma"
import type { CreateTeamInput, UpdateTeamInput } from "@/lib/validations/team"
import type { Team, TeamMember } from "@/generated/prisma/client"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type TeamWithMemberCount = Team & {
  _count: { members: number }
}

export type TeamDetails = Team & {
  members: TeamMember[]
  _count: { members: number; events: number }
}

// ── createTeam ────────────────────────────────────────────────────────────────

export async function createTeam(
  input: CreateTeamInput,
  userId: string
): Promise<ServiceResult<Team>> {
  try {
    const description =
      input.description && input.description.trim() !== ""
        ? input.description.trim()
        : null

    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    // Trial automático de 14 días — cierra el agujero de equipos que operaban
    // gratis para siempre por no tener Subscription. contactName/contactEmail
    // arrancan con los datos de la capitana hasta que el super admin cargue un
    // contacto comercial distinto desde /admin.
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const team = await prisma.team.create({
      data: {
        name: input.name.trim(),
        description,
        primaryColor: input.primaryColor || null,
        secondaryColor: input.secondaryColor || null,
        ownerId: userId,
        members: {
          create: {
            userId,
            name: owner?.name ?? "Capitana",
            status: "ACTIVA",
          },
        },
        subscription: {
          create: {
            status: "TRIALING",
            plan: "TRIAL",
            trialEndsAt,
            contactName: owner?.name ?? "Capitana",
            contactEmail: owner?.email ?? "",
          },
        },
      },
    })

    return { success: true, data: team }
  } catch (error) {
    console.error("[teamService.createTeam]", error)
    return { success: false, error: "No se pudo crear el equipo. Intentá de nuevo." }
  }
}

// ── getTeamsByUser ────────────────────────────────────────────────────────────

export async function getTeamsByUser(
  userId: string
): Promise<ServiceResult<TeamWithMemberCount[]>> {
  try {
    // 1. IDs de los equipos donde el usuario está activo
    const memberships = await prisma.teamMember.findMany({
      where: { userId, status: "ACTIVA" },
      select: { teamId: true },
    })

    const teamIds = memberships.map((m) => m.teamId)
    if (teamIds.length === 0) return { success: true, data: [] }

    // 2. Equipos + conteo de miembros activos
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      orderBy: { createdAt: "desc" },
    })

    const activeMembers = await prisma.teamMember.findMany({
      where: { teamId: { in: teamIds }, status: "ACTIVA" },
      select: { teamId: true },
    })

    const countByTeam: Record<string, number> = {}
    for (const m of activeMembers) {
      countByTeam[m.teamId] = (countByTeam[m.teamId] ?? 0) + 1
    }

    return {
      success: true,
      data: teams.map((t) => ({
        ...t,
        _count: { members: countByTeam[t.id] ?? 0 },
      })),
    }
  } catch (error) {
    console.error("[teamService.getTeamsByUser]", error)
    return { success: false, error: "No se pudieron cargar los equipos." }
  }
}

// ── getTeamById ───────────────────────────────────────────────────────────────

export async function getTeamById(
  teamId: string,
  userId: string
): Promise<ServiceResult<TeamWithMemberCount>> {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (!membership) return { success: false, error: "Equipo no encontrado." }

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) return { success: false, error: "Equipo no encontrado." }

    const memberCount = await prisma.teamMember.count({
      where: { teamId, status: "ACTIVA" },
    })

    return { success: true, data: { ...team, _count: { members: memberCount } } }
  } catch (error) {
    console.error("[teamService.getTeamById]", error)
    return { success: false, error: "No se pudo cargar el equipo." }
  }
}

// ── getTeamPublicInfo ─────────────────────────────────────────────────────────

/**
 * Retorna info pública de un equipo sin verificar membresía.
 * Usada en la página de invitación para mostrar el nombre antes de unirse.
 */
export async function getTeamPublicInfo(
  teamId: string
): Promise<ServiceResult<{ id: string; name: string; description: string | null; memberCount: number }>> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, description: true },
    })
    if (!team) return { success: false, error: "Equipo no encontrado." }

    const memberCount = await prisma.teamMember.count({
      where: { teamId, status: "ACTIVA" },
    })

    return { success: true, data: { ...team, memberCount } }
  } catch (error) {
    console.error("[teamService.getTeamPublicInfo]", error)
    return { success: false, error: "No se pudo cargar el equipo." }
  }
}

// ── updateTeam ────────────────────────────────────────────────────────────────

export async function updateTeam(
  teamId: string,
  input: UpdateTeamInput,
  userId: string
): Promise<ServiceResult<Team>> {
  try {
    const team = await prisma.team.findFirst({ where: { id: teamId, ownerId: userId } })
    if (!team) return { success: false, error: "Solo la capitana puede editar el equipo." }

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(input.name && { name: input.name.trim() }),
        description: input.description?.trim() || null,
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl || null }),
        ...(input.primaryColor !== undefined && { primaryColor: input.primaryColor || null }),
        ...(input.secondaryColor !== undefined && { secondaryColor: input.secondaryColor || null }),
      },
    })
    return { success: true, data: updated }
  } catch (error) {
    console.error("[teamService.updateTeam]", error)
    return { success: false, error: "No se pudo actualizar el equipo." }
  }
}

// ── deleteTeam ────────────────────────────────────────────────────────────────

export async function deleteTeam(
  teamId: string,
  userId: string
): Promise<ServiceResult<null>> {
  try {
    const team = await prisma.team.findFirst({ where: { id: teamId, ownerId: userId } })
    if (!team) return { success: false, error: "Solo la capitana puede eliminar el equipo." }

    await prisma.team.delete({ where: { id: teamId } })
    return { success: true, data: null }
  } catch (error) {
    console.error("[teamService.deleteTeam]", error)
    return { success: false, error: "No se pudo eliminar el equipo." }
  }
}

// ── getTeamDetails ────────────────────────────────────────────────────────────

export async function getTeamDetails(
  teamId: string,
  userId: string
): Promise<ServiceResult<TeamDetails>> {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (!membership) return { success: false, error: "Equipo no encontrado." }

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) return { success: false, error: "Equipo no encontrado." }

    const members = await prisma.teamMember.findMany({
      where: { teamId, status: "ACTIVA" },
      orderBy: { name: "asc" },
    })

    const eventCount = await prisma.event.count({ where: { teamId } })

    return {
      success: true,
      data: {
        ...team,
        members,
        _count: { members: members.length, events: eventCount },
      },
    }
  } catch (error) {
    console.error("[teamService.getTeamDetails]", error)
    return { success: false, error: "No se pudo cargar el equipo." }
  }
}
