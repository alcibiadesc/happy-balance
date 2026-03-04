import { Resend } from 'resend';

export class ResendService {
  private client: Resend | null = null;
  private fromEmail: string;
  private initialized = false;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'Happy Balance <noreply@happybalance.app>';

    if (apiKey) {
      this.client = new Resend(apiKey);
      this.initialized = true;
    } else {
      console.warn('⚠️ Resend not configured. Set RESEND_API_KEY to enable magic link emails.');
    }
  }

  isConfigured(): boolean {
    return this.initialized && this.client !== null;
  }

  async sendMagicLinkEmail(email: string, magicLink: string): Promise<boolean> {
    if (!this.client) {
      console.warn('Resend not configured, cannot send magic link email');
      return false;
    }

    try {
      const { error } = await this.client.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Tu enlace de acceso - Happy Balance',
        html: this.buildMagicLinkHtml(magicLink),
      });

      if (error) {
        console.error('Failed to send magic link email:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error sending magic link email:', err);
      return false;
    }
  }

  private buildMagicLinkHtml(magicLink: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 40px auto;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 16px; padding: 48px 40px; border: 1px solid #e5e7eb;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <span style="font-size: 24px; font-weight: 700; color: #023c46; letter-spacing: -0.02em;">
                Happy Balance
              </span>
            </td>
          </tr>
          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom: 16px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #111827; line-height: 1.3;">
                Tu enlace de acceso
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #6b7280;">
                Haz click en el boton para acceder a tu cuenta. Este enlace expira en 15 minutos.
              </p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background-color: #023c46; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.02em;">
                Acceder a Happy Balance
              </a>
            </td>
          </tr>
          <!-- Fallback link -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">
                Si el boton no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280; word-break: break-all;">
                ${magicLink}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="border-top: 1px solid #f3f4f6; padding-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Si no solicitaste este enlace, puedes ignorar este email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
