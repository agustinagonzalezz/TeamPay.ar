/**
 * src/lib/auth.config.ts — Configuración BASE de Auth.js (Edge-compatible)
 *
 * ⚠️  Este archivo NO puede importar Prisma, PrismaAdapter ni ningún módulo
 *     que use Node.js APIs (fs, path, url, crypto nativo, etc.).
 *     Es importado por src/proxy.ts que corre en Edge Runtime.
 *
 * Contiene:
 *   • Páginas personalizadas (signIn, error)
 *   • Callback `authorized` → lógica de protección de rutas en el proxy
 *
 * Los providers y el adapter se agregan en auth.ts (Node.js runtime).
 */

import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/"];

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Sin providers aquí: se agregan en auth.ts con el adapter de Prisma
  providers: [],

  callbacks: {
    /**
     * Se ejecuta en el proxy (Edge) para cada request.
     * auth?.user viene del JWT decodificado — sin consulta a la DB.
     * Retorna true (permitir), false (denegar) o Response (redirigir).
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

      // Usuario autenticado en /login → redirigir al dashboard
      if (isLoggedIn && isPublicPath) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Usuario no autenticado en ruta protegida → redirigir a login
      if (!isLoggedIn && !isPublicPath) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
