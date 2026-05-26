/**
 * app/(auth)/login/page.tsx — Página de inicio de sesión
 *
 * Server Component que:
 *  • Usa un inline Server Action para disparar el flow OAuth de Google
 *  • Lee el callbackUrl del query param para redirigir post-login
 *  • Muestra errores de OAuth (query param ?error=) traducidos al español
 */

import type { Metadata } from "next";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Iniciar sesión — TeamPay.ar",
  description: "Ingresá a tu equipo",
};

// ── Ícono de Google ──────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ── Mensajes de error de OAuth ───────────────────────────────────────────────

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "Este email ya está registrado con otro método. Iniciá sesión con Google directamente.",
  AccessDenied: "Acceso denegado.",
  OAuthSignInError: "Error al conectar con Google. Intentá de nuevo.",
  OAuthCallbackError: "Error en la respuesta de Google. Intentá de nuevo.",
  SessionRequired: "Necesitás iniciar sesión para acceder.",
  Configuration:
    "Error de configuración del servidor. Contactá al administrador.",
  Default: "Ocurrió un error al iniciar sesión. Intentá de nuevo.",
};

// ── Página ───────────────────────────────────────────────────────────────────

export default async function LoginPage({
  searchParams,
}: {
  // En Next.js 15, searchParams es una Promise
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  const errorMessage = error
    ? (AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default)
    : null;

  // Destino tras el login exitoso (default: raíz del dashboard)
  const redirectTo = callbackUrl ?? "/";

  return (
    <Card className="w-full max-w-sm">
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <CardHeader className="items-center gap-2 text-center">
        <div
          className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-3xl"
          aria-hidden="true"
        >
          ⚽
        </div>
        <div>
          <CardTitle className="text-xl font-bold tracking-tight">
            TeamPay.ar
          </CardTitle>
          <CardDescription className="mt-1">
            Gestioná los pagos de tu equipo de fútbol
          </CardDescription>
        </div>
      </CardHeader>

      {/* ── Contenido ──────────────────────────────────────────────── */}
      <CardContent className="flex flex-col gap-4">
        {/* Mensaje de error de OAuth */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}

        {/*
         * Form con Server Action inline.
         * signIn("google") redirige al flow OAuth de Google.
         * redirectTo se pasa como opción para volver al destino original.
         */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full gap-3"
          >
            <GoogleIcon className="size-5 shrink-0" />
            Iniciar sesión con Google
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Al continuar aceptás que tus datos sean usados para gestionar
          los pagos de tu equipo.
        </p>
      </CardContent>
    </Card>
  );
}
