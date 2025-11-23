'use server';

import { db } from '../../../../server/storage';
import { patients } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

interface CustomQuotas {
  examAnalysis?: number | null;
  aiConsultationMinutes?: number | null;
  doctorConsultationMinutes?: number | null;
  therapistChat?: number | null;
  trialDurationDays?: number | null;
}

export async function updatePatientQuotas(
  patientId: string,
  quotas: CustomQuotas
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return {
        success: false,
        message: 'Acesso negado. Apenas administradores podem atualizar cotas.',
      };
    }

    const cleanedQuotas: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(quotas)) {
      if (value !== null && value !== undefined) {
        cleanedQuotas[key] = value;
      }
    }

    const customQuotasToSave = Object.keys(cleanedQuotas).length > 0 
      ? cleanedQuotas 
      : null;

    await db
      .update(patients)
      .set({
        customQuotas: customQuotasToSave as any,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, patientId));

    revalidatePath(`/admin/patients/${patientId}`);
    revalidatePath('/admin/patients');

    return {
      success: true,
      message: 'Cotas atualizadas com sucesso!',
    };
  } catch (error: any) {
    console.error('[updatePatientQuotas] Error:', error);
    return {
      success: false,
      message: error.message || 'Erro ao atualizar cotas do paciente.',
    };
  }
}
