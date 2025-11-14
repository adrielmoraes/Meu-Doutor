import { getUncachableResendClient } from './resend-client';
import { getAdminSettings } from './db-adapter';
import type { Patient, Doctor, Exam, Consultation } from '@/types';

export type NotificationType = 
  | 'new_patient'
  | 'new_doctor'
  | 'new_exam'
  | 'new_consultation'
  | 'system_alert'
  | 'weekly_report';

export interface NotificationData {
  type: NotificationType;
  subject: string;
  data: any;
}

export async function sendAdminNotification(notification: NotificationData): Promise<void> {
  try {
    const settings = await getAdminSettings();
    
    if (!settings) {
      console.log('[Admin Notification] Configurações não encontradas');
      return;
    }

    const shouldSend = shouldSendNotification(notification.type, settings);
    
    if (!shouldSend) {
      console.log(`[Admin Notification] Notificação ${notification.type} desabilitada nas configurações`);
      return;
    }

    const { client, fromEmail } = await getUncachableResendClient();
    
    const htmlContent = generateEmailHtml(notification);
    
    await client.emails.send({
      from: fromEmail || 'MediAI Admin <noreply@appmediai.com>',
      to: settings.supportEmail,
      subject: notification.subject,
      html: htmlContent,
    });

    console.log(`[Admin Notification] Email enviado com sucesso: ${notification.type}`);
  } catch (error) {
    console.error('[Admin Notification] Erro ao enviar email:', error);
  }
}

function shouldSendNotification(type: NotificationType, settings: any): boolean {
  switch (type) {
    case 'new_patient':
      return settings.notifyNewPatient;
    case 'new_doctor':
      return settings.notifyNewDoctor;
    case 'new_exam':
      return settings.notifyNewExam;
    case 'new_consultation':
      return settings.notifyNewConsultation;
    case 'system_alert':
      return settings.notifySystemAlerts;
    case 'weekly_report':
      return settings.notifyWeeklyReport;
    default:
      return false;
  }
}

function generateEmailHtml(notification: NotificationData): string {
  const baseStyle = `
    <style>
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a3e; }
      .header { text-align: center; margin-bottom: 30px; }
      .logo { font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .content { background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 24px; margin: 20px 0; border: 1px solid rgba(255, 255, 255, 0.1); }
      .title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #06b6d4; }
      .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
      .info-label { color: #94a3b8; font-size: 14px; }
      .info-value { color: #ffffff; font-size: 14px; font-weight: 500; }
      .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
      .button { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    </style>
  `;

  let content = '';

  switch (notification.type) {
    case 'new_patient':
      const patient = notification.data as Patient;
      content = `
        <div class="title">🆕 Novo Paciente Cadastrado</div>
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span class="info-value">${patient.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${patient.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CPF:</span>
          <span class="info-value">${patient.cpf}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Idade:</span>
          <span class="info-value">${patient.age} anos</span>
        </div>
        <div class="info-row">
          <span class="info-label">Localização:</span>
          <span class="info-value">${patient.city}, ${patient.state}</span>
        </div>
      `;
      break;

    case 'new_doctor':
      const doctor = notification.data as Doctor;
      content = `
        <div class="title">👨‍⚕️ Novo Médico Cadastrado</div>
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span class="info-value">${doctor.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${doctor.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CRM:</span>
          <span class="info-value">${doctor.crm}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Especialidade:</span>
          <span class="info-value">${doctor.specialty}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Localização:</span>
          <span class="info-value">${doctor.city}, ${doctor.state}</span>
        </div>
      `;
      break;

    case 'new_exam':
      const exam = notification.data as Exam;
      content = `
        <div class="title">🔬 Novo Exame Enviado</div>
        <div class="info-row">
          <span class="info-label">Tipo:</span>
          <span class="info-value">${exam.type}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${exam.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value">${exam.status}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Diagnóstico Preliminar:</span>
          <span class="info-value">${exam.preliminaryDiagnosis.substring(0, 100)}...</span>
        </div>
      `;
      break;

    case 'new_consultation':
      const consultation = notification.data as Consultation;
      content = `
        <div class="title">💬 Nova Consulta Realizada</div>
        <div class="info-row">
          <span class="info-label">Tipo:</span>
          <span class="info-value">${consultation.type === 'video-call' ? 'Videochamada' : 'Chat'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value">${consultation.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">ID da Sala:</span>
          <span class="info-value">${consultation.roomId}</span>
        </div>
      `;
      break;

    case 'system_alert':
      content = `
        <div class="title">⚠️ Alerta do Sistema</div>
        <div class="info-row">
          <span class="info-label">Mensagem:</span>
          <span class="info-value">${notification.data.message}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Severidade:</span>
          <span class="info-value">${notification.data.severity || 'Média'}</span>
        </div>
      `;
      break;

    case 'weekly_report':
      content = `
        <div class="title">📊 Relatório Semanal</div>
        <div class="info-row">
          <span class="info-label">Novos Pacientes:</span>
          <span class="info-value">${notification.data.newPatients || 0}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Novos Médicos:</span>
          <span class="info-value">${notification.data.newDoctors || 0}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Exames Analisados:</span>
          <span class="info-value">${notification.data.examsAnalyzed || 0}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Consultas Realizadas:</span>
          <span class="info-value">${notification.data.consultations || 0}</span>
        </div>
      `;
      break;

    default:
      content = `
        <div class="title">📧 Notificação</div>
        <div class="info-row">
          <span class="info-label">Mensagem:</span>
          <span class="info-value">${JSON.stringify(notification.data)}</span>
        </div>
      `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyle}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">MediAI</div>
          <p style="color: #64748b; margin: 8px 0 0 0;">Sistema Administrativo</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Esta é uma notificação automática do sistema MediAI.</p>
          <p>Para gerenciar suas preferências de notificação, acesse o painel administrativo.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
