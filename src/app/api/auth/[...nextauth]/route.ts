/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * Catch-all route que delega todos los requests de Auth.js.
 * Maneja: /api/auth/signin, /api/auth/callback/google,
 *         /api/auth/signout, /api/auth/session, /api/auth/csrf, etc.
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
