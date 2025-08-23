
'use server';

import { updatePatient } from '@/lib/firestore-adapter';
import { revalidatePath } from 'next/cache';

export async function validateDiagnosisAction(patientId: string, doctorNotes: string) {
  try {
    await updatePatient(patientId, {
      status: 'Validado',
      doctorNotes: doctorNotes,
    });
    // Revalidate the patient detail page to show the new status immediately
    revalidatePath(`/doctor/patients/${patientId}`);
    // Revalidate the patient list page to update the status badge
    revalidatePath('/doctor/patients');
    return { success: true, message: 'Diagnóstico validado com sucesso!' };
  } catch (error) {
    console.error('Failed to validate diagnosis:', error);
    return { success: false, message: 'Erro ao validar o diagnóstico.' };
  }
}

export async function saveDraftNotesAction(patientId: string, doctorNotes: string) {
    try {
        await updatePatient(patientId, {
            doctorNotes: doctorNotes,
        });
        revalidatePath(`/doctor/patients/${patientId}`);
        return { success: true, message: 'Rascunho salvo com sucesso!' };
    } catch (error)
    {
        console.error('Failed to save draft notes:', error);
        return { success: false, message: 'Erro ao salvar o rascunho.' };
    }
}
