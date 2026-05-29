export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
  const apiKey = process.env.RESEND_API_KEY || 're_TjaKd51i_GHMXyFsydYYiguUUggqNAjFM'

  const htmlContent = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #003f87; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">BlueExpress</h1>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Entrega a domicilio rápida y confiable</p>
      </div>

      <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Hola ${name},</h2>

        <p style="color: #475569; line-height: 1.6; font-size: 15px; margin-bottom: 25px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
          Haz clic en el botón de abajo para crear una nueva contraseña segura:
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}"
             style="background: #003f87; color: white; padding: 14px 36px;
                    border-radius: 10px; text-decoration: none; font-weight: 600;
                    font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(0, 63, 135, 0.25);">
            Restablecer contraseña
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          Este enlace expirará automáticamente en <strong>1 hora</strong> por motivos de seguridad.
          Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        </p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />

        <p style="color: #94a3b8; font-size: 11px; margin-bottom: 0; line-height: 1.6;">
          Si tienes problemas con el botón, copia y pega el siguiente enlace en tu navegador web:<br/>
          <a href="${resetUrl}" style="color: #003f87; word-break: break-all; text-decoration: underline;">${resetUrl}</a>
        </p>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
        BlueExpress &copy; ${new Date().getFullYear()} &bull; Todos los derechos reservados.
      </p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'BlueExpress <onboarding@resend.dev>',
      to: [to],
      subject: 'Recuperar contraseña - BlueExpress',
      html: htmlContent,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend email delivery failed: ${errorText}`)
  }

  const result = await response.json()
  console.log('Password reset email sent successfully via Resend API:', result)
}
