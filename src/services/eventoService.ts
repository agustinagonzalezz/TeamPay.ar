/**
 * src/services/eventoService.ts — Capa de servicio para Eventos
 *
 * Al crear un evento se generan automáticamente los EventParticipant
 * para todas las jugadoras activas del equipo en el momento de la creación.
 */

import { prisma } from "@/lib/prisma"
import type { CreateEventoInput } from "@/lib/validations/evento"
import type {
  Event,
  EventParticipant,
  TeamMember,
  Payment,
} from "@/generated/prisma/client"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type EventoListItem = Event & {
  participants: Pick<EventParticipant, "status">[]
}

export type ParticipantWithDetails = EventParticipant & {
  teamMember: TeamMember
  payment: Payment | null
}

export type EventoDetails = Event & {
  participants: ParticipantWithDetails[]
}

// ── isCapitana ────────────────────────────────────────────────────────────────

async function isCapitana(teamId: string, userId: string): Promise<boolean> {
  const team = await prisma.team.findFirst({
    where: { id: teamId, ownerId: userId },
    select: { id: true },
  })
  return !!team
}

// ── createEvento ──────────────────────────────────────────────────────────────

/**
 * Crea un evento y genera EventParticipant para cada jugadora activa del equipo.
 * Solo la capitana puede crear eventos.
 */
export async function createEvento(
  teamId: string,
  input: CreateEventoInput,
  userId: string
): Promise<ServiceResult<Event>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede crear eventos." }
    }

    // Obtener jugadoras activas para generar los participantes
    const jugadoras = await prisma.teamMember.findMany({
      where: { teamId, status: "ACTIVA" },
      select: { id: true },
    })

    const evento = await prisma.$transaction(async (tx) => {
      const ev = await tx.event.create({
        data: {
          teamId,
          name: input.name.trim(),
          type: input.type,
          // Prisma Decimal acepta string; evitamos problemas de precisión flotante
          amountPerPlayer: String(input.amountPerPlayer),
          dueDate: new Date(input.dueDate),
        },
      })

      if (jugadoras.length > 0) {
        await tx.eventParticipant.createMany({
          data: jugadoras.map((j) => ({
            eventId: ev.id,
            teamMemberId: j.id,
            status: "PENDIENTE",
          })),
        })
      }

      return ev
    })

    return { success: true, data: evento }
  } catch (error) {
    console.error("[eventoService.createEvento]", error)
    return { success: false, error: "No se pudo crear el evento. Intentá de nuevo." }
  }
}

// ── getEventosByTeam ──────────────────────────────────────────────────────────

/**
 * Retorna todos los eventos de un equipo, con los estados de participación
 * para mostrar la barra de progreso de pagos.
 * Verifica que el usuario sea miembro activo del equipo.
 */
export async function getEventosByTeam(
  teamId: string,
  userId: string
): Promise<ServiceResult<EventoListItem[]>> {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (!membership) {
      return { success: false, error: "No tenés acceso a este equipo." }
    }

    const eventos = await prisma.event.findMany({
      where: { teamId },
      include: {
        participants: { select: { status: true } },
      },
      orderBy: { dueDate: "desc" },
    })

    return { success: true, data: eventos }
  } catch (error) {
    console.error("[eventoService.getEventosByTeam]", error)
    return { success: false, error: "No se pudieron cargar los eventos." }
  }
}

// ── getEventoById ─────────────────────────────────────────────────────────────

/**
 * Retorna el detalle de un evento con todos los participantes.
 * Verifica acceso al equipo.
 */
export async function getEventoById(
  eventoId: string,
  teamId: string,
  userId: string
): Promise<ServiceResult<EventoDetails>> {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (!membership) {
      return { success: false, error: "No tenés acceso a este equipo." }
    }

    const evento = await prisma.event.findFirst({
      where: { id: eventoId, teamId },
      include: {
        participants: {
          include: {
            teamMember: true,
            payment: true,
          },
          orderBy: { teamMember: { name: "asc" } },
        },
      },
    })

    if (!evento) {
      return { success: false, error: "Evento no encontrado." }
    }

    return { success: true, data: evento }
  } catch (error) {
    console.error("[eventoService.getEventoById]", error)
    return { success: false, error: "No se pudo cargar el evento." }
  }
}
