'use server';

import { regeneratePatientWellnessPlan } from '@/ai/flows/update-wellness-plan';
import { revalidatePath } from 'next/cache';
import { getPatientById, updatePatientWellnessPlan } from '@/lib/db-adapter';

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

export async function toggleWeeklyTaskAction(
  patientId: string, 
  taskId: string, 
  completed: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const patient = await getPatientById(patientId);
    if (!patient || !patient.wellnessPlan) {
      return { success: false, message: 'Plano de bem-estar não encontrado.' };
    }

    const updatedTasks = patient.wellnessPlan.weeklyTasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }
      return task;
    });

    const updatedPlan = {
      ...patient.wellnessPlan,
      weeklyTasks: updatedTasks,
    };

    await updatePatientWellnessPlan(patientId, updatedPlan);
    revalidatePath('/patient/wellness');
    
    return { 
      success: true, 
      message: completed ? 'Tarefa marcada como concluída!' : 'Tarefa desmarcada.' 
    };
  } catch (error) {
    console.error('[toggleWeeklyTaskAction] Error:', error);
    return { success: false, message: 'Erro ao atualizar tarefa.' };
  }
}
