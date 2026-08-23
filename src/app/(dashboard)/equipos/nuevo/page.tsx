"use client"

/**
 * app/(dashboard)/equipos/nuevo/page.tsx — Formulario para crear un equipo
 *
 * Client Component que usa:
 *   • react-hook-form para el estado del formulario
 *   • zodResolver para validación con el schema de Zod
 *   • shadcn Form components para accesibilidad e integración visual
 *   • Fetch a POST /api/teams para persistir
 *
 * En caso de éxito redirige a /equipos.
 * Los errores de servidor se muestran sobre el formulario.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

import { createTeamSchema, type CreateTeamInput } from "@/lib/validations/team"
import { getContrastForeground } from "@/lib/color"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Aproximación hex del violeta default (oklch(0.52 0.22 285) en globals.css) —
// solo se usa como color inicial de los inputs nativos cuando no hay override.
const DEFAULT_PRIMARY_HEX = "#7c3aed"
const DEFAULT_SECONDARY_HEX = "#e4defa"

// ── Componente ────────────────────────────────────────────────────────────────

export default function NuevoEquipoPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      primaryColor: "",
      secondaryColor: "",
    },
  })

  const { isSubmitting } = form.formState

  const watchedPrimary = useWatch({ control: form.control, name: "primaryColor" })
  const watchedSecondary = useWatch({ control: form.control, name: "secondaryColor" })
  const previewPrimary = watchedPrimary || DEFAULT_PRIMARY_HEX
  const previewSecondary = watchedSecondary || DEFAULT_SECONDARY_HEX

  // ── Submit handler ─────────────────────────────────────────────────────────
  async function onSubmit(values: CreateTeamInput) {
    setServerError(null)

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = (await response.json()) as {
        success: boolean
        error?: string
        fieldErrors?: Record<string, string[]>
      }

      if (!response.ok || !data.success) {
        // Errores de campo del servidor → mapear a react-hook-form
        if (data.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors)) {
            form.setError(field as keyof CreateTeamInput, {
              message: messages[0],
            })
          }
          return
        }
        setServerError(data.error ?? "Ocurrió un error. Intentá de nuevo.")
        return
      }

      // Éxito → redirigir al listado
      router.push("/equipos")
      router.refresh() // Invalida el cache del Server Component
    } catch {
      setServerError("No se pudo conectar con el servidor. Intentá de nuevo.")
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <Link
          href="/equipos"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-2")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a mis equipos
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Crear equipo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completá los datos de tu nuevo equipo
        </p>
      </div>

      {/* ── Formulario ───────────────────────────────────────────────────── */}
      <div className="max-w-lg">
        {/* Error global del servidor */}
        {serverError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* ── Nombre ──────────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del equipo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Las Pibas FC"
                      autoComplete="off"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Entre 3 y 50 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Descripción ─────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opcional — contá algo sobre el equipo"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Hasta 200 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Colores del equipo ──────────────────────────────────── */}
            <div className="flex flex-col gap-3 rounded-xl border px-4 py-4">
              <h2 className="text-sm font-semibold">Colores del equipo</h2>
              <p className="text-xs text-muted-foreground -mt-2">
                Opcional — si no elegís nada, se usa el violeta default de la app.
              </p>

              <div className="flex flex-wrap gap-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color principal</FormLabel>
                      <FormControl>
                        <input
                          type="color"
                          value={field.value || DEFAULT_PRIMARY_HEX}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-9 w-16 cursor-pointer rounded-md border border-input bg-transparent p-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color secundario</FormLabel>
                      <FormControl>
                        <input
                          type="color"
                          value={field.value || DEFAULT_SECONDARY_HEX}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-9 w-16 cursor-pointer rounded-md border border-input bg-transparent p-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Vista previa */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Vista previa:</span>
                <span
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: previewPrimary, color: getContrastForeground(previewPrimary) }}
                >
                  Botón principal
                </span>
                <span
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: previewSecondary, color: getContrastForeground(previewSecondary) }}
                >
                  Secundario
                </span>
              </div>
            </div>

            {/* ── Acciones ────────────────────────────────────────────── */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {isSubmitting ? "Creando..." : "Crear equipo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => router.push("/equipos")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
