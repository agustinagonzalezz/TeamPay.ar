"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail } from "lucide-react"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function OlvideContrasenaPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = (await res.json()) as {
        success: boolean
        error?: string
        fieldErrors?: Record<string, string[]>
      }

      if (!res.ok || !data.success) {
        if (data.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors)) {
            form.setError(field as keyof ForgotPasswordInput, { message: messages[0] })
          }
          return
        }
        setServerError(data.error ?? "Ocurrió un error. Intentá de nuevo.")
        return
      }

      // Respuesta genérica siempre — nunca revelamos si el email existe o no.
      setEnviado(true)
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  if (enviado) {
    return (
      <div
        className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        <div
          className="inline-flex size-12 items-center justify-center rounded-full"
          style={{ background: "oklch(0.52 0.22 285 / 0.1)" }}
        >
          <Mail className="size-6" style={{ color: "oklch(0.52 0.22 285)" }} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Revisá tu email</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Si el email existe en TeamPayment.app, te enviamos un link para restablecer tu
            contraseña. Revisá tu casilla de entrada (y la carpeta de spam).
          </p>
        </div>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8" style={{ fontFamily: "var(--font-syne)" }}>

      {/* Logotipo */}
      <div>
        <div
          className="mb-6 inline-flex size-10 items-center justify-center rounded-lg text-xs font-bold tracking-tight"
          style={{ background: "oklch(0.52 0.22 285)", color: "oklch(0.99 0 0)" }}
        >
          TP
        </div>
        <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-foreground">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ingresá tu email y te mandamos un link para restablecerla.
        </p>
      </div>

      {/* Separador */}
      <div className="h-px w-full bg-border" />

      <div className="flex flex-col gap-4">
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? "Enviando..." : "Enviar link de recuperación"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Te acordaste?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>

    </div>
  )
}
