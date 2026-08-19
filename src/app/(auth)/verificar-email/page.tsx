import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"
import { verifyEmail } from "@/services/authService"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Verificar email — TeamPayment.app",
}

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  const result = token
    ? await verifyEmail(token)
    : { success: false as const, error: "El link no es válido o expiró." }

  return (
    <div
      className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center"
      style={{ fontFamily: "var(--font-syne)" }}
    >
      {result.success ? (
        <>
          <div
            className="inline-flex size-12 items-center justify-center rounded-full"
            style={{ background: "oklch(0.52 0.22 285 / 0.1)" }}
          >
            <CheckCircle2 className="size-6" style={{ color: "oklch(0.52 0.22 285)" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">¡Cuenta verificada!</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ya podés iniciar sesión con tu email y contraseña.
            </p>
          </div>
          <Link href="/login" className={cn(buttonVariants({ variant: "default" }))}>
            Iniciar sesión
          </Link>
        </>
      ) : (
        <>
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-6 text-destructive" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Link inválido</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.error}</p>
          </div>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
            Reenviar verificación
          </Link>
        </>
      )}
    </div>
  )
}
