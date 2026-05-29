import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(60).trim(),
})

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 422 })
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: "No se pudo actualizar el perfil." }, { status: 500 })
  }
}
