/**
 * src/services/gastoService.ts — Capa de servicio para Gastos del equipo
 *
 * Los gastos son egresos operativos del equipo (cancha, entrenador, etc.)
 * que no están ligados a un evento específico.
 * Solo la capitana puede crear y eliminar gastos.
 */

import { prisma } from "@/lib/prisma"
import { requireTeamWriteAccess, SUBSCRIPTION_SUSPENDED_MESSAGE } from "@/lib/auth/team-access"
import type { CreateGastoInput } from "@/lib/validations/gasto"
import type { Expense } from "@/generated/prisma/client"
import type { ServiceErrorCode } from "@/types/service-result"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ServiceErrorCode }

// ── isCapitana ────────────────────────────────────────────────────────────────

async function isCapitana(teamId: string, userId: string): Promise<boolean> {
  const [team, member] = await Promise.all([
    prisma.team.findFirst({ where: { id: teamId, ownerId: userId }, select: { id: true } }),
    prisma.teamMember.findFirst({ where: { teamId, userId, status: "ACTIVA", isCoCapitana: true }, select: { id: true } }),
  ])
  return !!(team || member)
}

// ── createGasto ───────────────────────────────────────────────────────────────

/**
 * Registra un gasto operativo del equipo.
 * Solo la capitana puede crear gastos.
 */
export async function createGasto(
  teamId: string,
  input: CreateGastoInput,
  userId: string
): Promise<ServiceResult<Expense>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede registrar gastos.", code: "NOT_CAPITANA" }
    }

    const writeAccess = await requireTeamWriteAccess(teamId)
    if (!writeAccess.authorized) {
      return { success: false, error: SUBSCRIPTION_SUSPENDED_MESSAGE, code: writeAccess.reason }
    }

    const gasto = await prisma.expense.create({
      data: {
        teamId,
        concept: input.concept.trim(),
        amount: String(input.amount),
        paidTo: input.paidTo.trim(),
        paidAt: new Date(input.paidAt),
        category: input.category ?? "OTRO", // TODO: descomentar tras correr migración prisma
      },
    })

    return { success: true, data: gasto }
  } catch (error) {
    console.error("[gastoService.createGasto]", error)
    return { success: false, error: "No se pudo registrar el gasto. Intentá de nuevo." }
  }
}

// ── getGastosByTeam ───────────────────────────────────────────────────────────

/**
 * Retorna todos los gastos de un equipo ordenados por fecha descendente.
 * Verifica que el usuario sea miembro activo.
 */
export async function getGastosByTeam(
  teamId: string,
  userId: string
): Promise<ServiceResult<Expense[]>> {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "ACTIVA" },
      select: { id: true },
    })
    if (!membership) {
      return { success: false, error: "No tenés acceso a este equipo." }
    }

    const gastos = await prisma.expense.findMany({
      where: { teamId },
      orderBy: { paidAt: "desc" },
    })

    return { success: true, data: gastos }
  } catch (error) {
    console.error("[gastoService.getGastosByTeam]", error)
    return { success: false, error: "No se pudieron cargar los gastos." }
  }
}

// ── updateGasto ───────────────────────────────────────────────────────────────

export async function updateGasto(
  gastoId: string,
  teamId: string,
  input: Partial<CreateGastoInput>,
  userId: string
): Promise<ServiceResult<Expense>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede editar gastos.", code: "NOT_CAPITANA" }
    }

    const writeAccess = await requireTeamWriteAccess(teamId)
    if (!writeAccess.authorized) {
      return { success: false, error: SUBSCRIPTION_SUSPENDED_MESSAGE, code: writeAccess.reason }
    }

    const gasto = await prisma.expense.findFirst({ where: { id: gastoId, teamId } })
    if (!gasto) return { success: false, error: "Gasto no encontrado." }

    const updated = await prisma.expense.update({
      where: { id: gastoId },
      data: {
        ...(input.concept && { concept: input.concept.trim() }),
        ...(input.amount != null && { amount: String(input.amount) }),
        ...(input.paidTo && { paidTo: input.paidTo.trim() }),
        ...(input.paidAt && { paidAt: new Date(input.paidAt) }),
        ...(input.category && { category: input.category }), // TODO: descomentar tras migración
      },
    })
    return { success: true, data: updated }
  } catch (error) {
    console.error("[gastoService.updateGasto]", error)
    return { success: false, error: "No se pudo actualizar el gasto." }
  }
}

// ── deleteGasto ───────────────────────────────────────────────────────────────

/**
 * Elimina un gasto del equipo.
 * Solo la capitana puede eliminar gastos.
 */
export async function deleteGasto(
  gastoId: string,
  teamId: string,
  userId: string
): Promise<ServiceResult<{ id: string }>> {
  try {
    if (!(await isCapitana(teamId, userId))) {
      return { success: false, error: "Solo la capitana puede eliminar gastos.", code: "NOT_CAPITANA" }
    }

    const writeAccess = await requireTeamWriteAccess(teamId)
    if (!writeAccess.authorized) {
      return { success: false, error: SUBSCRIPTION_SUSPENDED_MESSAGE, code: writeAccess.reason }
    }

    // Verificar que el gasto pertenece al equipo
    const gasto = await prisma.expense.findFirst({
      where: { id: gastoId, teamId },
      select: { id: true },
    })

    if (!gasto) {
      return { success: false, error: "Gasto no encontrado." }
    }

    await prisma.expense.delete({ where: { id: gastoId } })

    return { success: true, data: { id: gastoId } }
  } catch (error) {
    console.error("[gastoService.deleteGasto]", error)
    return { success: false, error: "No se pudo eliminar el gasto." }
  }
}
