
import { getUncachableResendClient } from '../src/lib/resend-client';
import { generateVerificationToken, getTokenExpiry } from '../src/lib/email-service';

async function testEmailVerification() {
  console.log('🧪 Iniciando teste de email de verificação...\n');

  try {
    // 1. Obter cliente Resend
    console.log('📧 Obtendo cliente Resend...');
    const { client, fromEmail } = await getUncachableResendClient();
    console.log(`✅ Cliente obtido! Email remetente: ${fromEmail}\n`);

    // 2. Gerar token de verificação
    const token = generateVerificationToken();
    const expiry = getTokenExpiry();
    console.log(`🔑 Token gerado: ${token}`);
    console.log(`⏰ Expira em: ${expiry.toLocaleString('pt-BR')}\n`);

    // 3. Criar URL de verificação (ajuste conforme seu domínio)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}&type=patient`;
    console.log(`🔗 URL de verificação: ${verificationUrl}\n`);

    // 4. Email de teste (ALTERE AQUI para seu email)
    const testEmail = process.env.TEST_EMAIL || 'seu-email@exemplo.com';
    const testName = 'Usuário Teste';

    console.log(`📨 Enviando email de teste para: ${testEmail}...`);

    // 5. Template do email
    const htmlContent = `
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
                    <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">Olá, ${testName}! 👋</h2>
                    <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                      <strong>Este é um email de TESTE</strong> do sistema de verificação da MediAI.
                    </p>
                    <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                      Se você recebeu este email, significa que o sistema de envio via Resend está funcionando corretamente! 🎉
                    </p>
                    <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                      Clique no botão abaixo para testar o fluxo de verificação:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                            Testar Verificação
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 30px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                      <strong>Detalhes do Teste:</strong><br>
                      Token: ${token.substring(0, 16)}...<br>
                      Expira em: ${expiry.toLocaleString('pt-BR')}<br>
                      Tipo: Paciente
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.6;">
                      Se o botão não funcionar, copie e cole este link:<br>
                      <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #718096; font-size: 14px;">
                      © ${new Date().getFullYear()} MediAI - Email de Teste
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

    // 6. Enviar email
    const result = await client.emails.send({
      from: fromEmail || 'MediAI <noreply@appmediai.com>',
      to: [testEmail],
      subject: '🧪 TESTE - Confirme seu email - MediAI',
      html: htmlContent,
    });

    console.log('\n✅ Email enviado com sucesso!');
    console.log('📋 Detalhes da resposta:', JSON.stringify(result, null, 2));
    console.log('\n📬 Verifique sua caixa de entrada em:', testEmail);
    console.log('💡 Não se esqueça de verificar a pasta de spam/lixo eletrônico!\n');

  } catch (error) {
    console.error('\n❌ Erro ao enviar email:', error);
    
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }

    console.log('\n🔍 Possíveis soluções:');
    console.log('1. Verifique se a integração Resend está configurada no Replit');
    console.log('2. Confirme que o domínio de envio está verificado no Resend');
    console.log('3. Verifique se as variáveis de ambiente estão corretas');
    console.log('4. Confira os logs acima para mais detalhes do erro\n');
    
    process.exit(1);
  }
}

// Executar teste
testEmailVerification();
