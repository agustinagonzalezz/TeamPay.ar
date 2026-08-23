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
import { getContrastForeground } from "@/lib/color"

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

  if (!primaryColor && !secondaryColor) {
    return <>{children}</>
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
      {children}
    </div>
  )
}
