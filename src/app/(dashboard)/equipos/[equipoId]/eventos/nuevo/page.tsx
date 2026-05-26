"use client"

/**
 * app/(dashboard)/equipos/[equipoId]/eventos/nuevo/page.tsx
 *
 * Formulario para crear un nuevo evento.
 * Client Component: usa react-hook-form + zodResolver + fetch a POST /api/equipos/[id]/eventos.
 */

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  createEventoSchema,
  type CreateEventoInput,
  EVENT_TYPE_LABELS,
} from "@/lib/validations/evento"
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
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fecha de hoy en formato YYYY-MM-DD para el valor mínimo del date input */
function todayString() {
  return new Date().toISOString().split("T")[0]
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function NuevoEventoPage({
  params,
}: {
  params: Promise<{ equipoId: string }>
}) {
  const { equipoId } = use(params)
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateEventoInput>({
    resolver: zodResolver(createEventoSchema),
    defaultValues: {
      name: "",
      type: "CUOTA",
      amountPerPlayer: 0,
      dueDate: todayString(),
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: CreateEventoInput) {
    setServerError(null)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/eventos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = (await res.json()) as {
        success: boolean
        error?: string
        fieldErrors?: Record<string, string[]>
        data?: { id: string }
      }

      if (!res.ok || !data.success) {
        if (data.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors)) {
            form.setError(field as keyof CreateEventoInput, { message: messages[0] })
          }
          return
        }
        setServerError(data.error ?? "Ocurrió un error. Intentá de nuevo.")
        return
      }

      // Redirigir al detalle del evento recién creado
      router.push(`/equipos/${equipoId}/eventos/${data.data!.id}`)
      router.refresh()
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <Link
          href={`/equipos/${equipoId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-3")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al equipo
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo evento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Se crearán automáticamente los registros de pago para todas las jugadoras activas.
        </p>
      </div>

      {/* ── Formulario ───────────────────────────────────────────────────── */}
      <div className="max-w-lg">
        {serverError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del evento *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Cuota junio 2026"
                      autoComplete="off"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <FormControl>
                    <select
                      className={cn(
                        "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm",
                        "outline-none transition-colors",
                        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                      {...field}
                    >
                      {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monto por jugadora */}
            <FormField
              control={form.control}
              name="amountPerPlayer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto por jugadora *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="5000"
                        className="pl-6"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>En pesos argentinos</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha de vencimiento */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de vencimiento *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={todayString()}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Acciones */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {isSubmitting ? "Creando..." : "Crear evento"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => router.push(`/equipos/${equipoId}`)}
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
