"use client"

/**
 * Formulario inline para agregar una jugadora al equipo.
 * Se muestra solo si el usuario es la capitana.
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus, Loader2 } from "lucide-react"
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

  const form = useForm<AddJugadoraInput>({
    resolver: zodResolver(addJugadoraSchema),
    defaultValues: { name: "" },
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

      form.reset()
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
            className="flex items-end gap-3"
          >
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
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
