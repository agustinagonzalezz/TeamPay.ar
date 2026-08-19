"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail } from "lucide-react"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
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

export default function RegistroPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: RegisterInput) {
    setServerError(null)
    try {
      const res = await fetch("/api/auth/register", {
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
            form.setError(field as keyof RegisterInput, { message: messages[0] })
          }
          return
        }
        setServerError(data.error ?? "Ocurrió un error. Intentá de nuevo.")
        return
      }

      setEmailEnviado(values.email)
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  if (emailEnviado) {
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
            Te enviamos un email a <strong>{emailEnviado}</strong> para verificar tu cuenta.
            Revisá tu casilla de entrada (y la carpeta de spam).
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
          Creá tu cuenta
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Gestioná los pagos de tu equipo en minutos.
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>

    </div>
  )
}
