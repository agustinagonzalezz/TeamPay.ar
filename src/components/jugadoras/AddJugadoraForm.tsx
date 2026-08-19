"use client"

/**
 * Formulario inline para agregar una jugadora al equipo.
 * Se muestra solo si el usuario es la capitana.
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { addJugadoraSchema, type AddJugadoraInput } from "@/lib/validations/jugadora"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AddJugadoraFormProps {
  equipoId: string
}

export function AddJugadoraForm({ equipoId }: AddJugadoraFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showOpcionales, setShowOpcionales] = useState(false)

  const form = useForm<AddJugadoraInput>({
    resolver: zodResolver(addJugadoraSchema),
    defaultValues: { name: "", phone: "", position: "", shirtNumber: null },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: AddJugadoraInput) {
    setServerError(null)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/jugadoras`, {
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
            form.setError(field as keyof AddJugadoraInput, { message: messages[0] })
          }
          return
        }
        setServerError(data.error ?? "Ocurrió un error.")
        return
      }

      form.reset({ name: "", phone: "", position: "", shirtNumber: null })
      setShowOpcionales(false)
      router.refresh() // Refresca el Server Component con la lista actualizada
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4" aria-hidden="true" />
          Agregar jugadora
        </CardTitle>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <div className="flex items-end gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Nombre de la jugadora</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de la jugadora"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} size="default">
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <UserPlus className="size-4" aria-hidden="true" />
                )}
                {isSubmitting ? "Agregando..." : "Agregar"}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setShowOpcionales((v) => !v)}
              className="flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {showOpcionales ? (
                <ChevronUp className="size-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden="true" />
              )}
              Agregar datos opcionales
            </button>

            {showOpcionales && (
              <div className="flex flex-col gap-3 rounded-lg border border-dashed px-3 py-3 sm:flex-row">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 11 5555-5555"
                          autoComplete="off"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Posición</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Delantera"
                          autoComplete="off"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shirtNumber"
                  render={({ field }) => (
                    <FormItem className="sm:w-28">
                      <FormLabel>Camiseta</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="99"
                          step="1"
                          placeholder="Ej: 10"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
