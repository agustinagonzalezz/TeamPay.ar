"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { createEventoSchema, type CreateEventoInput, EVENT_TYPE_LABELS } from "@/lib/validations/evento"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatCurrency, cn } from "@/lib/utils"

interface EditarEventoFormProps {
  equipoId: string
  eventoId: string
  playerCount: number
  defaults: CreateEventoInput
}

function EditarEventoForm({ equipoId, eventoId, playerCount, defaults }: EditarEventoFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<CreateEventoInput>({
    resolver: zodResolver(createEventoSchema),
    defaultValues: defaults,
  })
  const { isSubmitting } = form.formState
  const totalAmount = useWatch({ control: form.control, name: "totalAmount" })
  const amountPerPlayer = playerCount > 0 && totalAmount > 0 ? Math.round(totalAmount / playerCount) : null

  async function onSubmit(values: CreateEventoInput) {
    setServerError(null)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/eventos/${eventoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json() as { success: boolean; error?: string; fieldErrors?: Record<string, string[]> }
      if (!res.ok || !data.success) {
        if (data.fieldErrors) {
          for (const [field, msgs] of Object.entries(data.fieldErrors)) {
            form.setError(field as keyof CreateEventoInput, { message: msgs[0] })
          }
          return
        }
        setServerError(data.error ?? "Ocurrió un error.")
        return
      }
      router.push(`/equipos/${equipoId}/eventos/${eventoId}`)
      router.refresh()
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  async function handleDelete() {
    if (!confirm("¿Segura que querés eliminar este evento? Solo se puede si no tiene pagos registrados.")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/eventos/${eventoId}`, { method: "DELETE" })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) { alert(data.error ?? "No se pudo eliminar."); return }
      router.push(`/equipos/${equipoId}`)
      router.refresh()
    } catch {
      alert("No se pudo conectar con el servidor.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/equipos/${equipoId}/eventos/${eventoId}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-3")}>
          <ArrowLeft className="size-4" />
          Volver al evento
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar evento</h1>
      </div>

      <div className="max-w-lg">
        {serverError && (
          <div role="alert" className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl><Input autoFocus {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <FormControl>
                  <select
                    className={cn("h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50")}
                    {...field}
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="totalAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>Monto total *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number" min="1" step="1" className="pl-6"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Preview monto por jugadora */}
            <div className={cn("rounded-xl border px-4 py-3 text-sm", amountPerPlayer ? "border-primary/20 bg-primary/5" : "border-border bg-muted/40")}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4 shrink-0" />
                  <span>{playerCount} jugadoras activas</span>
                </div>
                {amountPerPlayer ? (
                  <span className="font-semibold">{formatCurrency(amountPerPlayer)} / jugadora</span>
                ) : (
                  <span className="text-muted-foreground italic">Ingresá el monto</span>
                )}
              </div>
            </div>

            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de vencimiento *</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Eliminar evento */}
      <div className="max-w-lg rounded-xl border border-destructive/30 p-5">
        <h2 className="text-sm font-semibold text-destructive">Eliminar evento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo se puede eliminar si el evento no tiene pagos registrados.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {deleting ? "Eliminando..." : "Eliminar evento"}
        </Button>
      </div>
    </div>
  )
}

// ── Server Component wrapper ──────────────────────────────────────────────────

import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getEventoById, checkIsCapitana } from "@/services/eventoService"
import { getJugadorasByTeam } from "@/services/jugadoraService"

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ equipoId: string; eventoId: string }>
}) {
  const { equipoId, eventoId } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [isCapitana, eventoResult, jugadorasResult] = await Promise.all([
    checkIsCapitana(equipoId, user.id),
    getEventoById(eventoId, equipoId, user.id),
    getJugadorasByTeam(equipoId, user.id),
  ])

  if (!isCapitana) redirect(`/equipos/${equipoId}`)
  if (!eventoResult.success) notFound()

  const evento = eventoResult.data
  const playerCount = jugadorasResult.success ? jugadorasResult.data.length : 0
  const dueDate = evento.dueDate.toISOString().split("T")[0]

  return (
    <EditarEventoForm
      equipoId={equipoId}
      eventoId={eventoId}
      playerCount={playerCount}
      defaults={{
        name: evento.name,
        type: evento.type,
        totalAmount: Number(evento.amountPerPlayer) * playerCount,
        dueDate,
      }}
    />
  )
}
