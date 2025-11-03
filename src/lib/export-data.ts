/**
 * Sistema de Export de Dados para Compliance LGPD
 * Permite exportar dados de pacientes em PDF e JSON
 */

import type { Patient, Exam } from '@/types';

/**
 * Exporta dados do paciente em formato JSON
 */
export function exportPatientDataJSON(patient: Patient, exams: Exam[]): string {
  const exportData = {
    export_date: new Date().toISOString(),
    export_type: 'patient_data',
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      age: patient.age,
      cpf: patient.cpf,
      phone: patient.phone,
      created_at: patient.createdAt,
      status: patient.status,
      reported_symptoms: patient.reportedSymptoms,
      conversation_history: patient.conversationHistory,
    },
    exams: exams.map(exam => ({
      id: exam.id,
      type: exam.type,
      date: exam.date,
      status: exam.status,
      result: exam.result,
      preliminary_diagnosis: exam.preliminaryDiagnosis,
      explanation: exam.explanation,
      suggestions: exam.suggestions,
    })),
    export_notice: 'Dados exportados conforme LGPD (Lei Geral de Proteção de Dados). Você tem o direito de solicitar a exclusão destes dados a qualquer momento.',
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Gera HTML para export PDF dos dados do paciente
 */
export function generatePatientDataHTML(patient: Patient, exams: Exam[]): string {
  const examRows = exams.map(exam => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 12px;">${exam.type}</td>
      <td style="border: 1px solid #ddd; padding: 12px;">${new Date(exam.date).toLocaleDateString('pt-BR')}</td>
      <td style="border: 1px solid #ddd; padding: 12px;">${exam.status}</td>
      <td style="border: 1px solid #ddd; padding: 12px;">${exam.result?.substring(0, 100) || 'N/A'}...</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dados do Paciente - ${patient.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #4b5563;
      margin-top: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #2563eb;
      color: white;
      padding: 12px;
      text-align: left;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    .info-item {
      padding: 15px;
      background-color: #f3f4f6;
      border-radius: 8px;
    }
    .info-label {
      font-weight: bold;
      color: #6b7280;
      font-size: 14px;
    }
    .info-value {
      margin-top: 5px;
      font-size: 16px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <h1>Dados do Paciente - MediAI</h1>
  <p><strong>Exportado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>

  <h2>Informações Pessoais</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Nome Completo</div>
      <div class="info-value">${patient.name}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Email</div>
      <div class="info-value">${patient.email}</div>
    </div>
    <div class="info-item">
      <div class="info-label">CPF</div>
      <div class="info-value">${patient.cpf}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Idade</div>
      <div class="info-value">${patient.age} anos</div>
    </div>
    <div class="info-item">
      <div class="info-label">Telefone</div>
      <div class="info-value">${patient.phone || 'Não informado'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Status</div>
      <div class="info-value">${patient.status}</div>
    </div>
  </div>

  <h2>Histórico de Exames</h2>
  <table>
    <thead>
      <tr>
        <th>Tipo de Exame</th>
        <th>Data</th>
        <th>Status</th>
        <th>Resultado</th>
      </tr>
    </thead>
    <tbody>
      ${examRows || '<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum exame registrado</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>LGPD - Lei Geral de Proteção de Dados</strong></p>
    <p>Você tem direito à privacidade e proteção dos seus dados pessoais. Você pode solicitar:</p>
    <ul>
      <li>Confirmação da existência de tratamento de dados</li>
      <li>Acesso aos seus dados (este relatório)</li>
      <li>Correção de dados incompletos, inexatos ou desatualizados</li>
      <li>Eliminação dos dados tratados com seu consentimento</li>
      <li>Revogação do consentimento</li>
    </ul>
    <p>Para exercer esses direitos, entre em contato com suporte@mediai.com</p>
    <p>MediAI - Plataforma de Saúde Digital</p>
  </div>
</body>
</html>
  `;
}
