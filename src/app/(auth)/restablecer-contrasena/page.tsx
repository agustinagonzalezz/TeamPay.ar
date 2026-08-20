"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth"
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

export default function RestablecerContrasenaPage() {
  return (
    <Suspense fallback={null}>
      <RestablecerContrasenaForm />
    </Suspense>
  )
}

function RestablecerContrasenaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, newPassword: "", confirmPassword: "" },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null)
    try {
      const res = await fetch("/api/auth/reset-password", {
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
            form.setError(field as keyof ResetPasswordInput, { message: messages[0] })
          }
          return
        }
        setServerError(data.error ?? "Ocurrió un error. Intentá de nuevo.")
        return
      }

      router.push("/login?reset=1")
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  if (!token) {
    return (
      <div
        className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Link inválido</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Este link no es válido. Pedí uno nuevo para restablecer tu contraseña.
          </p>
        </div>
        <Link href="/olvide-contrasena" className="text-sm font-medium text-primary hover:underline">
          Pedir un link nuevo
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
          Elegí tu nueva contraseña
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ingresala dos veces para confirmar.
        </p>
      </div>

      {/* Separador */}
      <div className="h-px w-full bg-border" />

      <div className="flex flex-col gap-4">
        {serverError && (
          <div
            role="alert"
            className="flex flex-col items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <span>{serverError}</span>
            <Link href="/olvide-contrasena" className="text-xs font-medium underline underline-offset-2">
              Pedir un link nuevo
            </Link>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" autoFocus {...field} />
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
              {isSubmitting ? "Guardando..." : "Restablecer contraseña"}
            </Button>
          </form>
        </Form>
      </div>

    </div>
  )
}
