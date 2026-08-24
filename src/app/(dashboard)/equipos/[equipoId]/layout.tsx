/**
 * app/(dashboard)/equipos/[equipoId]/layout.tsx
 *
 * Si el equipo configuró colores propios (primaryColor/secondaryColor),
 * sobrescribe las variables CSS del tema violeta default solo para las
 * páginas de ESE equipo — el header/nav compartido (definido en el layout
 * padre) y el resto de la app no se ven afectados.
 */

import type { CSSProperties } from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getTeamById } from "@/services/teamService"
import { requireTeamWriteAccess } from "@/lib/auth/team-access"
import { getContrastForeground } from "@/lib/color"
import { SuspendedBanner } from "@/components/shared/SuspendedBanner"

export default async function EquipoLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ equipoId: string }>
}) {
  const { equipoId } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const teamResult = await getTeamById(equipoId, user.id)
  if (!teamResult.success) notFound()

  const { primaryColor, secondaryColor } = teamResult.data

  // RF-56b/RF-59bis: leído fresco en cada request, igual que isSuperAdmin —
  // al reactivarse (RF-56c) o al cargar un precio y pasar a ACTIVE, el
  // banner desaparece sin que nadie tenga que volver a loguearse.
  const writeAccess = await requireTeamWriteAccess(equipoId)

  const content = (
    <>
      {!writeAccess.authorized && <SuspendedBanner reason={writeAccess.reason} />}
      {children}
    </>
  )

  if (!primaryColor && !secondaryColor) {
    return content
  }

  const themeVars = {
    ...(primaryColor && {
      "--primary": primaryColor,
      "--primary-foreground": getContrastForeground(primaryColor),
      "--ring": primaryColor,
    }),
    ...(secondaryColor && {
      "--secondary": secondaryColor,
      "--secondary-foreground": getContrastForeground(secondaryColor),
    }),
  } as CSSProperties

  return (
    <div className="contents" style={themeVars}>
      {content}
    </div>
  )
}
