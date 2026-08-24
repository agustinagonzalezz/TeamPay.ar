/**
 * src/app/admin/equipos/[teamId]/page.tsx — Detalle de equipo del panel de
 * super administración. RF-53/RF-54 (ver/editar contacto y facturación),
 * RF-55 (cambiar estado manualmente).
 *
 * Protegida por src/app/admin/layout.tsx (requireSuperAdmin).
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, TriangleAlert } from "lucide-react"
import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { getTeamAdminDetail } from "@/services/superAdminService"
import { CreateSubscriptionForm } from "@/components/admin/CreateSubscriptionForm"
import { EditSubscriptionInfoForm } from "@/components/admin/EditSubscriptionInfoForm"
import { SubscriptionStatusActions } from "@/components/admin/SubscriptionStatusActions"
import { SubscriptionStatusBadge } from "@/components/admin/SubscriptionBadges"
import { buttonVariants } from "@/components/ui/button"
import { formatDate, cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Super admin — Detalle de equipo" }

export default async function AdminEquipoDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params

  const admin = await requireSuperAdmin()

  const result = await getTeamAdminDetail(teamId)
  if (!result.success) notFound()

  const equipo = result.data
  const { subscription } = equipo
  const esPropioEquipo = equipo.owner.id === admin.id

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <Link
          href="/admin"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-3")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Todos los equipos
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{equipo.name}</h1>
          <SubscriptionStatusBadge status={subscription?.status ?? null} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Alta {formatDate(equipo.createdAt)} · Capitana: {equipo.owner.name ?? equipo.owner.email} ({equipo.owner.email})
        </p>
        {subscription?.trialEndsAt && (
          <p
            className={cn(
              "mt-1 text-sm",
              subscription.trialEndsAt < new Date()
                ? "font-medium text-destructive"
                : "text-muted-foreground"
            )}
          >
            Trial {subscription.trialEndsAt < new Date() ? "venció" : "vence"} el{" "}
            {formatDate(subscription.trialEndsAt)}
            {subscription.status === "TRIALING" && subscription.trialEndsAt < new Date() && " — modo solo-lectura activo"}
          </p>
        )}
      </div>

      {esPropioEquipo && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-400"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Este es tu propio equipo — suspenderlo (o crear la suscripción ya como suspendida) también
            te va a dejar en modo solo-lectura a vos como capitana.
          </p>
        </div>
      )}

      {!subscription ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
            Este equipo todavía no tiene una suscripción configurada. Cargá los datos de
            contacto y facturación para empezar a gestionarlo.
          </div>
          <CreateSubscriptionForm teamId={teamId} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <SubscriptionStatusActions teamId={teamId} statusActual={subscription.status} />
          <EditSubscriptionInfoForm
            teamId={teamId}
            plan={subscription.plan}
            priceArs={subscription.priceArs}
            contactName={subscription.contactName}
            contactEmail={subscription.contactEmail}
            contactPhone={subscription.contactPhone}
            billingName={subscription.billingName}
            billingTaxId={subscription.billingTaxId}
            billingEmail={subscription.billingEmail}
            notes={subscription.notes}
          />
        </div>
      )}
    </div>
  )
}
