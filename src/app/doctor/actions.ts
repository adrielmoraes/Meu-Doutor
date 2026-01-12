'use server';

import { updateDoctorStatus, getPatientMedicalContext, getDoctorById } from '@/lib/db-adapter';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { generateDocumentDraftFlow } from '@/ai/flows/generate-document-draft-flow';

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

  // Chaves fornecidas pelo usuário
  const API_KEY = process.env.MEMED_API_KEY;
  const SECRET_KEY = process.env.MEMED_SECRET_KEY;
  const BASE_URL = process.env.MEMED_API_URL || 'https://integrations.api.memed.com.br/v1';

  if (!API_KEY || !SECRET_KEY) {
    return { success: false, message: 'Configuração da Memed (API_KEY/SECRET_KEY) ausente no servidor.' };
  }

  // Tentar diferentes domínios e variações de rota
  const DOMAINS = [
    'https://api.memed.com.br/v1',
    'https://integrations.api.memed.com.br/v1'
  ];

  const PATHS = [
    '/sinapse-prescricao/tokens',
    '/sinapse-prescricao/token'
  ];

  const doctor = await getDoctorById(session.userId);
  if (!doctor) {
    return { success: false, message: 'Médico não encontrado no banco de dados.' };
  }

  let lastError = '';

  for (const domain of DOMAINS) {
    for (const path of PATHS) {
      const endpoint = `${domain}${path}`;
      try {
        console.log(`[Memed] Tentando autenticação via: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.api+json', // Formato exigido pela Memed
            'api-key': API_KEY,
            'secret-key': SECRET_KEY
          },
          body: JSON.stringify({
            external_id: session.userId,
            nome: doctor.name,
            cpf: doctor.cpf || '',
            crm: doctor.crm,
            uf: doctor.state,
            data_nascimento: doctor.birthDate || '',
            telefone: doctor.phone || '',
            especialidade: doctor.specialty
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[Memed] Autenticação bem sucedida no endpoint: ${endpoint}`);
          return { success: true, token: data.data.token };
        } else {
          const errorData = await response.json();
          console.warn(`[Memed] Falha no endpoint ${endpoint}:`, errorData);
          lastError = errorData.errors?.[0]?.detail || 'Erro na rota';
        }
      } catch (error) {
        console.error(`[Memed] Erro de rede no endpoint ${endpoint}:`, error);
      }
    }
  }

  return {
    success: false,
    message: `Falha na autenticação Memed. Último erro: ${lastError}. Por favor, verifique se as chaves API_KEY e SECRET_KEY estão corretas e se o módulo 'sinapse-prescricao' está ativo para esta integração.`
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
