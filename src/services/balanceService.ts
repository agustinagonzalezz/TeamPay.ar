/**
 * src/services/balanceService.ts — Resumen financiero del equipo
 *
 * Agrega:
 *   • Lo cobrado  = suma de Payment.amount de todos los eventos del equipo
 *   • Lo gastado  = suma de Expense.amount del equipo
 *   • Balance     = cobrado − gastado
 *   • Desglose por evento con progreso de cobro
 */

import { prisma } from "@/lib/prisma"
import type { EventType, Expense } from "@/generated/prisma/client"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type BalanceEvento = {
  id: string
  name: string
  type: EventType
  amountPerPlayer: number
  dueDate: Date
  /** Participantes que deben pagar (excluye EXIMIDA) */
  obligadas: number
  pagaron: number
  totalCobrado: number
  totalEsperado: number
  /** 0–100 */
  progreso: number
}

export type TeamBalanceData = {
  totalCobrado: number
  totalGastado: number
  /** totalCobrado − totalGastado */
  balance: number
  eventos: BalanceEvento[]
  gastos: Expense[]
}

export type FiltroFecha = {
  desde?: Date
  hasta?: Date
}

// ── getTeamBalance ─────────────────────────────────────────────────────────────

/**
 * Retorna el resumen financiero completo del equipo.
 * Verifica que el usuario sea miembro activo.
 */
function buildDateRange(filtro?: FiltroFecha) {
  if (!filtro?.desde && !filtro?.hasta) return undefined
  return {
    ...(filtro.desde && { gte: filtro.desde }),
    ...(filtro.hasta && { lte: filtro.hasta }),
  }
}

export async function getTeamBalance(
  teamId: string,
  userId: string,
  filtro?: FiltroFecha
): Promise<ServiceResult<TeamBalanceData>> {
  try {
    // 1. Verificar acceso
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (!membership) {
      return { success: false, error: "No tenés acceso a este equipo." }
    }

    // 2. Obtener eventos del equipo (con filtro de fecha opcional sobre dueDate)
    const dueDateRange = buildDateRange(filtro)
    const events = await prisma.event.findMany({
      where: {
        teamId,
        ...(dueDateRange ? { dueDate: dueDateRange } : {}),
      },
      orderBy: { dueDate: "desc" },
    })
    const eventIds = events.map((e) => e.id)

    // 3. Obtener todos los participantes con sus pagos (queries planas)
    const participants =
      eventIds.length > 0
        ? await prisma.eventParticipant.findMany({
            where: { eventId: { in: eventIds } },
            select: {
              eventId: true,
              status: true,
              customAmount: true,   // RF-21
              payment: { select: { amount: true } },
            },
          })
        : []

    // 4. Obtener gastos del equipo (con filtro de fecha opcional sobre paidAt)
    const paidAtRange = buildDateRange(filtro)
    const gastos = await prisma.expense.findMany({
      where: {
        teamId,
        ...(paidAtRange ? { paidAt: paidAtRange } : {}),
      },
      orderBy: { paidAt: "desc" },
    })

    // ── Calcular totales globales ─────────────────────────────────────────────

    const totalCobrado = participants.reduce(
      (acc, p) => acc + (p.payment ? Number(p.payment.amount) : 0),
      0
    )
    const totalGastado = gastos.reduce(
      (acc, g) => acc + Number(g.amount),
      0
    )

    // ── Calcular desglose por evento ──────────────────────────────────────────

    // Agrupar participantes por eventId
    const participantsByEvent = new Map<string, typeof participants>()
    for (const p of participants) {
      const list = participantsByEvent.get(p.eventId) ?? []
      list.push(p)
      participantsByEvent.set(p.eventId, list)
    }

    const eventosResumen: BalanceEvento[] = events.map((ev) => {
      const evParticipants = participantsByEvent.get(ev.id) ?? []
      const total = evParticipants.length
      const eximidas = evParticipants.filter((p) => p.status === "EXIMIDA").length
      const pagaron = evParticipants.filter((p) => p.status === "PAGO").length
      const obligadas = total - eximidas
      const totalCobradoEv = evParticipants.reduce(
        (acc, p) => acc + (p.payment ? Number(p.payment.amount) : 0),
        0
      )
      // RF-21: usar customAmount por participante si está definido
      const totalEsperado = evParticipants
        .filter((p) => p.status !== "EXIMIDA")
        .reduce((acc, p) => acc + Number(p.customAmount ?? ev.amountPerPlayer), 0)
      const progreso =
        obligadas > 0 ? Math.round((pagaron / obligadas) * 100) : 100

      return {
        id: ev.id,
        name: ev.name,
        type: ev.type,
        amountPerPlayer: Number(ev.amountPerPlayer),
        dueDate: ev.dueDate,
        obligadas,
        pagaron,
        totalCobrado: totalCobradoEv,
        totalEsperado,
        progreso,
      }
    })

    return {
      success: true,
      data: {
        totalCobrado,
        totalGastado,
        balance: totalCobrado - totalGastado,
        eventos: eventosResumen,
        gastos,
      },
    }
  } catch (error) {
    console.error("[balanceService.getTeamBalance]", error)
    return { success: false, error: "No se pudo calcular el balance." }
  }
}
