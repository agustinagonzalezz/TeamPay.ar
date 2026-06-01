"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Plus, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { createEventoSchema, type CreateEventoInput, EVENT_TYPE_LABELS } from "@/lib/validations/evento"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, cn } from "@/lib/utils"

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface CostItem {
  id: string
  concepto: string
  monto: number
}

interface EditarEventoFormProps {
  equipoId: string
  eventoId: string
  playerCount: number
  defaults: CreateEventoInput
  defaultItems?: { nombre: string; monto: number }[]
}

// ── Componente ────────────────────────────────────────────────────────────────

export function EditarEventoForm({ equipoId, eventoId, playerCount, defaults, defaultItems }: EditarEventoFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Estado del desglose ───────────────────────────────────────────────────
  const [items, setItems] = useState<CostItem[]>(
    defaultItems?.map((item, idx) => ({ id: String(idx), concepto: item.nombre, monto: item.monto })) ?? []
  )
  const [showBreakdown, setShowBreakdown] = useState(!!(defaultItems && defaultItems.length > 0))
  const [newConcepto, setNewConcepto] = useState("")
  const [newMonto, setNewMonto] = useState("")
  const [itemError, setItemError] = useState<string | null>(null)
  const conceptoRef = useRef<HTMLInputElement>(null)

  // ── Formulario principal ──────────────────────────────────────────────────
  const form = useForm<CreateEventoInput>({
    resolver: zodResolver(createEventoSchema),
    defaultValues: defaults,
  })
  const { isSubmitting } = form.formState
  const totalAmount = useWatch({ control: form.control, name: "totalAmount" })
  const amountPerPlayer = playerCount > 0 && totalAmount > 0 ? Math.round(totalAmount / playerCount) : null

  // Sincronizar suma de ítems → campo totalAmount
  useEffect(() => {
    if (items.length > 0) {
      const sum = items.reduce((acc, item) => acc + item.monto, 0)
      form.setValue("totalAmount", sum, { shouldValidate: true })
    }
  }, [items, form])

  const itemsTotal = items.reduce((acc, item) => acc + item.monto, 0)
  const totalIsFromItems = items.length > 0

  // ── Agregar ítem al desglose ──────────────────────────────────────────────
  function handleAddItem() {
    setItemError(null)
    const monto = Number(newMonto)
    if (!newConcepto.trim()) { setItemError("Ingresá el concepto"); return }
    if (!monto || monto <= 0) { setItemError("El monto debe ser mayor a 0"); return }

    setItems((prev) => [...prev, { id: crypto.randomUUID(), concepto: newConcepto.trim(), monto }])
    setNewConcepto("")
    setNewMonto("")
    conceptoRef.current?.focus()
  }

  function handleRemoveItem(id: string) {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    if (updated.length === 0) {
      form.setValue("totalAmount", defaults.totalAmount, { shouldValidate: false })
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function onSubmit(values: CreateEventoInput) {
    setServerError(null)
    try {
      const payload = {
        ...values,
        // Siempre enviamos conceptos para que el server reemplace la lista ([] borra todos)
        conceptos: items.map((item) => ({ nombre: item.concepto, monto: item.monto })),
      }
      const res = await fetch(`/api/equipos/${equipoId}/eventos/${eventoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // ── Eliminar evento ───────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/equipos/${equipoId}/eventos/${eventoId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-3")}
        >
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

            {/* Nombre */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl><Input autoFocus {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Tipo */}
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

            {/* ── Desglose de costos ─────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowBreakdown((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                {showBreakdown ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                Desglosar costos por concepto
                {items.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                    {items.length}
                  </span>
                )}
              </button>

              {showBreakdown && (
                <Card size="sm" className="overflow-hidden">
                  <CardContent className="flex flex-col gap-3 pt-3">

                    {/* Fila para agregar ítem */}
                    <div className="flex gap-2">
                      <input
                        ref={conceptoRef}
                        type="text"
                        placeholder="Concepto (ej: Entrenadores)"
                        value={newConcepto}
                        onChange={(e) => setNewConcepto(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddItem())}
                        className={cn(
                          "h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none",
                          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        )}
                      />
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="0"
                          value={newMonto}
                          onChange={(e) => setNewMonto(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddItem())}
                          className={cn(
                            "h-8 w-28 rounded-lg border border-input bg-transparent pl-5 pr-2 text-sm outline-none",
                            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          )}
                        />
                      </div>
                      <Button type="button" size="icon-sm" onClick={handleAddItem} title="Agregar ítem">
                        <Plus className="size-4" />
                      </Button>
                    </div>

                    {itemError && <p className="text-xs text-destructive">{itemError}</p>}

                    {/* Lista de ítems */}
                    {items.length > 0 && (
                      <ul className="divide-y rounded-lg border">
                        {items.map((item) => (
                          <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2">
                            <span className="flex-1 text-sm">{item.concepto}</span>
                            <span className="text-sm font-medium tabular-nums">{formatCurrency(item.monto)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={`Eliminar ${item.concepto}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </li>
                        ))}
                        <li className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2">
                          <span className="text-sm font-semibold">Total</span>
                          <span className="text-sm font-bold tabular-nums">{formatCurrency(itemsTotal)}</span>
                        </li>
                      </ul>
                    )}

                    {items.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-2">
                        Agregá conceptos para calcular el total automáticamente
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Monto total */}
            <FormField control={form.control} name="totalAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Monto total *
                  {totalIsFromItems && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(calculado del desglose)</span>
                  )}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      className={cn("pl-6", totalIsFromItems && "bg-muted/40 cursor-default")}
                      readOnly={totalIsFromItems}
                      {...field}
                      value={totalIsFromItems ? itemsTotal : (field.value || "")}
                      onChange={totalIsFromItems ? undefined : (e) =>
                        field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Preview: monto por jugadora */}
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

            {/* Fecha */}
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

      {/* ── Zona de peligro ───────────────────────────────────────────────── */}
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
