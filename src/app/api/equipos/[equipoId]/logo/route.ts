import { NextRequest, NextResponse } from "next/server"
import { put, del } from "@vercel/blob"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ equipoId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  const { equipoId } = await params
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) return NextResponse.json({ success: false, error: "No se envió archivo" }, { status: 400 })

  // Validar tipo y tamaño
  const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"]
  const MAX_SIZE = 2 * 1024 * 1024 // 2MB

  if (!VALID_TYPES.includes(file.type)) {
    return NextResponse.json({ success: false, error: "Solo se aceptan JPEG, PNG o WebP" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: "El archivo no puede superar 2MB" }, { status: 400 })
  }

  try {
    // Verificar que el usuario es capitana
    const team = await prisma.team.findFirst({ where: { id: equipoId, ownerId: user.id } })
    if (!team) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })

    // Eliminar logo anterior si existe
    if (team.logoUrl) {
      try {
        await del(team.logoUrl)
      } catch (e) {
        console.error("[logo upload] Failed to delete old logo:", e)
        // Continúa aunque falle la eliminación del anterior
      }
    }

    // Subir nuevo logo a Vercel Blob
    const filename = `${equipoId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
    const blob = await put(filename, file, { access: "public" })

    // Actualizar Team.logoUrl
    await prisma.team.update({
      where: { id: equipoId },
      data: { logoUrl: blob.url },
    })

    return NextResponse.json({ success: true, data: { logoUrl: blob.url } })
  } catch (error) {
    console.error("[logo upload]", error)
    return NextResponse.json({ success: false, error: "No se pudo subir el logo" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  const { equipoId } = await params

  try {
    const team = await prisma.team.findFirst({ where: { id: equipoId, ownerId: user.id } })
    if (!team) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    if (!team.logoUrl) return NextResponse.json({ success: false, error: "No hay logo" }, { status: 400 })

    // Eliminar de Blob
    await del(team.logoUrl)

    // Limpiar en BD
    await prisma.team.update({
      where: { id: equipoId },
      data: { logoUrl: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[logo delete]", error)
    return NextResponse.json({ success: false, error: "No se pudo eliminar el logo" }, { status: 500 })
  }
}
