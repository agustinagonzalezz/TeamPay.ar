/**
 * app/page.tsx — Raíz de la aplicación
 *
 * El proxy (src/proxy.ts) ya redirige a /login si el usuario no está autenticado.
 * Si llegó acá, está autenticado → redirigir al listado de equipos.
 */

import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/equipos")
}
