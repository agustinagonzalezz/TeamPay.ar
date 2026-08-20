/**
 * src/app/api/perfil/foto/route.ts
 *
 * POST   /api/perfil/foto — sube/reemplaza la foto de perfil de la usuaria.
 * DELETE /api/perfil/foto — quita la foto propia subida (no aplica a la foto
 *                            de Google, que no gestionamos nosotros).
 *
 * Mismo mecanismo que el logo de equipo (src/app/api/equipos/[equipoId]/logo/route.ts):
 * Vercel Blob + actualización directa vía Prisma.
 */

import { NextRequest, NextResponse } from "next/server"
import { put, del } from "@vercel/blob"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

/** Solo borramos de Blob las imágenes que nosotros subimos, nunca la foto de Google. */
function esFotoPropia(url: string): boolean {
  return url.includes(".public.blob.vercel-storage.com")
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) return NextResponse.json({ success: false, error: "No se envió archivo" }, { status: 400 })
  if (!VALID_TYPES.includes(file.type)) {
    return NextResponse.json({ success: false, error: "Solo se aceptan JPEG, PNG o WebP" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: "El archivo no puede superar 2MB" }, { status: 400 })
  }

  try {
    const current = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } })

    // Si la foto actual es una que subimos nosotros, la borramos antes de reemplazarla.
    if (current?.image && esFotoPropia(current.image)) {
      try {
        await del(current.image)
      } catch (e) {
        console.error("[perfil/foto upload] Failed to delete old photo:", e)
      }
    }

    const filename = `avatar-${user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
    const blob = await put(filename, file, { access: "public" })

    await prisma.user.update({ where: { id: user.id }, data: { image: blob.url } })

    return NextResponse.json({ success: true, data: { image: blob.url } })
  } catch (error) {
    console.error("[perfil/foto upload]", error)
    return NextResponse.json({ success: false, error: "No se pudo subir la foto" }, { status: 500 })
  }
}

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  try {
    const current = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } })
    if (!current?.image || !esFotoPropia(current.image)) {
      return NextResponse.json({ success: false, error: "No hay foto propia para quitar" }, { status: 400 })
    }

    await del(current.image)
    await prisma.user.update({ where: { id: user.id }, data: { image: null } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[perfil/foto delete]", error)
    return NextResponse.json({ success: false, error: "No se pudo quitar la foto" }, { status: 500 })
  }
}
