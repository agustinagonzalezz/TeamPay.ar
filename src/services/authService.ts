/**
 * src/services/authService.ts — Registro, verificación de email y reenvío de verificación.
 *
 * El login en sí lo maneja el Credentials provider de Auth.js (src/lib/auth.ts),
 * que consulta directamente a Prisma. Este servicio cubre todo lo previo a eso.
 */

import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email"
import type { RegisterInput } from "@/lib/validations/auth"

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const PASSWORD_HASH_COST = 12
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000

// ── registerUser ─────────────────────────────────────────────────────────────

/**
 * Crea una cuenta con email y contraseña. La cuenta queda sin verificar
 * (emailVerified: null) hasta que la usuaria confirme el link enviado por email.
 */
export async function registerUser(input: RegisterInput): Promise<ServiceResult<{ email: string }>> {
  try {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })

    if (existing) {
      if (existing.password) {
        return { success: false, error: "Ese email ya está registrado. Iniciá sesión." }
      }
      return { success: false, error: "Ese email ya tiene una cuenta con Google. Iniciá sesión con Google." }
    }

    const hashedPassword = await bcrypt.hash(input.password, PASSWORD_HASH_COST)

    await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email,
        password: hashedPassword,
        role: "JUGADORA",
        emailVerified: null,
      },
    })

    try {
      await createAndSendVerificationToken(input.email)
    } catch (emailError) {
      // La cuenta ya se creó. Si el envío falla (ej: Resend caído), no lo reportamos
      // como fallo del registro — la usuaria puede pedir el link de nuevo con
      // "reenviar verificación" una vez resuelto el problema de envío.
      console.error("[authService.registerUser] no se pudo enviar el email de verificación", emailError)
    }

    return { success: true, data: { email: input.email } }
  } catch (error) {
    console.error("[authService.registerUser]", error)
    return { success: false, error: "No se pudo crear la cuenta. Intentá de nuevo." }
  }
}

// ── verifyEmail ───────────────────────────────────────────────────────────────

/**
 * Confirma la cuenta asociada a un token de verificación válido y no expirado.
 */
export async function verifyEmail(token: string): Promise<ServiceResult<{ email: string }>> {
  try {
    const record = await prisma.verificationToken.findFirst({ where: { token } })

    if (!record || record.expires < new Date()) {
      if (record) {
        await prisma.verificationToken
          .delete({ where: { identifier_token: { identifier: record.identifier, token: record.token } } })
          .catch(() => {})
      }
      return { success: false, error: "El link no es válido o expiró." }
    }

    await prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    })

    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
    })

    return { success: true, data: { email: record.identifier } }
  } catch (error) {
    console.error("[authService.verifyEmail]", error)
    return { success: false, error: "El link no es válido o expiró." }
  }
}

// ── resendVerificationEmail ────────────────────────────────────────────────────

/**
 * Reenvía el email de verificación. Devuelve siempre el mismo resultado de éxito,
 * exista o no la cuenta y esté o no ya verificada, para evitar enumeración de usuarios.
 */
export async function resendVerificationEmail(email: string): Promise<ServiceResult<null>> {
  const generic: ServiceResult<null> = { success: true, data: null }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.emailVerified) {
      return generic
    }

    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    await createAndSendVerificationToken(email)

    return generic
  } catch (error) {
    console.error("[authService.resendVerificationEmail]", error)
    return generic
  }
}

// ── requestPasswordReset ───────────────────────────────────────────────────────

/**
 * Solicita el restablecimiento de contraseña. Devuelve siempre el mismo resultado
 * de éxito, exista o no la cuenta y tenga o no contraseña (cuenta de Google), para
 * evitar enumeración de usuarios — mismo criterio que resendVerificationEmail.
 */
export async function requestPasswordReset(email: string): Promise<ServiceResult<null>> {
  const generic: ServiceResult<null> = { success: true, data: null }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      return generic
    }

    await prisma.passwordResetToken.deleteMany({ where: { email, used: false } })

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS)

    await prisma.passwordResetToken.create({
      data: { email, token, expires, used: false },
    })

    try {
      await sendPasswordResetEmail(email, token)
    } catch (emailError) {
      // El token ya quedó guardado. Si el envío falla, la usuaria puede volver a
      // pedir el reset una vez resuelto el problema — no lo reportamos como error.
      console.error("[authService.requestPasswordReset] no se pudo enviar el email", emailError)
    }

    return generic
  } catch (error) {
    console.error("[authService.requestPasswordReset]", error)
    return generic
  }
}

// ── resetPassword ────────────────────────────────────────────────────────────

/**
 * Restablece la contraseña a partir de un token válido, no usado y no expirado.
 */
export async function resetPassword(token: string, newPassword: string): Promise<ServiceResult<null>> {
  const invalidTokenError: ServiceResult<null> = {
    success: false,
    error: "El link no es válido o expiró. Solicitá uno nuevo.",
  }

  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!record || record.used || record.expires < new Date()) {
      return invalidTokenError
    }

    const hashedPassword = await bcrypt.hash(newPassword, PASSWORD_HASH_COST)

    await prisma.user.update({
      where: { email: record.email },
      data: { password: hashedPassword },
    })

    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    })

    return { success: true, data: null }
  } catch (error) {
    console.error("[authService.resetPassword]", error)
    return invalidTokenError
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createAndSendVerificationToken(email: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  await sendVerificationEmail(email, token)
}
