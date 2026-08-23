"use client"

/**
 * src/components/equipos/CopyInviteLinkButton.tsx
 *
 * Copia el link de invitación del equipo al portapapeles.
 * Muestra feedback visual ("¡Copiado!") por 2 segundos.
 */

import { useState } from "react"
import { Check, Link2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface CopyInviteLinkButtonProps {
  equipoId: string
}

export function CopyInviteLinkButton({ equipoId }: CopyInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/unirse/${equipoId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback para navegadores que no soportan clipboard API
      toast.error("No se pudo copiar automáticamente", { description: url })
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={copied ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400" : ""}
    >
      {copied ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          ¡Copiado!
        </>
      ) : (
        <>
          <Link2 className="size-4" aria-hidden="true" />
          Copiar link de invitación
        </>
      )}
    </Button>
  )
}
