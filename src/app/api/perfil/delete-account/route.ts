import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { deleteAccount } from "@/services/perfilService"
import { signOut } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: "No autenticada" }, { status: 401 })

  try {
    const result = await deleteAccount(user.id)
    if (!result.success) return NextResponse.json(result, { status: 500 })

    // Logout automático (client-side manejará redirección)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/perfil/delete-account]", error)
    return NextResponse.json({ success: false, error: "No se pudo eliminar la cuenta." }, { status: 500 })
  }
}
