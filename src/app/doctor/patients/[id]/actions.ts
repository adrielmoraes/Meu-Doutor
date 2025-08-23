
'use server';

import { getPatientById, updatePatient } from '@/lib/firestore-adapter';
import { revalidatePath } from 'next/cache';
import { generateHealthInsights } from '@/ai/flows/generate-health-insights';
import { summarizePatientHistory } from '@/ai/flows/summarize-patient-history';

export async function validateDiagnosisAction(patientId: string, doctorNotes: string) {
  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
        throw new Error("Patient not found");
    }

    // Generate a fresh summary to ensure insights are based on the latest data.
    const historySummary = await summarizePatientHistory({
        conversationHistory: patient.conversationHistory || "Nenhum histórico.",
        reportedSymptoms: patient.reportedSymptoms || "Nenhum sintoma reportado.",
    });

    // Generate the preventive health insights and goals based on the final diagnosis
    const healthInsights = await generateHealthInsights({
        patientHistory: historySummary.summary,
        validatedDiagnosis: doctorNotes,
    });

    // Update the patient document with the validated status, doctor's notes, and the new health plan
    await updatePatient(patientId, {
      status: 'Validado',
      doctorNotes: doctorNotes,
      preventiveAlerts: healthInsights.preventiveAlerts,
      healthGoals: healthInsights.healthGoals,
    });
    
    // Revalidate paths to reflect changes immediately across the app
    revalidatePath(`/doctor/patients/${patientId}`);
    revalidatePath('/doctor/patients');
    revalidatePath('/'); // Revalidate patient dashboard
    
    return { success: true, message: 'Diagnóstico validado com sucesso! Plano de saúde gerado.' };
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
