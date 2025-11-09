import crypto from 'crypto';

export interface VerificationEmailData {
  to: string;
  name: string;
  verificationUrl: string;
}

export interface EmailServiceConfig {
  provider: 'resend' | 'sendgrid' | 'smtp';
  apiKey?: string;
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

export async function sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  try {
    // Tentar usar integração Resend do Replit primeiro
    try {
      const { getUncachableResendClient } = await import('./resend-client');
      const { client, fromEmail } = await getUncachableResendClient();
      
      const result = await client.emails.send({
        from: fromEmail || 'MediAI <noreply@mediai.com>',
        to: [data.to],
        subject: 'Confirme seu email - MediAI',
        html: getEmailTemplate(data.name, data.verificationUrl),
      });

      console.log('[Email] ✅ Email enviado com sucesso via Resend:', result.data?.id);
      return true;
    } catch (resendError: any) {
      console.warn('[Email] Integração Resend não disponível, tentando fallback:', resendError.message);
      
      // Fallback: tentar com RESEND_API_KEY direta
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        return await sendViaResendFallback(data, resendApiKey);
      }
      
      // Fallback: SendGrid
      const sendgridApiKey = process.env.SENDGRID_API_KEY;
      if (sendgridApiKey) {
        return await sendViaSendGrid(data, sendgridApiKey);
      }
      
      // Nenhum serviço configurado
      console.error('[Email] ❌ Nenhum serviço de email configurado!');
      console.log('[Email] Configure a integração Resend no Replit ou adicione RESEND_API_KEY');
      console.log(`[Email] Email que deveria ser enviado para: ${data.to}`);
      console.log(`[Email] Link de verificação: ${data.verificationUrl}`);
      return false;
    }
  } catch (error) {
    console.error('[Email] ❌ Erro crítico ao enviar email:', error);
    return false;
  }
}

async function sendViaResendFallback(data: VerificationEmailData, apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MediAI <noreply@mediai.com>',
      to: [data.to],
      subject: 'Confirme seu email - MediAI',
      html: getEmailTemplate(data.name, data.verificationUrl),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Email] Erro ao enviar via Resend (fallback):', error);
    return false;
  }

  console.log('[Email] ✅ Email enviado via Resend (fallback)');
  return true;
}

async function sendViaSendGrid(data: VerificationEmailData, apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: data.to }],
      }],
      from: { email: 'noreply@mediai.com', name: 'MediAI' },
      subject: 'Confirme seu email - MediAI',
      content: [{
        type: 'text/html',
        value: getEmailTemplate(data.name, data.verificationUrl),
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Erro ao enviar via SendGrid:', error);
    return false;
  }

  return true;
}

function getEmailTemplate(name: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirme seu email - MediAI</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">MediAI</h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Plataforma de Saúde Inteligente</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">Olá, ${name}!</h2>
                  <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Bem-vindo(a) à MediAI! Para começar a usar sua conta, precisamos verificar seu endereço de email.
                  </p>
                  <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Clique no botão abaixo para confirmar seu email:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                          Confirmar Email
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 30px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                    Se você não criou uma conta na MediAI, pode ignorar este email com segurança.
                  </p>
                  <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                    Este link expira em 24 horas.
                  </p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                  <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.6;">
                    Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                    <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #718096; font-size: 14px;">
                    © ${new Date().getFullYear()} MediAI. Todos os direitos reservados.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px;">
                    Saúde inteligente, ao alcance de todos.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
