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

// Rutas públicas por prefijo (startsWith)
const PUBLIC_PREFIXES = ["/login", "/registro", "/verificar-email"];
// Rutas públicas por coincidencia exacta
const PUBLIC_EXACT = ["/"];

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [],

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isLoginPath = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
      const isPublicPath = isLoginPath || PUBLIC_EXACT.includes(pathname);

      // Usuario autenticado en /login → redirigir al dashboard
      if (isLoggedIn && isLoginPath) {
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
