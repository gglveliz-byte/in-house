import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: `"BlueExpress" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Recuperar contraseña - BlueExpress',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #003f87; font-size: 28px;">BlueExpress</h1>
        </div>

        <div style="background: #f9fafb; border-radius: 12px; padding: 30px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Hola ${name},</h2>

          <p style="color: #4b5563; line-height: 1.6;">
            Recibimos una solicitud para restablecer tu contraseña.
            Haz clic en el botón de abajo para crear una nueva contraseña:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: #003f87; color: white; padding: 14px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: bold;
                      font-size: 16px; display: inline-block;">
              Restablecer contraseña
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio,
            puedes ignorar este correo.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
            <a href="${resetUrl}" style="color: #003f87; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
          BlueExpress &copy; ${new Date().getFullYear()}
        </p>
      </div>
    `,
  })
}
