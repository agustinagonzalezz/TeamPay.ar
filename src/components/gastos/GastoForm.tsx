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
  EXPENSE_CATEGORY_LABELS,
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
      category: "OTRO",
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
      form.reset({ concept: "", amount: 0, paidTo: "", paidAt: todayString(), category: "OTRO" })
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

          {/* Fila: Categoría + A quién */}
          <div className="flex gap-3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Categoría</FormLabel>
                  <FormControl>
                    <select
                      className={cn("h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50")}
                      {...field}
                    >
                      {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paidTo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Pagado a *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Profe Martín" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
