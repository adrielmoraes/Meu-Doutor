'use server';

import { updateDoctorStatus, getPatientMedicalContext } from '@/lib/db-adapter';
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
