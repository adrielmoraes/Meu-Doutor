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

  // Chaves fornecidas pelo usuário
  const API_KEY = process.env.MEMED_API_KEY;
  const SECRET_KEY = process.env.MEMED_SECRET_KEY;

  if (!API_KEY || !SECRET_KEY) {
    return { success: false, message: 'Configuração da Memed (API_KEY/SECRET_KEY) ausente no servidor.' };
  }

  // Tentar diferentes domínios e variações de rota
  const DOMAINS = [
    'https://sandbox.api.memed.com.br/v1', // Potential sandbox API
    'https://api.memed.com.br/v1',
    'https://integrations.api.memed.com.br/v1'
  ];

  const PATHS = [
    '/sinapse-prescricao/usuarios', // Correct endpoint for registering/updating doc and getting token
    '/sinapse-prescricao/tokens',
    '/sinapse-prescricao/token',
    '/doctors/tokens'
  ];

  const doctor = await getDoctorById(session.userId);
  if (!doctor) {
    return { success: false, message: 'Médico não encontrado no banco de dados.' };
  }

  // Validate CPF if provided
  if (doctor.cpf && !validateCPF(doctor.cpf)) {
    return { success: false, message: 'CPF inválido cadastrado no sistema. Por favor, atualize seu cadastro.' };
  }

  // Validate required fields for Memed
  if (!doctor.cpf) {
    return { success: false, message: 'CPF é obrigatório para integração com Memed. Atualize seu perfil.' };
  }

  let lastError = '';

  // Split name into first and last name
  const nameParts = doctor.name.trim().split(/\s+/);
  const primeiroNome = nameParts[0];
  const sobrenome = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Doutor'; // Fallback if no last name

  for (const domain of DOMAINS) {
    for (const path of PATHS) {
      // Append keys to query params as fallback/requirement for some endpoints
      const endpoint = `${domain}${path}?api-key=${API_KEY}&secret-key=${SECRET_KEY}`;

      const payloadAttributes = {
        external_id: session.userId,
        nome: primeiroNome,
        sobrenome: sobrenome,
        cpf: numbersOnly(doctor.cpf),
        crm: numbersOnly(doctor.crm), // Memed requires only numbers
        uf: doctor.state,
        data_nascimento: doctor.birthDate || '',
        telefone: doctor.phone ? numbersOnly(doctor.phone) : '',
        especialidade: doctor.specialty
      };

      try {
        console.log(`[Memed] Payload para ${endpoint}:`, JSON.stringify(payloadAttributes, null, 2));
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.api+json',
            'api-key': API_KEY, // Keep headers just in case
            'secret-key': SECRET_KEY
          },
          body: JSON.stringify({
            data: {
              type: 'usuarios',
              attributes: payloadAttributes
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Adjust for JSON:API response structure if needed, but usually token is top-level or in data
          const token = data.data?.attributes?.token || data.data?.token || data.token;
          const expiresIn = data.data?.attributes?.expires_in || data.data?.expires_in || data.expires_in || 3600;

          console.log(`[Memed] Autenticação bem sucedida no endpoint: ${endpoint}`);

          // Cache the token
          setCachedToken(session.userId, token, expiresIn);

          return { success: true, token, expiresIn };
        } else {
          // Handle non-JSON errors gracefully
          const errorText = await response.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { message: 'Erro não-JSON da API', body: errorText };
          }

          console.warn(`[Memed] Falha no endpoint ${endpoint} (Status: ${response.status}):`, errorData);
          lastError = errorData.errors?.[0]?.detail || errorData.message || `Erro ${response.status}: ${errorText.substring(0, 100)}`;
        }
      } catch (error) {
        console.error(`[Memed] Erro de rede no endpoint ${endpoint}:`, error);
        lastError = 'Erro de conexão com a API Memed';
      }
    }
  }

  return {
    success: false,
    message: `Não foi possível autenticar na API Memed. ${lastError}. Por favor, verifique se as chaves API_KEY e SECRET_KEY estão corretas e se o módulo 'sinapse-prescricao' está ativo para esta integração.`
  };
}

export async function searchMemedMedicinesAction(query: string) {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    throw new Error("Não autorizado");
  }

  if (!query || query.length < 3) return { success: true, results: [] };

  const API_KEY = process.env.MEMED_API_KEY;
  const BASE_URL = process.env.MEMED_API_URL || 'https://integrations.api.memed.com.br/v1';

  if (!API_KEY) return { success: false, message: 'Memed não configurada.' };

  try {
    const response = await fetch(`${BASE_URL}/drugs/ingredients?terms=${encodeURIComponent(query)}&api-key=${API_KEY}`, {
      headers: {
        'Accept': 'application/vnd.api+json'
      }
    });
    if (!response.ok) throw new Error('Falha na busca');

    const data = await response.json();
    const results = (data.data || []).map((item: any) => ({
      name: item.nome,
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }));

    return { success: true, results };
  } catch (error) {
    console.error('Memed Search Error:', error);
    return { success: false, message: 'Erro na busca da Memed.' };
  }
}

/**
 * Create a medical document (prescription, certificate, report) via Memed API
 */
export async function createMemedDocumentAction(params: {
  patientId: string;
  documentType: 'receita' | 'atestado' | 'laudo' | 'exame';
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
