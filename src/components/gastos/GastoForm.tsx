"use client"

/**
 * src/components/gastos/GastoForm.tsx
 *
 * Formulario para registrar un nuevo gasto del equipo.
 * Solo visible para la capitana.
 *
 * Al crear con éxito llama router.refresh() para que el Server Component
 * vuelva a cargar la lista actualizada.
 */

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import {
  createGastoSchema,
  type CreateGastoInput,
} from "@/lib/validations/gasto"
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
import { cn } from "@/lib/utils"

// ── Helper ────────────────────────────────────────────────────────────────────

function todayString() {
  return new Date().toISOString().split("T")[0]
}

// ── Componente ────────────────────────────────────────────────────────────────

interface GastoFormProps {
  equipoId: string
}

export function GastoForm({ equipoId }: GastoFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateGastoInput>({
    resolver: zodResolver(createGastoSchema),
    defaultValues: {
      concept: "",
      amount: 0,
      paidTo: "",
      paidAt: todayString(),
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: CreateGastoInput) {
    setServerError(null)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/gastos`, {
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
            form.setError(field as keyof CreateGastoInput, {
              message: messages[0],
            })
          }
          return
        }
        setServerError(data.error ?? "Ocurrió un error. Intentá de nuevo.")
        return
      }

      // Limpiar el formulario y refrescar la lista
      form.reset({ concept: "", amount: 0, paidTo: "", paidAt: todayString() })
      router.refresh()
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Concepto */}
          <FormField
            control={form.control}
            name="concept"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Concepto *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Alquiler de cancha"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fila: Monto + A quién */}
          <div className="flex gap-3">
            {/* Monto */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Monto *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="0"
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha */}
            <FormField
              control={form.control}
              name="paidAt"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* A quién se pagó */}
          <FormField
            control={form.control}
            name="paidTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pagado a *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Profe Martín / Club Atlético"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Guardando..." : "Registrar gasto"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
