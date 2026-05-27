/**
 * src/services/perfilService.ts — Situación financiera personal de la jugadora
 *
 * Agrega los EventParticipant de TODOS los equipos donde el usuario
 * tiene una cuenta vinculada (TeamMember.userId = userId).
 * Permite que la jugadora vea qué debe y qué pagó en todos sus equipos.
 */

import { prisma } from "@/lib/prisma"
import type { EventType, ParticipantStatus } from "@/generated/prisma/client"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type MiParticipacion = {
  participanteId: string
  eventoId: string
  eventoNombre: string
  eventoTipo: EventType
  dueDate: Date
  amountPerPlayer: number
  status: ParticipantStatus
  paidAt: Date | null
  paidAmount: number | null
  equipoId: string
  equipoNombre: string
}

export type MiSituacion = {
  /** Suma de amountPerPlayer de eventos PENDIENTE */
  totalPendiente: number
  /** Suma de paidAmount de eventos PAGO */
  totalPagado: number
  /** Eventos pendientes de pago, ordenados por vencimiento ascendente */
  pendientes: MiParticipacion[]
  /** Eventos pagados y eximidos, ordenados por fecha descendente */
  historial: MiParticipacion[]
}

// ── getMySituacion ────────────────────────────────────────────────────────────

/**
 * Retorna la situación financiera personal del usuario logueado.
 * Solo incluye equipos donde TeamMember.userId === userId.
 */
export async function getMySituacion(
  userId: string
): Promise<ServiceResult<MiSituacion>> {
  try {
    // 1. Todas las membresías activas con userId vinculado
    const memberships = await prisma.teamMember.findMany({
      where: { userId, status: "ACTIVA" },
      select: { id: true, teamId: true },
    })

    if (memberships.length === 0) {
      return {
        success: true,
        data: { totalPendiente: 0, totalPagado: 0, pendientes: [], historial: [] },
      }
    }

    const memberIds = memberships.map((m) => m.id)
    const teamIds = memberships.map((m) => m.teamId)

    // 2. Participaciones con el pago asociado
    const participants = await prisma.eventParticipant.findMany({
      where: { teamMemberId: { in: memberIds } },
      select: {
        id: true,
        eventId: true,
        teamMemberId: true,
        status: true,
        payment: { select: { amount: true, paidAt: true } },
      },
    })

    if (participants.length === 0) {
      return {
        success: true,
        data: { totalPendiente: 0, totalPagado: 0, pendientes: [], historial: [] },
      }
    }

    // 3. Eventos y equipos (queries planas)
    const eventIds = [...new Set(participants.map((p) => p.eventId))]

    const [events, teams] = await Promise.all([
      prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, teamId: true, name: true, type: true, amountPerPlayer: true, dueDate: true },
      }),
      prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true },
      }),
    ])

    // 4. Mapas para join en memoria
    const eventMap = new Map(events.map((e) => [e.id, e]))
    const teamMap = new Map(teams.map((t) => [t.id, t]))
    // teamMemberId → teamId
    const memberTeamMap = new Map(memberships.map((m) => [m.id, m.teamId]))

    // 5. Construir lista de participaciones
    const participaciones: MiParticipacion[] = []

    for (const p of participants) {
      const ev = eventMap.get(p.eventId)
      if (!ev) continue
      const teamId = memberTeamMap.get(p.teamMemberId)
      if (!teamId) continue
      const team = teamMap.get(teamId)
      if (!team) continue

      participaciones.push({
        participanteId: p.id,
        eventoId: ev.id,
        eventoNombre: ev.name,
        eventoTipo: ev.type,
        dueDate: ev.dueDate,
        amountPerPlayer: Number(ev.amountPerPlayer),
        status: p.status,
        paidAt: p.payment?.paidAt ?? null,
        paidAmount: p.payment ? Number(p.payment.amount) : null,
        equipoId: teamId,
        equipoNombre: team.name,
      })
    }

    // 6. Separar en pendientes e historial
    const pendientes = participaciones
      .filter((p) => p.status === "PENDIENTE")
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()) // más urgente primero

    const historial = participaciones
      .filter((p) => p.status !== "PENDIENTE")
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime()) // más reciente primero

    const totalPendiente = pendientes.reduce(
      (acc, p) => acc + p.amountPerPlayer,
      0
    )
    const totalPagado = historial
      .filter((p) => p.status === "PAGO")
      .reduce((acc, p) => acc + (p.paidAmount ?? 0), 0)

    return {
      success: true,
      data: { totalPendiente, totalPagado, pendientes, historial },
    }
  } catch (error) {
    console.error("[perfilService.getMySituacion]", error)
    return { success: false, error: "No se pudo cargar tu situación." }
  }
}
