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

    console.log('[updatePatientQuotas] Iniciando atualização de cotas para paciente:', patientId);
    console.log('[updatePatientQuotas] Cotas recebidas:', JSON.stringify(quotas, null, 2));

    const cleanedQuotas: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(quotas)) {
      if (value !== null && value !== undefined) {
        cleanedQuotas[key] = value;
      }
    }

    const customQuotasToSave = Object.keys(cleanedQuotas).length > 0 
      ? cleanedQuotas 
      : null;

    console.log('[updatePatientQuotas] Cotas a serem salvas no banco:', JSON.stringify(customQuotasToSave, null, 2));

    await db
      .update(patients)
      .set({
        customQuotas: customQuotasToSave as any,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, patientId));

    // Verificar se foi salvo corretamente
    const updatedPatient = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
    console.log('[updatePatientQuotas] Cotas salvas no banco (verificação):', JSON.stringify(updatedPatient[0]?.customQuotas, null, 2));

    // Revalidação agressiva de cache
    revalidatePath(`/admin/patients/${patientId}`, 'page');
    revalidatePath('/admin/patients', 'page');
    revalidatePath('/api/check-limit', 'page');

    console.log('[updatePatientQuotas] ✅ Cotas atualizadas e cache invalidado com sucesso!');

    return {
      success: true,
      message: 'Cotas atualizadas com sucesso!',
    };
  } catch (error: any) {
    console.error('[updatePatientQuotas] ❌ Erro ao atualizar cotas:', error);
    return {
      success: false,
      message: error.message || 'Erro ao atualizar cotas do paciente.',
    };
  }
}
