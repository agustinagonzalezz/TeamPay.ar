"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Trash2, RotateCcw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { updateTeamSchema, type UpdateTeamInput } from "@/lib/validations/team"
import { getContrastForeground } from "@/lib/color"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { LogoUploader } from "./LogoUploader"

// Aproximación hex del violeta default (oklch(0.52 0.22 285) en globals.css) —
// solo se usa como color inicial de los inputs nativos cuando no hay override.
const DEFAULT_PRIMARY_HEX = "#7c3aed"
const DEFAULT_SECONDARY_HEX = "#e4defa"

interface EditarEquipoFormProps {
  equipoId: string
  nombre: string
  descripcion: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
}

export function EditarEquipoForm({
  equipoId,
  nombre,
  descripcion,
  logoUrl,
  primaryColor,
  secondaryColor,
}: EditarEquipoFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<UpdateTeamInput>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      name: nombre,
      description: descripcion,
      primaryColor: primaryColor ?? "",
      secondaryColor: secondaryColor ?? "",
    },
  })
  const { isSubmitting } = form.formState

  const watchedPrimary = useWatch({ control: form.control, name: "primaryColor" })
  const watchedSecondary = useWatch({ control: form.control, name: "secondaryColor" })
  const previewPrimary = watchedPrimary || DEFAULT_PRIMARY_HEX
  const previewSecondary = watchedSecondary || DEFAULT_SECONDARY_HEX

  function handleResetColores() {
    form.setValue("primaryColor", "", { shouldDirty: true })
    form.setValue("secondaryColor", "", { shouldDirty: true })
  }

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
    setDeleting(true)
    try {
      const res = await fetch(`/api/equipos/${equipoId}`, { method: "DELETE" })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "No se pudo eliminar el equipo.")
        return
      }
      setDeleteOpen(false)
      router.push("/equipos")
      router.refresh()
    } catch {
      toast.error("No se pudo conectar con el servidor.")
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

            {/* Colores del equipo */}
            <div className="flex flex-col gap-3 rounded-xl border px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Colores del equipo</h2>
                <button
                  type="button"
                  onClick={handleResetColores}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Restablecer al color default
                </button>
              </div>

              <div className="flex flex-wrap gap-4">
                <FormField control={form.control} name="primaryColor" render={({ field }) => (
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
                )} />

                <FormField control={form.control} name="secondaryColor" render={({ field }) => (
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
                )} />
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
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10"
                disabled={deleting}
              />
            }
          >
            <Trash2 className="size-4" />
            Eliminar equipo
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar el equipo &quot;{nombre}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer y se borrarán todos los eventos, pagos y gastos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {deleting ? "Eliminando..." : "Eliminar equipo"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
