/**
 * src/services/notificacionService.ts
 *
 * Genera los datos necesarios para notificar deudoras por WhatsApp.
 * Calcula la deuda pendiente de cada jugadora activa sumando todos
 * sus EventParticipant en estado PENDIENTE.
 */

import { prisma } from "@/lib/prisma"

export type Deudora = {
  name: string
  deuda: number
}

export type DeudorasData = {
  teamName: string
  deudoras: Deudora[]   // ordenadas por deuda desc, solo las que deben > 0
  totalPendiente: number
}

export async function getDeudorasParaWhatsApp(
  teamId: string,
  userId: string
): Promise<{ success: true; data: DeudorasData } | { success: false; error: string }> {
  try {
    // Verificar que el usuario pertenece al equipo
    const [membership, team] = await Promise.all([
      prisma.teamMember.findFirst({
        where: { teamId, userId, status: "ACTIVA" },
      }),
      prisma.team.findUnique({ where: { id: teamId } }),
    ])

    if (!membership || !team) {
      return { success: false, error: "Sin acceso al equipo" }
    }

    // Todos los miembros activos del equipo
    const members = await prisma.teamMember.findMany({
      where: { teamId, status: "ACTIVA" },
    })

    if (members.length === 0) {
      return {
        success: true,
        data: { teamName: team.name, deudoras: [], totalPendiente: 0 },
      }
    }

    const memberIds = members.map((m) => m.id)

    // Participaciones en estado PENDIENTE de estas jugadoras
    const pendientes = await prisma.eventParticipant.findMany({
      where: { teamMemberId: { in: memberIds }, status: "PENDIENTE" },
    })

    if (pendientes.length === 0) {
      return {
        success: true,
        data: { teamName: team.name, deudoras: [], totalPendiente: 0 },
      }
    }

    // Eventos involucrados (para obtener amountPerPlayer)
    const eventIds = [...new Set(pendientes.map((p) => p.eventId))]
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
    })
    const eventMap = new Map(events.map((e) => [e.id, e]))

    // Acumular deuda por miembro
    const debtMap = new Map<string, number>()
    for (const p of pendientes) {
      const event = eventMap.get(p.eventId)
      if (!event) continue
      const prev = debtMap.get(p.teamMemberId) ?? 0
      debtMap.set(p.teamMemberId, prev + Number(event.amountPerPlayer))
    }

    // Construir lista de deudoras
    const memberMap = new Map(members.map((m) => [m.id, m]))
    const deudoras: Deudora[] = Array.from(debtMap.entries())
      .map(([memberId, deuda]) => ({
        name: memberMap.get(memberId)?.name ?? "Jugadora",
        deuda,
      }))
      .filter((d) => d.deuda > 0)
      .sort((a, b) => b.deuda - a.deuda)

    const totalPendiente = deudoras.reduce((acc, d) => acc + d.deuda, 0)

    return {
      success: true,
      data: { teamName: team.name, deudoras, totalPendiente },
    }
  } catch (err) {
    console.error("getDeudorasParaWhatsApp:", err)
    return { success: false, error: "Error al calcular deudas" }
  }
}
