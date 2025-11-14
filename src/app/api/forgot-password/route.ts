
import { NextRequest, NextResponse } from 'next/server';
import { getPatientByEmail, getDoctorByEmail, updatePatient, updateDoctor } from '@/lib/db-adapter';
import { generateVerificationToken, getTokenExpiry } from '@/lib/email-service';
import { getUncachableResendClient } from '@/lib/resend-client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se é paciente ou médico
    let user = await getPatientByEmail(email);
    let userType: 'patient' | 'doctor' = 'patient';
    
    if (!user) {
      user = await getDoctorByEmail(email);
      userType = 'doctor';
    }

    if (!user) {
      // Não revelar se o email existe ou não (segurança)
      return NextResponse.json({ 
        success: true,
        message: 'Se o email existir, você receberá instruções de recuperação' 
      });
    }

    // Gerar token de recuperação
    const resetToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    // Atualizar usuário com token
    if (userType === 'patient') {
      await updatePatient(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: tokenExpiry,
      });
    } else {
      await updateDoctor(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: tokenExpiry,
      });
    }

    // Enviar email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mediai.replit.app';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&type=${userType}`;
    
    const { client, fromEmail } = await getUncachableResendClient();
    
    await client.emails.send({
      from: fromEmail || 'MediAI <noreply@appmediai.com>',
      to: [email],
      subject: 'Recuperação de Senha - MediAI',
      html: getPasswordResetTemplate(user.fullName, resetUrl),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Email de recuperação enviado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

function getPasswordResetTemplate(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperação de Senha - MediAI</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">🔐 MediAI</h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Recuperação de Senha</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">Olá, ${name}! 👋</h2>
                  <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Recebemos uma solicitação para redefinir a senha da sua conta MediAI.
                  </p>
                  <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Clique no botão abaixo para criar uma nova senha:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                          Redefinir Senha
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 30px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                    <strong>⚠️ Importante:</strong> Este link expira em 24 horas.
                  </p>
                  <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                    Se você não solicitou a recuperação de senha, pode ignorar este email com segurança.
                  </p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                  <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.6;">
                    Se o botão não funcionar, copie e cole este link:<br>
                    <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #718096; font-size: 14px;">
                    © ${new Date().getFullYear()} MediAI. Todos os direitos reservados.
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
