/**
 * src/services/eventoService.ts — Capa de servicio para Eventos
 *
 * Al crear un evento se generan automáticamente los EventParticipant
 * para todas las jugadoras activas del equipo en el momento de la creación.
 */

import { prisma } from "@/lib/prisma"
import type { CreateEventoInput, UpdateEventoInput } from "@/lib/validations/evento"
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
  const [team, member] = await Promise.all([
    prisma.team.findFirst({ where: { id: teamId, ownerId: userId }, select: { id: true } }),
    prisma.teamMember.findFirst({ where: { teamId, userId, status: "ACTIVA", isCoCapitana: true }, select: { id: true } }),
  ])
  return !!(team || member)
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

// ── updateEvento ──────────────────────────────────────────────────────────────

export async function updateEvento(
  eventoId: string,
  teamId: string,
  input: UpdateEventoInput,
  userId: string,
  playerCount: number
): Promise<ServiceResult<Event>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede editar eventos." }
    }

    const evento = await prisma.event.findFirst({ where: { id: eventoId, teamId } })
    if (!evento) return { success: false, error: "Evento no encontrado." }

    const amountPerPlayer =
      input.totalAmount != null && playerCount > 0
        ? Math.round(input.totalAmount / playerCount)
        : undefined

    const updated = await prisma.event.update({
      where: { id: eventoId },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.type && { type: input.type }),
        ...(amountPerPlayer != null && { amountPerPlayer }),
        ...(input.dueDate && { dueDate: new Date(input.dueDate + "T12:00:00") }),
      },
    })
    return { success: true, data: updated }
  } catch (error) {
    console.error("[eventoService.updateEvento]", error)
    return { success: false, error: "No se pudo actualizar el evento." }
  }
}

// ── deleteEvento ──────────────────────────────────────────────────────────────

export async function deleteEvento(
  eventoId: string,
  teamId: string,
  userId: string
): Promise<ServiceResult<null>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede eliminar eventos." }
    }

    const evento = await prisma.event.findFirst({ where: { id: eventoId, teamId } })
    if (!evento) return { success: false, error: "Evento no encontrado." }

    // Solo eliminar si no hay pagos registrados
    const paymentCount = await prisma.payment.count({
      where: { eventParticipant: { eventId: eventoId } },
    })
    if (paymentCount > 0) {
      return { success: false, error: "No se puede eliminar un evento con pagos registrados." }
    }

    await prisma.event.delete({ where: { id: eventoId } })
    return { success: true, data: null }
  } catch (error) {
    console.error("[eventoService.deleteEvento]", error)
    return { success: false, error: "No se pudo eliminar el evento." }
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
 * RF-21: usa customAmount del participante si está definido.
 * RF-24: rechaza cambios en eventos cerrados.
 * RF-30: acepta paidAmount opcional para registrar pago parcial.
 */
export async function updateParticipantStatus(
  participantId: string,
  teamId: string,
  newStatus: ParticipantStatus,
  userId: string,
  paidAmount?: number
): Promise<ServiceResult<EventParticipant>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede registrar pagos." }
    }

    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId },
      include: { event: true, payment: true },
    })

    if (!participant || participant.event.teamId !== teamId) {
      return { success: false, error: "Participante no encontrado." }
    }

    // RF-24: evento cerrado
    if (participant.event.closedAt) {
      return { success: false, error: "El evento está cerrado y no acepta cambios de pago." }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (newStatus === "PAGO") {
        // RF-21 + RF-30: usar monto personalizado, luego customAmount, luego amountPerPlayer
        const effectiveAmount = paidAmount != null
          ? String(paidAmount)
          : String(participant.customAmount ?? participant.event.amountPerPlayer)

        if (participant.payment) {
          await tx.payment.update({
            where: { id: participant.payment.id },
            data: { amount: effectiveAmount, paidAt: new Date(), confirmedById: userId },
          })
        } else {
          await tx.payment.create({
            data: {
              eventParticipantId: participantId,
              amount: effectiveAmount,
              paidAt: new Date(),
              confirmedById: userId,
            },
          })
        }
      } else if (participant.payment) {
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

// ── updateParticipantCustomAmount (RF-21) ─────────────────────────────────────

export async function updateParticipantCustomAmount(
  participantId: string,
  teamId: string,
  customAmount: number | null,
  userId: string
): Promise<ServiceResult<EventParticipant>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede modificar montos." }
    }

    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId },
      include: { event: { select: { teamId: true, closedAt: true } } },
    })

    if (!participant || participant.event.teamId !== teamId) {
      return { success: false, error: "Participante no encontrado." }
    }

    if (participant.event.closedAt) {
      return { success: false, error: "El evento está cerrado." }
    }

    const updated = await prisma.eventParticipant.update({
      where: { id: participantId },
      data: { customAmount: customAmount != null ? String(customAmount) : null },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error("[eventoService.updateParticipantCustomAmount]", error)
    return { success: false, error: "No se pudo actualizar el monto." }
  }
}

// ── closeEvento (RF-24) ───────────────────────────────────────────────────────

export async function closeEvento(
  eventoId: string,
  teamId: string,
  userId: string
): Promise<ServiceResult<Event>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede cerrar eventos." }
    }

    const evento = await prisma.event.findFirst({ where: { id: eventoId, teamId } })
    if (!evento) return { success: false, error: "Evento no encontrado." }
    if (evento.closedAt) return { success: false, error: "El evento ya está cerrado." }

    const updated = await prisma.event.update({
      where: { id: eventoId },
      data: { closedAt: new Date() },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error("[eventoService.closeEvento]", error)
    return { success: false, error: "No se pudo cerrar el evento." }
  }
}
