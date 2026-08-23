/**
 * src/services/superAdminService.ts — Datos comerciales para el panel de
 * super administración (equipos, suscripciones, auditoría). Ver SUPERADMIN.md.
 *
 * RNF-14 (aislamiento de datos): ningún query de este archivo selecciona ni
 * incluye TeamMember, Event, Payment ni Expense. Solo Team (datos básicos +
 * owner, para poder mostrar un contacto de respaldo), Subscription y
 * SuperAdminAuditLog. La autorización (¿es super admin?) la resuelve
 * src/lib/auth/super-admin.ts antes de llegar acá — estas funciones no la
 * repiten.
 */

import { prisma } from "@/lib/prisma"
import type { Plan, SubscriptionStatus, Prisma } from "@/generated/prisma/client"
import type {
  CreateSubscriptionInput,
  UpdateSubscriptionInfoInput,
  SUBSCRIPTION_ACTIONS,
} from "@/lib/validations/subscription"

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

type SubscriptionAction = (typeof SUBSCRIPTION_ACTIONS)[number]

export type AdminStatusFilter = SubscriptionStatus | "SIN_CONFIGURAR"

export type AdminTeamListItem = {
  id: string
  name: string
  createdAt: Date
  owner: { name: string | null; email: string }
  subscription: {
    plan: Plan
    status: SubscriptionStatus
    contactName: string
    contactEmail: string
    contactPhone: string | null
  } | null
}

export type AdminTeamDetail = {
  id: string
  name: string
  createdAt: Date
  owner: { id: string; name: string | null; email: string }
  subscription: {
    id: string
    plan: Plan
    status: SubscriptionStatus
    priceArs: number | null
    trialEndsAt: Date | null
    currentPeriodEnd: Date | null
    contactName: string
    contactEmail: string
    contactPhone: string | null
    billingName: string | null
    billingTaxId: string | null
    billingEmail: string | null
    notes: string | null
    updatedAt: Date
  } | null
}

/** Métricas del panel principal (RF-59). */
export type AdminMetrics = {
  totalTeams: number
  byStatus: Record<AdminStatusFilter, number>
  mrrArs: number
  /** Equipos ACTIVE sin priceArs cargado — no se cuentan en mrrArs. */
  activeTeamsMissingPrice: number
}

// ── getTeamsForAdmin ────────────────────────────────────────────────────────────

/**
 * Lista de equipos para la tabla principal del panel (RF-52/RF-60). Equipos
 * sin Subscription todavía se incluyen igual, con subscription: null — la
 * migración no crea suscripciones para equipos ya existentes.
 */
export async function getTeamsForAdmin(options?: {
  search?: string
  status?: AdminStatusFilter
}): Promise<ServiceResult<AdminTeamListItem[]>> {
  try {
    const search = options?.search?.trim()
    const status = options?.status

    const where: Prisma.TeamWhereInput = {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(status === "SIN_CONFIGURAR"
        ? { subscription: null }
        : status
          ? { subscription: { status } }
          : {}),
    }

    const teams = await prisma.team.findMany({
      where,
      select: {
        id: true,
        name: true,
        createdAt: true,
        owner: { select: { name: true, email: true } },
        subscription: {
          select: {
            plan: true,
            status: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: teams }
  } catch (error) {
    console.error("[superAdminService.getTeamsForAdmin]", error)
    return { success: false, error: "No se pudo cargar el listado de equipos." }
  }
}

// ── getTeamAdminDetail ──────────────────────────────────────────────────────────

/** Detalle de un equipo para la página /admin/equipos/[teamId] (RF-53/RF-54). */
export async function getTeamAdminDetail(teamId: string): Promise<ServiceResult<AdminTeamDetail>> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            priceArs: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            billingName: true,
            billingTaxId: true,
            billingEmail: true,
            notes: true,
            updatedAt: true,
          },
        },
      },
    })

    if (!team) return { success: false, error: "Equipo no encontrado." }

    return { success: true, data: team }
  } catch (error) {
    console.error("[superAdminService.getTeamAdminDetail]", error)
    return { success: false, error: "No se pudo cargar el equipo." }
  }
}

// ── createSubscription ──────────────────────────────────────────────────────────

/** Crea la Subscription inicial de un equipo que todavía no tiene una. */
export async function createSubscription(
  teamId: string,
  input: CreateSubscriptionInput,
  adminUserId: string
): Promise<ServiceResult<null>> {
  try {
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } })
    if (!team) return { success: false, error: "Equipo no encontrado." }

    const existing = await prisma.subscription.findUnique({ where: { teamId }, select: { id: true } })
    if (existing) return { success: false, error: "Este equipo ya tiene una suscripción configurada." }

    await prisma.$transaction([
      prisma.subscription.create({
        data: {
          teamId,
          plan: input.plan,
          status: input.status,
          priceArs: input.priceArs ?? null,
          trialEndsAt: parseDateInput(input.trialEndsAt),
          currentPeriodEnd: parseDateInput(input.currentPeriodEnd),
          contactName: input.contactName.trim(),
          contactEmail: input.contactEmail.trim(),
          contactPhone: input.contactPhone || null,
          billingName: input.billingName || null,
          billingTaxId: input.billingTaxId || null,
          billingEmail: input.billingEmail || null,
          notes: input.notes || null,
        },
      }),
      prisma.superAdminAuditLog.create({
        data: {
          adminUserId,
          action: "SUBSCRIPTION_CREATED",
          targetTeamId: teamId,
          metadata: { plan: input.plan, status: input.status },
        },
      }),
    ])

    return { success: true, data: null }
  } catch (error) {
    console.error("[superAdminService.createSubscription]", error)
    return { success: false, error: "No se pudo crear la suscripción." }
  }
}

// ── updateSubscriptionInfo ──────────────────────────────────────────────────────

const TRACKED_INFO_FIELDS = [
  "plan",
  "priceArs",
  "contactName",
  "contactEmail",
  "contactPhone",
  "billingName",
  "billingTaxId",
  "billingEmail",
  "notes",
] as const

/**
 * Actualiza plan, contacto y facturación de una Subscription existente
 * (RF-53/RF-54). RNF-18: el log de auditoría guarda qué campos cambiaron,
 * nunca los valores de los campos de facturación.
 */
export async function updateSubscriptionInfo(
  teamId: string,
  input: UpdateSubscriptionInfoInput,
  adminUserId: string
): Promise<ServiceResult<null>> {
  try {
    const existing = await prisma.subscription.findUnique({ where: { teamId } })
    if (!existing) {
      return { success: false, error: "Este equipo todavía no tiene una suscripción configurada." }
    }

    const normalized = {
      plan: input.plan,
      priceArs: input.priceArs ?? null,
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim(),
      contactPhone: input.contactPhone || null,
      billingName: input.billingName || null,
      billingTaxId: input.billingTaxId || null,
      billingEmail: input.billingEmail || null,
      notes: input.notes || null,
    }

    const fieldsChanged = TRACKED_INFO_FIELDS.filter((field) => existing[field] !== normalized[field])

    await prisma.$transaction([
      prisma.subscription.update({ where: { teamId }, data: normalized }),
      prisma.superAdminAuditLog.create({
        data: {
          adminUserId,
          action: "SUBSCRIPTION_INFO_EDITED",
          targetTeamId: teamId,
          metadata: { fieldsChanged },
        },
      }),
    ])

    return { success: true, data: null }
  } catch (error) {
    console.error("[superAdminService.updateSubscriptionInfo]", error)
    return { success: false, error: "No se pudo actualizar la suscripción." }
  }
}

// ── changeSubscriptionStatus ────────────────────────────────────────────────────

const ACTION_TO_STATUS: Record<Exclude<SubscriptionAction, "EXTEND_TRIAL">, SubscriptionStatus> = {
  ACTIVATE: "ACTIVE",
  MARK_PAID: "ACTIVE",
  SUSPEND: "SUSPENDED",
  CANCEL: "CANCELED",
  REACTIVATE: "ACTIVE",
}

/**
 * Override manual del estado de una suscripción (RF-55). Cada cambio queda
 * registrado en SuperAdminAuditLog con el estado anterior y el nuevo
 * (RF-58/RNF-19) dentro de la misma transacción.
 */
export async function changeSubscriptionStatus(
  teamId: string,
  action: SubscriptionAction,
  adminUserId: string,
  trialEndsAt?: string
): Promise<ServiceResult<null>> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { teamId },
      select: { status: true },
    })
    if (!subscription) {
      return { success: false, error: "Este equipo todavía no tiene una suscripción configurada." }
    }

    let newStatus: SubscriptionStatus
    let parsedTrialEndsAt: Date | null = null

    if (action === "EXTEND_TRIAL") {
      parsedTrialEndsAt = parseDateInput(trialEndsAt)
      if (!parsedTrialEndsAt) {
        return { success: false, error: "Ingresá una fecha válida para extender el trial." }
      }
      newStatus = "TRIALING"
    } else {
      newStatus = ACTION_TO_STATUS[action]
    }

    const previousStatus = subscription.status

    await prisma.$transaction([
      prisma.subscription.update({
        where: { teamId },
        data: {
          status: newStatus,
          ...(action === "EXTEND_TRIAL" ? { trialEndsAt: parsedTrialEndsAt } : {}),
        },
      }),
      prisma.superAdminAuditLog.create({
        data: {
          adminUserId,
          action: `SUBSCRIPTION_${action}`,
          targetTeamId: teamId,
          metadata: {
            previousStatus,
            newStatus,
            ...(action === "EXTEND_TRIAL" ? { trialEndsAt: parsedTrialEndsAt?.toISOString() } : {}),
          },
        },
      }),
    ])

    return { success: true, data: null }
  } catch (error) {
    console.error("[superAdminService.changeSubscriptionStatus]", error)
    return { success: false, error: "No se pudo actualizar el estado de la suscripción." }
  }
}

// ── getAdminMetrics ─────────────────────────────────────────────────────────────

/**
 * Métricas del panel principal (RF-59): total de equipos, desglose por
 * estado de suscripción y MRR estimado. Solo Team + Subscription (RNF-14) —
 * groupBy/aggregate en vez de traer filas y contar en JS.
 */
export async function getAdminMetrics(): Promise<ServiceResult<AdminMetrics>> {
  try {
    const [totalTeams, statusGroups, sinConfigurar, mrrAgg, activeTeamsMissingPrice] = await Promise.all([
      prisma.team.count(),
      prisma.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.team.count({ where: { subscription: null } }),
      prisma.subscription.aggregate({
        where: { status: "ACTIVE", priceArs: { not: null } },
        _sum: { priceArs: true },
      }),
      prisma.subscription.count({ where: { status: "ACTIVE", priceArs: null } }),
    ])

    const byStatus: Record<AdminStatusFilter, number> = {
      TRIALING: 0,
      ACTIVE: 0,
      PAST_DUE: 0,
      SUSPENDED: 0,
      CANCELED: 0,
      SIN_CONFIGURAR: sinConfigurar,
    }
    for (const group of statusGroups) {
      byStatus[group.status] = group._count._all
    }

    return {
      success: true,
      data: {
        totalTeams,
        byStatus,
        mrrArs: mrrAgg._sum.priceArs ?? 0,
        activeTeamsMissingPrice,
      },
    }
  } catch (error) {
    console.error("[superAdminService.getAdminMetrics]", error)
    return { success: false, error: "No se pudieron cargar las métricas." }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function parseDateInput(value: string | undefined): Date | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}
