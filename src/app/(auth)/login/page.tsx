import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { CredentialsLoginForm } from "@/components/auth/CredentialsLoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión — TeamPayment.app",
  description: "Ingresá a tu equipo",
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "Este email ya está registrado con otro método.",
  AccessDenied: "Acceso denegado.",
  OAuthSignInError: "Error al conectar con Google. Intentá de nuevo.",
  OAuthCallbackError: "Error en la respuesta de Google. Intentá de nuevo.",
  SessionRequired: "Necesitás iniciar sesión para acceder.",
  Configuration: "Error de configuración. Contactá al administrador.",
  CredentialsSignin: "Email o contraseña incorrectos, o todavía no verificaste tu cuenta.",
  Default: "Ocurrió un error. Intentá de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; reset?: string }>;
}) {
  const { callbackUrl, error, reset } = await searchParams;
  const errorMessage = error
    ? (AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default)
    : null;
  const redirectTo = callbackUrl ?? "/";

  async function credentialsSignInAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=${err.type}`);
      }
      throw err;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-10" style={{ fontFamily: "var(--font-syne)" }}>

      {/* Logotipo */}
      <div>
        <div
          className="mb-6 inline-flex size-10 items-center justify-center rounded-lg text-xs font-bold tracking-tight"
          style={{ background: "oklch(0.52 0.22 285)", color: "oklch(0.99 0 0)" }}
        >
          TP
        </div>
        <h1
          className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground"
        >
          Finanzas<br />de equipo,<br />sin drama.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Cuotas, eventos y gastos de tu equipo<br />de fútbol en un solo lugar.
        </p>
      </div>

      {/* Separador */}
      <div className="h-px w-full bg-border" />

      {/* Sign in */}
      <div className="flex flex-col gap-4">
        {reset === "1" && !errorMessage && (
          <div
            role="status"
            className="rounded-lg border border-primary/30 bg-primary/8 px-3 py-2.5 text-sm text-primary"
          >
            Contraseña actualizada. Ya podés iniciar sesión.
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all duration-150 hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GoogleIcon className="size-4.5 shrink-0" />
            Iniciar sesión con Google
          </button>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Login con email y contraseña */}
        <CredentialsLoginForm action={credentialsSignInAction} errorMessage={errorMessage} />

        <p className="text-center text-sm">
          <Link href="/olvide-contrasena" className="font-medium text-muted-foreground hover:text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="font-medium text-primary hover:underline">
            Crear cuenta
          </Link>
        </p>

        <p className="text-center text-[11px] text-muted-foreground/70">
          Al continuar aceptás el uso de tus datos para gestionar<br />los pagos de tu equipo.
        </p>
      </div>

    </div>
  );
}
