/**
 * src/proxy.ts — Proxy de Next.js 16 (equivalente al middleware de v14/v15)
 *
 * Corre en Edge Runtime en cada request antes de que llegue a la página.
 * Importa SÓLO auth.config.ts (sin Prisma) para mantenerse edge-compatible.
 *
 * La verificación de la sesión usa el JWT del cookie firmado con AUTH_SECRET
 * → no necesita consultar la base de datos.
 *
 * La lógica de redirección vive en authConfig.callbacks.authorized.
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Crea una instancia de Auth.js sólo con la config edge-compatible
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  /*
   * Ejecutar el proxy en todas las rutas EXCEPTO:
   *   /api/*              → rutas de API (Auth.js las maneja internamente)
   *   /_next/static       → assets de Next.js
   *   /_next/image        → optimización de imágenes
   *   /favicon.ico        → favicon
   *   Archivos con extensión (*.png, *.svg, *.css, *.js, etc.)
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)" ],
};
