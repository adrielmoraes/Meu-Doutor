import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../../../../server/storage';
import { contactMessages } from '@/shared/schema';
import { getUncachableResendClient } from '@/lib/resend-client';

const contactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  email: z.string().email('Email inválido').max(255),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres').max(500),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = contactSchema.parse(body);
    
    const [savedMessage] = await db.insert(contactMessages).values({
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message,
      status: 'new',
    }).returning();

    try {
      const { client: resend, fromEmail } = await getUncachableResendClient();
      
      await resend.emails.send({
        from: fromEmail || 'MediAI <noreply@appmediai.com>',
        to: ['contato@appmediai.com'],
        replyTo: validatedData.email,
        subject: `[Contato MediAI] ${validatedData.subject}`,
        html: getContactEmailTemplate(validatedData),
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de notificação:', emailError);
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Mensagem enviada com sucesso! Retornaremos em breve.',
        id: savedMessage.id 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar mensagem de contato:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Dados inválidos',
          errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao enviar mensagem. Por favor, tente novamente mais tarde.' 
      },
      { status: 500 }
    );
  }
}

function getContactEmailTemplate(data: { name: string; email: string; subject: string; message: string }): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nova Mensagem de Contato - MediAI</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f7fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">MediAI</h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Nova Mensagem de Contato</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">Você recebeu uma nova mensagem!</h2>
                  
                  <div style="background: #f7fafc; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; font-weight: 600;">NOME:</p>
                    <p style="margin: 0 0 20px 0; color: #1a202c; font-size: 16px;">${data.name}</p>
                    
                    <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; font-weight: 600;">EMAIL:</p>
                    <p style="margin: 0 0 20px 0; color: #1a202c; font-size: 16px;">
                      <a href="mailto:${data.email}" style="color: #06b6d4; text-decoration: none;">${data.email}</a>
                    </p>
                    
                    <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; font-weight: 600;">ASSUNTO:</p>
                    <p style="margin: 0 0 20px 0; color: #1a202c; font-size: 16px;">${data.subject}</p>
                    
                    <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; font-weight: 600;">MENSAGEM:</p>
                    <p style="margin: 0; color: #1a202c; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
                  </div>
                  
                  <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin-top: 30px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      💡 <strong>Dica:</strong> Responda esta mensagem diretamente usando o botão "Reply" do seu cliente de email. O endereço do remetente já está configurado.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #718096; font-size: 14px;">
                    © ${new Date().getFullYear()} MediAI. Todos os direitos reservados.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px;">
                    Esta é uma notificação automática do sistema de contato MediAI.
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
