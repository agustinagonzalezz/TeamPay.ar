"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  updateSubscriptionInfoSchema,
  type UpdateSubscriptionInfoInput,
  PLAN_VALUES,
} from "@/lib/validations/subscription"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PLAN_LABELS: Record<(typeof PLAN_VALUES)[number], string> = {
  TRIAL: "Trial",
  BASIC: "Basic",
  PRO: "Pro",
}

interface EditSubscriptionInfoFormProps {
  teamId: string
  plan: (typeof PLAN_VALUES)[number]
  priceArs: number | null
  contactName: string
  contactEmail: string
  contactPhone: string | null
  billingName: string | null
  billingTaxId: string | null
  billingEmail: string | null
  notes: string | null
}

export function EditSubscriptionInfoForm({
  teamId,
  plan,
  priceArs,
  contactName,
  contactEmail,
  contactPhone,
  billingName,
  billingTaxId,
  billingEmail,
  notes,
}: EditSubscriptionInfoFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<UpdateSubscriptionInfoInput>({
    resolver: zodResolver(updateSubscriptionInfoSchema),
    defaultValues: {
      plan,
      priceArs,
      contactName,
      contactEmail,
      contactPhone: contactPhone ?? "",
      billingName: billingName ?? "",
      billingTaxId: billingTaxId ?? "",
      billingEmail: billingEmail ?? "",
      notes: notes ?? "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: UpdateSubscriptionInfoInput) {
    setServerError(null)
    try {
      const res = await fetch(`/api/admin/equipos/${teamId}/subscription`, {
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
          for (const [field, msgs] of Object.entries(data.fieldErrors)) {
            form.setError(field as keyof UpdateSubscriptionInfoInput, { message: msgs[0] })
          }
          return
        }
        setServerError(data.error ?? "No se pudo guardar.")
        return
      }

      toast.success("Datos guardados.")
      router.refresh()
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacto y facturación</CardTitle>
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {PLAN_LABELS[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceArs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio mensual (ARS)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Opcional"
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

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold">Contacto</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl><Input autoComplete="off" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl><Input type="email" autoComplete="off" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl><Input autoComplete="off" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold">Facturación</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="billingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón social</FormLabel>
                      <FormControl><Input autoComplete="off" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingTaxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CUIT/CUIL</FormLabel>
                      <FormControl><Input autoComplete="off" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de facturación</FormLabel>
                      <FormControl><Input type="email" autoComplete="off" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
