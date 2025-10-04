'use server';

import { regeneratePatientWellnessPlan } from '@/ai/flows/update-wellness-plan';
import { revalidatePath } from 'next/cache';

export async function regenerateWellnessPlanAction(patientId: string): Promise<{ success: boolean; message: string }> {
  try {
    await regeneratePatientWellnessPlan(patientId);
    revalidatePath('/patient/wellness');
    return { success: true, message: 'Plano de bem-estar atualizado com sucesso!' };
  } catch (error) {
    console.error('[regenerateWellnessPlanAction] Error:', error);
    return { success: false, message: 'Erro ao atualizar o plano de bem-estar.' };
  }
}
