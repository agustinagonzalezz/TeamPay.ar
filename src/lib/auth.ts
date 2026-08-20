/**
 * src/lib/auth.ts — Configuración COMPLETA de Auth.js v5 (Node.js runtime)
 *
 * ⚠️  Este archivo SÓLO debe importarse desde:
 *       • Server Components / Server Actions  (Node.js)
 *       • app/api/auth/[...nextauth]/route.ts (Node.js)
 *     NO importar desde proxy.ts (Edge Runtime).
 *
 * Extiende authConfig con:
 *   • Google OAuth provider
 *   • PrismaAdapter para persistencia de User y Account
 *   • JWT strategy: las sesiones viven en un cookie firmado (no en la DB)
 *       → permite verificarlas en Edge sin consultar Postgres
 *   • Callbacks jwt + session para incluir id y role en el token/sesión
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { UserRole } from "@/generated/prisma/client";

// ── Augmentación de tipos ─────────────────────────────────────────────────────
//
// Extiende los tipos de NextAuth para incluir id y role en Session y JWT.
// Sin esto, TypeScript no conoce estos campos extra.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

// next-auth/jwt re-exporta desde @auth/core/jwt — augmentar el módulo correcto
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

// Hash dummy fijo usado para mitigar timing attacks en authorize(): cuando el
// email no existe (o la cuenta no tiene password), igual corremos un bcrypt.compare()
// contra este hash para que el tiempo de respuesta no delate si la cuenta existe.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password", 12);

// ── Instancia principal ───────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // El adapter persiste User y Account en Postgres.
  // Con strategy "jwt", NO persiste Session (no usa la tabla Session).
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    // Login con email y contraseña. La cuenta debe existir, tener contraseña
    // (no ser una cuenta de Google) y tener el email verificado.
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password || !user.emailVerified) {
          // Sin esto, esta rama respondería más rápido que la de contraseña
          // incorrecta y filtraría por timing si el email existe o no.
          await bcrypt.compare(parsed.data.password, DUMMY_PASSWORD_HASH);
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],

  // JWT strategy: la sesión se guarda en un cookie firmado con AUTH_SECRET.
  // Esto permite que proxy.ts verifique la sesión en Edge sin tocar Prisma.
  session: { strategy: "jwt" },

  callbacks: {
    ...authConfig.callbacks,

    /**
     * Ejecutado al crear o refrescar el JWT.
     * `user` sólo está disponible en el primer sign-in.
     */
    async jwt({ token, user }) {
      if (user) {
        // user.id es siempre string cuando viene de PrismaAdapter (es el PK)
        // Auth.js lo tipea como string | undefined por compatibilidad general
        token.id = user.id!;
        token.role = user.role;
        return token;
      }

      // Esta app no usa SessionProvider/useSession del lado del cliente — toda
      // la sesión se lee server-side vía auth(). Sin este refresh, token.name/
      // token.picture quedarían congelados con los valores del login inicial:
      // editar el nombre o subir una foto de perfil no se vería reflejado
      // hasta cerrar sesión y volver a entrar.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true, image: true, role: true },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    /**
     * Ejecutado al leer la sesión (en Server Components con auth()).
     * Mapea los claims del JWT a session.user.
     */
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Retorna el usuario autenticado desde la sesión JWT actual.
 * Para usar en Server Components y Server Actions.
 *
 * @example
 * // En un Server Component:
 * const user = await getCurrentUser()
 * if (!user) redirect("/login")
 *
 * // En un Server Action (verificar capitana):
 * const user = await getCurrentUser()
 * if (!user || user.role !== "CAPITANA") {
 *   return { success: false, error: "No autorizado" }
 * }
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
