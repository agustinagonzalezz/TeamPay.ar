"use client"

/**
 * src/components/shared/SignOutButton.tsx
 *
 * Botón de cierre de sesión.
 * Debe ser Client Component porque invoca signOut() del lado del cliente.
 */

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="size-4" aria-hidden="true" />
      Salir
    </Button>
  )
}
