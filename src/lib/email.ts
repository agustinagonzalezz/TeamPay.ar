/**
 * src/lib/email.ts — Wrapper sobre Resend para el envío de emails transaccionales.
 */

import { Resend } from "resend"

const FROM = process.env.EMAIL_FROM || "TeamPayment.app <no-reply@teampayment.app>"

// Instancia diferida: el SDK de Resend tira si la API key es vacía al construirse,
// así que evitamos crearla en tiempo de build (cuando la env var puede no estar seteada).
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${process.env.AUTH_URL}/verificar-email?token=${token}`

  await getResendClient().emails.send({
    from: FROM,
    to: email,
    subject: "Confirmá tu cuenta en TeamPayment.app",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin-bottom: 4px;">¡Bienvenida a TeamPayment.app!</h2>
        <p>Para activar tu cuenta y poder iniciar sesión, confirmá tu email haciendo click en el siguiente botón:</p>
        <p style="text-align: center; margin: 28px 0;">
          <a
            href="${verifyUrl}"
            style="background: #6d28d9; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;"
          >
            Verificar mi email
          </a>
        </p>
        <p>Si el botón no te funciona, copiá y pegá este link en tu navegador:</p>
        <p style="word-break: break-all;"><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color: #666; font-size: 13px; margin-top: 24px;">
          Este link expira en 24 horas. Si vos no creaste esta cuenta, podés ignorar este email tranquilamente.
        </p>
      </div>
    `,
  })
}
