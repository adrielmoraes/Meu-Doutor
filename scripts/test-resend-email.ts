
import { getUncachableResendClient } from '../src/lib/resend-client';

async function testResendEmail() {
  console.log('🧪 Iniciando teste de envio de email via Resend...\n');

  try {
    // 1. Obter cliente Resend
    console.log('📧 Obtendo cliente Resend...');
    const { client, fromEmail } = await getUncachableResendClient();
    console.log(`✅ Cliente obtido! Email remetente: ${fromEmail}\n`);

    // 2. Email de destino
    const testEmail = 'mediaiapp25@gmail.com';
    console.log(`📨 Enviando email de teste para: ${testEmail}...`);

    // 3. Template do email de teste
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teste de Email - MediAI</title>
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
                    <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">🎉 Resend Configurado!</h2>
                    <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                      <strong>Parabéns!</strong> O sistema de envio de emails via Resend está funcionando perfeitamente com o domínio <strong>sejafelizsempre.com</strong>! 🚀
                    </p>
                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
                      <p style="margin: 0; color: #065f46; font-size: 14px;">
                        ✅ <strong>Status:</strong> Integração Resend configurada e operacional
                      </p>
                      <p style="margin: 10px 0 0 0; color: #065f46; font-size: 14px;">
                        ⏰ <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}
                      </p>
                      <p style="margin: 10px 0 0 0; color: #065f46; font-size: 14px;">
                        📧 <strong>Remetente:</strong> ${fromEmail}
                      </p>
                      <p style="margin: 10px 0 0 0; color: #065f46; font-size: 14px;">
                        🌐 <strong>Domínio:</strong> sejafelizsempre.com
                      </p>
                    </div>
                    <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                      Este é um email de teste automático para verificar a funcionalidade do serviço Resend na plataforma MediAI.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #718096; font-size: 14px;">
                      © ${new Date().getFullYear()} MediAI. Todos os direitos reservados.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px;">
                      Enviado via sejafelizsempre.com
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

    // 4. Enviar email
    const result = await client.emails.send({
      from: fromEmail,
      to: [testEmail],
      subject: '🎉 Resend Configurado - MediAI via sejafelizsempre.com',
      html: htmlContent,
    });

    console.log('\n✅ Email enviado com sucesso!');
    console.log('📋 ID do email:', result.data?.id);
    console.log('\n📬 Verifique a caixa de entrada em:', testEmail);
    console.log('💡 Não se esqueça de verificar a pasta de spam/lixo eletrônico!\n');

  } catch (error) {
    console.error('\n❌ Erro ao enviar email:', error);
    
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
    }

    console.log('\n🔍 Possíveis soluções:');
    console.log('1. Verifique se a integração Resend está configurada no Replit');
    console.log('2. Configure o email remetente como: noreply@sejafelizsempre.com');
    console.log('3. Confirme que o domínio sejafelizsempre.com está verificado no Resend');
    console.log('4. Verifique os registros DNS (SPF, DKIM, DMARC) no painel do Resend');
  }
}

testResendEmail();
