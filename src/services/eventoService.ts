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
  ParticipantStatus,
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

/** Versión pública para usar en Server Components de página. */
export async function checkIsCapitana(
  teamId: string,
  userId: string
): Promise<boolean> {
  return isCapitana(teamId, userId)
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

    if (jugadoras.length === 0) {
      return { success: false, error: "El equipo no tiene jugadoras activas." }
    }

    // Dividir el total entre la cantidad de jugadoras y redondear a entero
    const amountPerPlayer = Math.round(input.totalAmount / jugadoras.length)

    const evento = await prisma.$transaction(async (tx) => {
      const ev = await tx.event.create({
        data: {
          teamId,
          name: input.name.trim(),
          type: input.type,
          // Prisma Decimal acepta string; evitamos problemas de precisión flotante
          amountPerPlayer: String(amountPerPlayer),
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
          // orderBy por campo de relación no soportado con PrismaPg adapter
          // → ordenamos en JavaScript después de obtener los datos
        },
      },
    })

    if (evento) {
      evento.participants.sort((a, b) =>
        a.teamMember.name.localeCompare(b.teamMember.name, "es")
      )
    }

    if (!evento) {
      return { success: false, error: "Evento no encontrado." }
    }

    return { success: true, data: evento }
  } catch (error) {
    console.error("[eventoService.getEventoById]", error)
    return { success: false, error: "No se pudo cargar el evento." }
  }
}

// ── getEventoForDuplication ───────────────────────────────────────────────────

/** Campos mínimos del evento fuente para pre-rellenar el formulario de duplicación. */
export type EventoSourceData = {
  name: string
  type: string
  amountPerPlayer: number
  dueDate: Date
}

export async function getEventoForDuplication(
  eventoId: string,
  teamId: string,
  userId: string
): Promise<ServiceResult<EventoSourceData>> {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (!membership) {
      return { success: false, error: "Sin acceso al equipo." }
    }

    const evento = await prisma.event.findFirst({
      where: { id: eventoId, teamId },
      select: { name: true, type: true, amountPerPlayer: true, dueDate: true },
    })

    if (!evento) {
      return { success: false, error: "Evento no encontrado." }
    }

    return {
      success: true,
      data: {
        name: evento.name,
        type: evento.type,
        amountPerPlayer: Number(evento.amountPerPlayer),
        dueDate: evento.dueDate,
      },
    }
  } catch (error) {
    console.error("[eventoService.getEventoForDuplication]", error)
    return { success: false, error: "No se pudo cargar el evento." }
  }
}

// ── updateParticipantStatus ───────────────────────────────────────────────────

/**
 * Cambia el estado de pago de un participante.
 *
 * • PAGO      → crea (o actualiza) el Payment con amountPerPlayer del evento.
 * • PENDIENTE → elimina el Payment si existe.
 * • EXIMIDA   → elimina el Payment si existe.
 *
 * Solo la capitana puede modificar estados de pago.
 */
export async function updateParticipantStatus(
  participantId: string,
  teamId: string,
  newStatus: ParticipantStatus,
  userId: string
): Promise<ServiceResult<EventParticipant>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede registrar pagos." }
    }

    // Obtener participante con evento y pago actual
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId },
      include: { event: true, payment: true },
    })

    if (!participant || participant.event.teamId !== teamId) {
      return { success: false, error: "Participante no encontrado." }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (newStatus === "PAGO") {
        const amount = String(participant.event.amountPerPlayer)
        if (participant.payment) {
          // Actualizar pago existente (p.ej.: capitana deshace y vuelve a marcar)
          await tx.payment.update({
            where: { id: participant.payment.id },
            data: { amount, paidAt: new Date(), confirmedById: userId },
          })
        } else {
          await tx.payment.create({
            data: {
              eventParticipantId: participantId,
              amount,
              paidAt: new Date(),
              confirmedById: userId,
            },
          })
        }
      } else if (participant.payment) {
        // PENDIENTE o EXIMIDA: eliminar el pago registrado
        await tx.payment.delete({ where: { id: participant.payment.id } })
      }

      return tx.eventParticipant.update({
        where: { id: participantId },
        data: { status: newStatus },
      })
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error("[eventoService.updateParticipantStatus]", error)
    return { success: false, error: "No se pudo actualizar el estado del pago." }
  }
}
