'use server';

import { updateDoctorStatus, getPatientMedicalContext, getDoctorById } from '@/lib/db-adapter';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { generateDocumentDraftFlow } from '@/ai/flows/generate-document-draft-flow';
import { getCachedToken, setCachedToken, clearCachedToken } from '@/lib/memed-token-cache';
import { validateCPF, validatePhone, numbersOnly } from '@/lib/validation-utils';

export async function toggleDoctorOnlineStatus(online: boolean) {
  const session = await getSession();

  if (!session || session.role !== 'doctor' || !session.userId) {
    return { success: false, message: 'Não autorizado.' };
  }

  try {
    await updateDoctorStatus(session.userId, online);
    console.log(`[ToggleStatus] Médico ${session.userId} agora está ${online ? 'ONLINE' : 'OFFLINE'}`);

    // Revalidar páginas relevantes
    revalidatePath('/doctor');
    revalidatePath('/patient/doctors');

    return {
      success: true,
      message: online ? 'Você está online agora!' : 'Você está offline.',
      online
    };
  } catch (error) {
    console.error('[ToggleStatus] Erro ao atualizar status:', error);
    return { success: false, message: 'Erro ao atualizar status.' };
  }
}

export async function generateDocumentDraftAction(patientId: string, documentType: 'receita' | 'atestado' | 'laudo' | 'outro') {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    throw new Error("Não autorizado");
  }

  try {
    const patientContext = await getPatientMedicalContext(patientId);
    if (!patientContext) throw new Error("Paciente não encontrado");

    const draft = await generateDocumentDraftFlow({
      patientId,
      documentType,
      patientContext
    });

    return { success: true, draft };
  } catch (error: any) {
    console.error('Error generating document draft:', error);
    return { success: false, message: error.message };
  }
}

export async function getMemedTokenAction() {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    throw new Error("Não autorizado");
  }

  // Check cache first
  const cachedToken = getCachedToken(session.userId);
  if (cachedToken) {
    console.log('[Memed] Usando token em cache');
    return { success: true, token: cachedToken };
  }

  // Chaves de homologação da Memed
  const API_KEY = process.env.MEMED_API_KEY;
  const SECRET_KEY = process.env.MEMED_SECRET_KEY;
  const BASE_URL = process.env.MEMED_API_URL || 'https://integrations.api.memed.com.br/v1';

  if (!API_KEY || !SECRET_KEY) {
    return { success: false, message: 'Configuração da Memed (API_KEY/SECRET_KEY) ausente no servidor.' };
  }

  const doctor = await getDoctorById(session.userId);
  if (!doctor) {
    return { success: false, message: 'Médico não encontrado no banco de dados.' };
  }

  // Validate CPF
  if (!doctor.cpf || !validateCPF(doctor.cpf)) {
    return { success: false, message: 'CPF inválido ou ausente. Atualize seu perfil.' };
  }

  // CRM é obrigatório
  if (!doctor.crm) {
    return { success: false, message: 'CRM é obrigatório para integração com Memed. Atualize seu perfil.' };
  }

  // Split name into first and last name
  const nameParts = doctor.name.trim().split(/\s+/);
  const primeiroNome = nameParts[0];
  const sobrenome = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Silva';

  // Determinar o tipo de conselho
  const boardCode = doctor.crm?.toLowerCase().startsWith('cro') ? 'CRO' : 'CRM';
  const boardNumber = numbersOnly(doctor.crm);
  const boardState = doctor.state || 'SP';

  // Payload conforme documentação Memed
  const payload = {
    data: {
      type: 'usuarios',
      attributes: {
        external_id: session.userId,
        nome: primeiroNome,
        sobrenome: sobrenome,
        cpf: numbersOnly(doctor.cpf),
        board: {
          board_code: boardCode,
          board_number: boardNumber,
          board_state: boardState
        },
        data_nascimento: doctor.birthDate || '01/01/1980',
        email: doctor.email || undefined,
        telefone: doctor.phone ? numbersOnly(doctor.phone) : undefined,
        sexo: 'M'
      }
    }
  };

  const endpoint = `${BASE_URL}/sinapse-prescricao/usuarios?api-key=${API_KEY}&secret-key=${SECRET_KEY}`;

  try {
    console.log(`[Memed] Registrando prescritor em: ${BASE_URL}/sinapse-prescricao/usuarios`);
    console.log('[Memed] Payload external_id:', payload.data.attributes.external_id);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.api+json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`[Memed] Response Status: ${response.status}`);
    console.log(`[Memed] Response Body: ${responseText}`);

    if (response.ok) {
      const data = JSON.parse(responseText);
      const token = data.data?.attributes?.token || data.data?.token || data.token;
      const expiresIn = data.data?.attributes?.expires_in || 3600;

      if (token) {
        console.log('[Memed] Token obtido com sucesso!');
        setCachedToken(session.userId, token, expiresIn);
        return { success: true, token, expiresIn };
      } else {
        return { success: false, message: 'Token não retornado pela API Memed.' };
      }
    } else {
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }

      const errorDetail = errorData.errors?.[0]?.detail || errorData.message || `Erro ${response.status}`;
      console.warn(`[Memed] Falha: ${errorDetail}`);

      return {
        success: false,
        message: `Erro Memed: ${errorDetail}`
      };
    }
  } catch (error) {
    console.error('[Memed] Erro de conexão:', error);
    return { success: false, message: 'Erro de conexão com a API Memed.' };
  }
}

// Base de medicamentos brasileiros comuns (a Memed não oferece endpoint de busca)
const MEDICAMENTOS_BRASILEIROS = [
  { id: 'dip-500', nome: 'Dipirona Sódica', apresentacao: '500mg - 10 comprimidos', laboratorio: 'Genérico' },
  { id: 'dip-1g', nome: 'Dipirona Sódica', apresentacao: '1g - 10 comprimidos', laboratorio: 'Genérico' },
  { id: 'para-500', nome: 'Paracetamol', apresentacao: '500mg - 20 comprimidos', laboratorio: 'Genérico' },
  { id: 'para-750', nome: 'Paracetamol', apresentacao: '750mg - 20 comprimidos', laboratorio: 'Genérico' },
  { id: 'ibu-400', nome: 'Ibuprofeno', apresentacao: '400mg - 20 comprimidos', laboratorio: 'Genérico' },
  { id: 'ibu-600', nome: 'Ibuprofeno', apresentacao: '600mg - 20 comprimidos', laboratorio: 'Genérico' },
  { id: 'amoxi-500', nome: 'Amoxicilina', apresentacao: '500mg - 21 cápsulas', laboratorio: 'Genérico' },
  { id: 'amoxi-875', nome: 'Amoxicilina', apresentacao: '875mg - 14 comprimidos', laboratorio: 'Genérico' },
  { id: 'azitro-500', nome: 'Azitromicina', apresentacao: '500mg - 3 comprimidos', laboratorio: 'Genérico' },
  { id: 'omep-20', nome: 'Omeprazol', apresentacao: '20mg - 28 cápsulas', laboratorio: 'Genérico' },
  { id: 'omep-40', nome: 'Omeprazol', apresentacao: '40mg - 28 cápsulas', laboratorio: 'Genérico' },
  { id: 'losat-50', nome: 'Losartana Potássica', apresentacao: '50mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'losat-100', nome: 'Losartana Potássica', apresentacao: '100mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'metfo-500', nome: 'Metformina', apresentacao: '500mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'metfo-850', nome: 'Metformina', apresentacao: '850mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'ator-10', nome: 'Atorvastatina', apresentacao: '10mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'ator-20', nome: 'Atorvastatina', apresentacao: '20mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'sinv-20', nome: 'Sinvastatina', apresentacao: '20mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'sinv-40', nome: 'Sinvastatina', apresentacao: '40mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'hidro-25', nome: 'Hidroclorotiazida', apresentacao: '25mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'aml-5', nome: 'Anlodipino', apresentacao: '5mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'aml-10', nome: 'Anlodipino', apresentacao: '10mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'enal-10', nome: 'Enalapril', apresentacao: '10mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'enal-20', nome: 'Enalapril', apresentacao: '20mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'clor-25', nome: 'Clortalidona', apresentacao: '25mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'levo-500', nome: 'Levotiroxina', apresentacao: '50mcg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'levo-100', nome: 'Levotiroxina', apresentacao: '100mcg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'pred-5', nome: 'Prednisona', apresentacao: '5mg - 20 comprimidos', laboratorio: 'Genérico' },
  { id: 'pred-20', nome: 'Prednisona', apresentacao: '20mg - 10 comprimidos', laboratorio: 'Genérico' },
  { id: 'dexa-4', nome: 'Dexametasona', apresentacao: '4mg - 10 comprimidos', laboratorio: 'Genérico' },
  { id: 'clar-500', nome: 'Claritromicina', apresentacao: '500mg - 14 comprimidos', laboratorio: 'Genérico' },
  { id: 'cipro-500', nome: 'Ciprofloxacino', apresentacao: '500mg - 14 comprimidos', laboratorio: 'Genérico' },
  { id: 'met-400', nome: 'Metronidazol', apresentacao: '400mg - 24 comprimidos', laboratorio: 'Genérico' },
  { id: 'cefa-500', nome: 'Cefalexina', apresentacao: '500mg - 8 cápsulas', laboratorio: 'Genérico' },
  { id: 'ceft-250', nome: 'Ceftriaxona', apresentacao: '250mg/mL IM', laboratorio: 'Genérico' },
  { id: 'ceft-1g', nome: 'Ceftriaxona', apresentacao: '1g EV', laboratorio: 'Genérico' },
  { id: 'clona-0.5', nome: 'Clonazepam', apresentacao: '0,5mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'clona-2', nome: 'Clonazepam', apresentacao: '2mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'diaz-10', nome: 'Diazepam', apresentacao: '10mg - 20 comprimidos', laboratorio: 'Genérico' },
  { id: 'alpra-0.5', nome: 'Alprazolam', apresentacao: '0,5mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'alpra-1', nome: 'Alprazolam', apresentacao: '1mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'sert-50', nome: 'Sertralina', apresentacao: '50mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'sert-100', nome: 'Sertralina', apresentacao: '100mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'fluox-20', nome: 'Fluoxetina', apresentacao: '20mg - 30 cápsulas', laboratorio: 'Genérico' },
  { id: 'escit-10', nome: 'Escitalopram', apresentacao: '10mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'escit-20', nome: 'Escitalopram', apresentacao: '20mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'amit-25', nome: 'Amitriptilina', apresentacao: '25mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'tram-50', nome: 'Tramadol', apresentacao: '50mg - 10 cápsulas', laboratorio: 'Genérico' },
  { id: 'tram-100', nome: 'Tramadol', apresentacao: '100mg - 10 comprimidos', laboratorio: 'Genérico' },
  { id: 'code-30', nome: 'Codeína + Paracetamol', apresentacao: '30mg + 500mg - 12 comprimidos', laboratorio: 'Genérico' },
  { id: 'lora-10', nome: 'Loratadina', apresentacao: '10mg - 12 comprimidos', laboratorio: 'Genérico' },
  { id: 'dest-5', nome: 'Desloratadina', apresentacao: '5mg - 10 comprimidos', laboratorio: 'Genérico' },
  { id: 'fexo-120', nome: 'Fexofenadina', apresentacao: '120mg - 10 comprimidos', laboratorio: 'Genérico' },
  { id: 'fexo-180', nome: 'Fexofenadina', apresentacao: '180mg - 10 comprimidos', laboratorio: 'Genérico' },
  { id: 'rano-150', nome: 'Ranitidina', apresentacao: '150mg - 20 comprimidos', laboratorio: 'Genérico' },
  { id: 'panto-40', nome: 'Pantoprazol', apresentacao: '40mg - 28 comprimidos', laboratorio: 'Genérico' },
  { id: 'esome-40', nome: 'Esomeprazol', apresentacao: '40mg - 28 comprimidos', laboratorio: 'Genérico' },
  { id: 'dom-10', nome: 'Domperidona', apresentacao: '10mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'meto-10', nome: 'Metoclopramida', apresentacao: '10mg - 20 comprimidos', laboratorio: 'Genérico' },
  { id: 'onda-8', nome: 'Ondansetrona', apresentacao: '8mg - 10 comprimidos', laboratorio: 'Genérico' },
  { id: 'salb-aer', nome: 'Salbutamol', apresentacao: 'Aerossol 100mcg - 200 doses', laboratorio: 'Genérico' },
  { id: 'bude-aer', nome: 'Budesonida', apresentacao: 'Spray Nasal 50mcg - 120 doses', laboratorio: 'Genérico' },
  { id: 'form-bude', nome: 'Formoterol + Budesonida', apresentacao: '12/400mcg - 60 cápsulas', laboratorio: 'Genérico' },
  { id: 'montel-10', nome: 'Montelucaste', apresentacao: '10mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'insul-nph', nome: 'Insulina NPH', apresentacao: '100UI/mL - 10mL', laboratorio: 'Genérico' },
  { id: 'insul-reg', nome: 'Insulina Regular', apresentacao: '100UI/mL - 10mL', laboratorio: 'Genérico' },
  { id: 'glib-5', nome: 'Glibenclamida', apresentacao: '5mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'glim-2', nome: 'Glimepirida', apresentacao: '2mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'aas-100', nome: 'Ácido Acetilsalicílico', apresentacao: '100mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'clopid-75', nome: 'Clopidogrel', apresentacao: '75mg - 28 comprimidos', laboratorio: 'Genérico' },
  { id: 'warf-5', nome: 'Varfarina', apresentacao: '5mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'riva-20', nome: 'Rivaroxabana', apresentacao: '20mg - 30 comprimidos', laboratorio: 'Xarelto' },
  { id: 'apix-5', nome: 'Apixabana', apresentacao: '5mg - 60 comprimidos', laboratorio: 'Eliquis' },
  { id: 'enox-40', nome: 'Enoxaparina', apresentacao: '40mg - seringa preenchida', laboratorio: 'Genérico' },
  { id: 'hepa-5000', nome: 'Heparina Sódica', apresentacao: '5000UI/mL - 5mL', laboratorio: 'Genérico' },
  { id: 'digox-0.25', nome: 'Digoxina', apresentacao: '0,25mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'amio-200', nome: 'Amiodarona', apresentacao: '200mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'prop-40', nome: 'Propranolol', apresentacao: '40mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'aten-50', nome: 'Atenolol', apresentacao: '50mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'carv-6.25', nome: 'Carvedilol', apresentacao: '6,25mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'carv-25', nome: 'Carvedilol', apresentacao: '25mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'furo-40', nome: 'Furosemida', apresentacao: '40mg - 20 comprimidos', laboratorio: 'Genérico' },
  { id: 'espir-25', nome: 'Espironolactona', apresentacao: '25mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'espir-100', nome: 'Espironolactona', apresentacao: '100mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'alop-100', nome: 'Alopurinol', apresentacao: '100mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'alop-300', nome: 'Alopurinol', apresentacao: '300mg - 30 comprimidos', laboratorio: 'Genérico' },
  { id: 'colch-0.5', nome: 'Colchicina', apresentacao: '0,5mg - 20 comprimidos', laboratorio: 'Genérico' },
];

export async function searchMemedMedicinesAction(query: string) {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    throw new Error("Não autorizado");
  }

  if (!query || query.length < 2) return { success: true, results: [] };

  // Busca local na base de medicamentos brasileiros
  const searchLower = query.toLowerCase();
  const results = MEDICAMENTOS_BRASILEIROS.filter(med => 
    med.nome.toLowerCase().includes(searchLower) ||
    med.apresentacao.toLowerCase().includes(searchLower)
  ).slice(0, 10).map(med => ({
    id: med.id,
    nome: med.nome,
    name: med.nome,
    apresentacao: med.apresentacao,
    presentation: med.apresentacao,
    laboratorio: med.laboratorio,
    manufacturer: med.laboratorio,
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }));

  return { success: true, results };
}

/**
 * Create a medical document (prescription, certificate, report) via Memed API
 */
export async function createMemedDocumentAction(params: {
  patientId: string;
  documentType: 'receita' | 'atestado' | 'laudo' | 'exame' | 'memed' | 'outro';
  title?: string;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  observations?: string;
  cid?: string;
  days?: number; // For atestados
}) {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    return { success: false, message: 'Não autorizado' };
  }

  // Get token (from cache or generate new)
  const tokenResult = await getMemedTokenAction();
  if (!tokenResult.success || !tokenResult.token) {
    return { success: false, message: tokenResult.message || 'Falha ao obter token Memed' };
  }

  const API_KEY = process.env.MEMED_API_KEY;
  const SECRET_KEY = process.env.MEMED_SECRET_KEY;

  if (!API_KEY || !SECRET_KEY) {
    return { success: false, message: 'Configuração da Memed ausente no servidor.' };
  }

  // Get patient data
  const { getPatientById } = await import('@/lib/db-adapter');
  const patient = await getPatientById(params.patientId);

  if (!patient) {
    return { success: false, message: 'Paciente não encontrado' };
  }

  // Prepare document payload
  const payload: any = {
    tipo: params.documentType,
    paciente: {
      nome: patient.name,
      cpf: patient.cpf ? numbersOnly(patient.cpf) : undefined,
      data_nascimento: patient.birthDate,
      sexo: patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : undefined,
    },
    data_emissao: new Date().toISOString().split('T')[0],
    observacoes: params.observations || '',
  };

  // Add medications for prescriptions
  if (params.documentType === 'receita' && params.medications && params.medications.length > 0) {
    payload.medicamentos = params.medications.map(med => ({
      nome: med.name,
      dosagem: med.dosage,
      frequencia: med.frequency,
      duracao: med.duration,
      instrucoes: med.instructions,
    }));
  }

  // Add CID for medical certificates
  if (params.cid) {
    payload.cid = params.cid;
  }

  // Add days for certificates
  if (params.days) {
    payload.dias_afastamento = params.days;
  }

  try {
    const DOMAINS = [
      'https://api.memed.com.br/v1',
      'https://integrations.api.memed.com.br/v1'
    ];

    let lastError = '';

    for (const domain of DOMAINS) {
      const endpoint = `${domain}/sinapse-prescricao/documentos`;

      try {
        console.log(`[Memed] Criando documento via: ${endpoint}`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.api+json',
            'api-key': API_KEY,
            'secret-key': SECRET_KEY,
            'Authorization': `Bearer ${tokenResult.token}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[Memed] Documento criado com sucesso:', data);

          return {
            success: true,
            document: {
              externalId: data.data?.id || data.id,
              signedPdfUrl: data.data?.pdf_url || data.pdf_url,
              status: data.data?.status || 'pending',
              type: params.documentType,
              title: params.title,
            },
          };
        } else {
          const errorData = await response.json();
          console.warn(`[Memed] Erro ao criar documento no ${endpoint}:`, errorData);
          lastError = errorData.errors?.[0]?.detail || errorData.message || 'Erro ao criar documento';

          // If 401/403, clear cache and retry once
          if (response.status === 401 || response.status === 403) {
            clearCachedToken(session.userId);
            console.log('[Memed] Token expirado, limpando cache...');
          }
        }
      } catch (error) {
        console.error(`[Memed] Erro de rede ao criar documento:`, error);
        lastError = 'Erro de conexão com a API Memed';
      }
    }

    return {
      success: false,
      message: `Não foi possível criar o documento. ${lastError}`,
    };
  } catch (error) {
    console.error('[Memed] Erro inesperado:', error);
    return { success: false, message: 'Erro inesperado ao criar documento' };
  }
}

/**
 * List all documents created via Memed
 */
export async function listMemedDocumentsAction() {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    return { success: false, message: 'Não autorizado' };
  }

  const tokenResult = await getMemedTokenAction();
  if (!tokenResult.success || !tokenResult.token) {
    return { success: false, message: tokenResult.message || 'Falha ao obter token Memed' };
  }

  const API_KEY = process.env.MEMED_API_KEY;
  const SECRET_KEY = process.env.MEMED_SECRET_KEY;

  if (!API_KEY || !SECRET_KEY) {
    return { success: false, message: 'Configuração da Memed ausente' };
  }

  try {
    const DOMAINS = [
      'https://api.memed.com.br/v1',
      'https://integrations.api.memed.com.br/v1'
    ];

    for (const domain of DOMAINS) {
      const endpoint = `${domain}/sinapse-prescricao/documentos`;

      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.api+json',
            'api-key': API_KEY,
            'secret-key': SECRET_KEY,
            'Authorization': `Bearer ${tokenResult.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            documents: data.data || [],
          };
        }
      } catch (error) {
        console.error('[Memed] Erro ao listar documentos:', error);
      }
    }

    return { success: false, message: 'Não foi possível listar documentos' };
  } catch (error) {
    console.error('[Memed] Erro inesperado:', error);
    return { success: false, message: 'Erro inesperado' };
  }
}

/**
 * Get a specific document by ID
 */
export async function getMemedDocumentAction(documentId: string) {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    return { success: false, message: 'Não autorizado' };
  }

  const tokenResult = await getMemedTokenAction();
  if (!tokenResult.success || !tokenResult.token) {
    return { success: false, message: tokenResult.message || 'Falha ao obter token' };
  }

  const API_KEY = process.env.MEMED_API_KEY;
  const SECRET_KEY = process.env.MEMED_SECRET_KEY;

  if (!API_KEY || !SECRET_KEY) {
    return { success: false, message: 'Configuração ausente' };
  }

  try {
    const DOMAINS = [
      'https://api.memed.com.br/v1',
      'https://integrations.api.memed.com.br/v1'
    ];

    for (const domain of DOMAINS) {
      const endpoint = `${domain}/sinapse-prescricao/documentos/${documentId}`;

      try {
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/vnd.api+json',
            'api-key': API_KEY,
            'secret-key': SECRET_KEY,
            'Authorization': `Bearer ${tokenResult.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            document: data.data || data,
          };
        }
      } catch (error) {
        console.error('[Memed] Erro ao buscar documento:', error);
      }
    }

    return { success: false, message: 'Documento não encontrado' };
  } catch (error) {
    console.error('[Memed] Erro inesperado:', error);
    return { success: false, message: 'Erro inesperado' };
  }
}

/**
 * Cancel a document
 */
export async function cancelMemedDocumentAction(documentId: string) {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    return { success: false, message: 'Não autorizado' };
  }

  const tokenResult = await getMemedTokenAction();
  if (!tokenResult.success || !tokenResult.token) {
    return { success: false, message: tokenResult.message || 'Falha ao obter token' };
  }

  const API_KEY = process.env.MEMED_API_KEY;
  const SECRET_KEY = process.env.MEMED_SECRET_KEY;

  if (!API_KEY || !SECRET_KEY) {
    return { success: false, message: 'Configuração ausente' };
  }

  try {
    const DOMAINS = [
      'https://api.memed.com.br/v1',
      'https://integrations.api.memed.com.br/v1'
    ];

    for (const domain of DOMAINS) {
      const endpoint = `${domain}/sinapse-prescricao/documentos/${documentId}`;

      try {
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/vnd.api+json',
            'api-key': API_KEY,
            'secret-key': SECRET_KEY,
            'Authorization': `Bearer ${tokenResult.token}`,
          },
        });

        if (response.ok) {
          return { success: true, message: 'Documento cancelado com sucesso' };
        }
      } catch (error) {
        console.error('[Memed] Erro ao cancelar documento:', error);
      }
    }

    return { success: false, message: 'Não foi possível cancelar o documento' };
  } catch (error) {
    console.error('[Memed] Erro inesperado:', error);
    return { success: false, message: 'Erro inesperado' };
  }
}
