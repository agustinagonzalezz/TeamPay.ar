"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { updateTeamSchema, type UpdateTeamInput } from "@/lib/validations/team"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LogoUploader } from "./LogoUploader"

interface EditarEquipoFormProps {
  equipoId: string
  nombre: string
  descripcion: string
  logoUrl: string | null
}

export function EditarEquipoForm({ equipoId, nombre, descripcion, logoUrl }: EditarEquipoFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<UpdateTeamInput>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: { name: nombre, description: descripcion },
  })
  const { isSubmitting } = form.formState

  async function onSubmit(values: UpdateTeamInput) {
    setServerError(null)
    try {
      const res = await fetch(`/api/equipos/${equipoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json() as { success: boolean; error?: string; fieldErrors?: Record<string, string[]> }
      if (!res.ok || !data.success) {
        if (data.fieldErrors) {
          for (const [field, msgs] of Object.entries(data.fieldErrors)) {
            form.setError(field as keyof UpdateTeamInput, { message: msgs[0] })
          }
          return
        }
        setServerError(data.error ?? "Ocurrió un error.")
        return
      }
      router.push(`/equipos/${equipoId}`)
      router.refresh()
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Segura que querés eliminar el equipo "${nombre}"? Esta acción no se puede deshacer y se borrarán todos los eventos, pagos y gastos asociados.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/equipos/${equipoId}`, { method: "DELETE" })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) { alert(data.error ?? "No se pudo eliminar el equipo."); return }
      router.push("/equipos")
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
        <Link href={`/equipos/${equipoId}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-3")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al equipo
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar equipo</h1>
      </div>

      <div className="max-w-lg">
        {serverError && (
          <div role="alert" className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Logo uploader (RF-10) */}
        <div className="mb-6 pb-6 border-b">
          <h2 className="text-sm font-semibold mb-3">Logo del equipo</h2>
          <LogoUploader equipoId={equipoId} equipoName={nombre} logoUrl={logoUrl} />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del equipo *</FormLabel>
                <FormControl><Input autoFocus {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl><Textarea rows={3} placeholder="Opcional" {...field} /></FormControl>
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

      <div className="max-w-lg rounded-xl border border-destructive/30 p-5">
        <h2 className="text-sm font-semibold text-destructive">Zona peligrosa</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Eliminar el equipo borrará permanentemente todos sus eventos, pagos y gastos.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {deleting ? "Eliminando..." : "Eliminar equipo"}
        </Button>
      </div>
    </div>
  )
}
