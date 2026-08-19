"use client"

import { useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface CredentialsLoginFormProps {
  action: (formData: FormData) => void | Promise<void>
  errorMessage: string | null
}

const INPUT_CLASSNAME =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

export function CredentialsLoginForm({ action, errorMessage }: CredentialsLoginFormProps) {
  const emailRef = useRef<HTMLInputElement>(null)
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent" | "error">("idle")

  async function handleResend() {
    const email = emailRef.current?.value.trim()
    if (!email) {
      setResendState("error")
      return
    }

    setResendState("loading")
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setResendState(res.ok ? "sent" : "error")
    } catch {
      setResendState("error")
    }
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        ref={emailRef}
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        required
        className={INPUT_CLASSNAME}
      />
      <input
        name="password"
        type="password"
        placeholder="Contraseña"
        autoComplete="current-password"
        required
        className={INPUT_CLASSNAME}
      />
      <button
        type="submit"
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Iniciar sesión
      </button>

      {errorMessage && (
        <div className="flex flex-col items-start gap-1 pt-1">
          {resendState === "sent" ? (
            <p className="text-xs text-primary">
              Si tu cuenta existe y no está verificada, te reenviamos el link. Revisá tu email.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === "loading"}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary hover:underline disabled:opacity-50"
            >
              {resendState === "loading" ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  Reenviando...
                </span>
              ) : (
                "¿No verificaste tu email? Reenviar verificación"
              )}
            </button>
          )}
          {resendState === "error" && (
            <p className="text-xs text-destructive">No se pudo reenviar. Probá de nuevo.</p>
          )}
        </div>
      )}
    </form>
  )
}
