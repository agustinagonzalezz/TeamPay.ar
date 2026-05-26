/**
 * src/services/teamService.ts — Capa de servicio para la entidad Equipo
 *
 * Toda la lógica de negocio relacionada con equipos vive acá.
 * Las API routes y Server Actions son solo coordinadores delgados que
 * validan la entrada y llaman a estas funciones.
 *
 * Convenciones:
 *   • Retorna { success: true, data } | { success: false, error: string }
 *   • Nunca lanza excepciones al llamador — las captura internamente
 *   • Los errores de autorización usan mensajes genéricos (no revelan existencia)
 */

import { prisma } from "@/lib/prisma"
import type { CreateTeamInput } from "@/lib/validations/team"
import type { Team, TeamMember } from "@/generated/prisma/client"

// ── Tipos de retorno ──────────────────────────────────────────────────────────

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Equipo con conteo de miembros activos (para las tarjetas del listado)
export type TeamWithMemberCount = Team & {
  _count: { members: number }
}

// Equipo con miembros y conteos (para el dashboard del equipo)
export type TeamDetails = Team & {
  members: TeamMember[]
  _count: {
    members: number
    events: number
  }
}

// ── createTeam ────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo equipo y asigna al creador como CAPITANA.
 *
 * @param input - Datos validados del formulario (name, description)
 * @param userId - ID del usuario autenticado (owner)
 */
export async function createTeam(
  input: CreateTeamInput,
  userId: string
): Promise<ServiceResult<Team>> {
  try {
    // Normalizar descripción vacía a null (más limpio en la DB)
    const description =
      input.description && input.description.trim() !== ""
        ? input.description.trim()
        : null

    // Obtener el nombre del owner para el perfil de jugadora
    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })
    const memberName = owner?.name ?? "Capitana"

    const team = await prisma.team.create({
      data: {
        name: input.name.trim(),
        description,
        ownerId: userId,
        // Crear el TeamMember del owner en la misma transacción
        members: {
          create: {
            userId,
            name: memberName,
            status: "ACTIVA",
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

/**
 * Retorna todos los equipos donde el usuario es miembro activo,
 * ordenados por fecha de creación descendente.
 *
 * Incluye conteo de miembros activos para mostrar en las tarjetas.
 */
export async function getTeamsByUser(
  userId: string
): Promise<ServiceResult<TeamWithMemberCount[]>> {
  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
            status: "ACTIVA",
          },
        },
      },
      include: {
        _count: {
          select: {
            members: {
              where: { status: "ACTIVA" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: teams }
  } catch (error) {
    console.error("[teamService.getTeamsByUser]", error)
    return { success: false, error: "No se pudieron cargar los equipos." }
  }
}

// ── getTeamById ───────────────────────────────────────────────────────────────

/**
 * Retorna un equipo por ID, verificando que el usuario sea miembro activo.
 * Si el equipo no existe o el usuario no tiene acceso, retorna el mismo error
 * para no revelar si el equipo existe.
 *
 * @param teamId - ID del equipo
 * @param userId - ID del usuario autenticado (para verificar membresía)
 */
export async function getTeamById(
  teamId: string,
  userId: string
): Promise<ServiceResult<TeamWithMemberCount>> {
  try {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId,
            status: "ACTIVA",
          },
        },
      },
      include: {
        _count: {
          select: {
            members: {
              where: { status: "ACTIVA" },
            },
          },
        },
      },
    })

    if (!team) {
      return { success: false, error: "Equipo no encontrado." }
    }

    return { success: true, data: team }
  } catch (error) {
    console.error("[teamService.getTeamById]", error)
    return { success: false, error: "No se pudo cargar el equipo." }
  }
}

// ── getTeamDetails ────────────────────────────────────────────────────────────

/**
 * Retorna el equipo con sus miembros y conteos, para el dashboard del equipo.
 * Verifica que el usuario sea miembro activo.
 */
export async function getTeamDetails(
  teamId: string,
  userId: string
): Promise<ServiceResult<TeamDetails>> {
  try {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId,
            status: "ACTIVA",
          },
        },
      },
      include: {
        members: {
          where: { status: "ACTIVA" },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            members: { where: { status: "ACTIVA" } },
            events: true,
          },
        },
      },
    })

    if (!team) {
      return { success: false, error: "Equipo no encontrado." }
    }

    return { success: true, data: team }
  } catch (error) {
    console.error("[teamService.getTeamDetails]", error)
    return { success: false, error: "No se pudo cargar el equipo." }
  }
}
