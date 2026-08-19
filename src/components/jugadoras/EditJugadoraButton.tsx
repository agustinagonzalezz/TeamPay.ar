"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Loader2 } from "lucide-react"
import { updateJugadoraSchema, type UpdateJugadoraInput } from "@/lib/validations/jugadora"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
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

interface EditJugadoraButtonProps {
  equipoId: string
  jugadoraId: string
  nombreActual: string
  phoneActual: string | null
  positionActual: string | null
  shirtNumberActual: number | null
}

export function EditJugadoraButton({
  equipoId,
  jugadoraId,
  nombreActual,
  phoneActual,
  positionActual,
  shirtNumberActual,
}: EditJugadoraButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const valoresActuales: UpdateJugadoraInput = {
    name: nombreActual,
    phone: phoneActual,
    position: positionActual,
    shirtNumber: shirtNumberActual,
  }

  const form = useForm<UpdateJugadoraInput>({
    resolver: zodResolver(updateJugadoraSchema),
    defaultValues: valoresActuales,
  })

  const { isSubmitting } = form.formState

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (value) {
      setServerError(null)
      form.reset(valoresActuales)
    }
  }

  async function onSubmit(values: UpdateJugadoraInput) {
    setServerError(null)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/jugadoras/${jugadoraId}`, {
        method: "PATCH",
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
            form.setError(field as keyof UpdateJugadoraInput, { message: messages[0] })
          }
          return
        }
        setServerError(data.error ?? "No se pudo guardar los cambios.")
        return
      }

      setOpen(false)
      router.refresh()
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="rounded p-1 text-muted-foreground/50 transition-colors hover:text-primary"
        title="Editar jugadora"
        aria-label={`Editar ${nombreActual}`}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar jugadora</DialogTitle>
        </DialogHeader>

        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
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
                <FormItem>
                  <FormLabel>Número de camiseta</FormLabel>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
