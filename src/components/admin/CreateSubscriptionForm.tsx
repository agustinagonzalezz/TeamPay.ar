"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  createSubscriptionSchema,
  type CreateSubscriptionInput,
  PLAN_VALUES,
  SUBSCRIPTION_STATUS_VALUES,
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

const STATUS_LABELS: Record<(typeof SUBSCRIPTION_STATUS_VALUES)[number], string> = {
  TRIALING: "En trial",
  ACTIVE: "Activo",
  PAST_DUE: "Pago vencido",
  SUSPENDED: "Suspendido",
  CANCELED: "Cancelado",
}

interface CreateSubscriptionFormProps {
  teamId: string
}

export function CreateSubscriptionForm({ teamId }: CreateSubscriptionFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateSubscriptionInput>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      plan: "TRIAL",
      status: "TRIALING",
      trialEndsAt: "",
      currentPeriodEnd: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      billingName: "",
      billingTaxId: "",
      billingEmail: "",
      notes: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: CreateSubscriptionInput) {
    setServerError(null)
    try {
      const res = await fetch(`/api/admin/equipos/${teamId}/subscription`, {
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
          for (const [field, msgs] of Object.entries(data.fieldErrors)) {
            form.setError(field as keyof CreateSubscriptionInput, { message: msgs[0] })
          }
          return
        }
        setServerError(data.error ?? "No se pudo crear la suscripción.")
        return
      }

      toast.success("Suscripción creada.")
      router.refresh()
    } catch {
      setServerError("No se pudo conectar con el servidor.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar suscripción</CardTitle>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado inicial</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBSCRIPTION_STATUS_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {STATUS_LABELS[value]}
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
                name="trialEndsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin del trial</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentPeriodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin del período actual</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                {isSubmitting ? "Creando..." : "Crear suscripción"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
