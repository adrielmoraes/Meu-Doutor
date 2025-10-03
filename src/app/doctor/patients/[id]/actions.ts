
'use server';

import { getPatientById, updatePatient, updateExam, getExamsByPatientId } from '@/lib/db-adapter';
import { revalidatePath } from 'next/cache';
import { generateHealthInsights } from '@/ai/flows/generate-health-insights';
import { summarizePatientHistory } from '@/ai/flows/summarize-patient-history';
import { explainDiagnosisToPatient } from '@/ai/flows/explain-diagnosis-flow';

export async function validateExamDiagnosisAction(patientId: string, examId: string, doctorNotes: string) {
  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
        throw new Error("Patient not found");
    }

    // Generate the patient-friendly explanation and audio narration
    const finalExplanation = await explainDiagnosisToPatient({
        diagnosisAndNotes: doctorNotes,
    });
    
    // Update the specific exam with the validated status and doctor's notes
    await updateExam(patientId, examId, {
      status: 'Validado',
      doctorNotes: doctorNotes,
      finalExplanation: finalExplanation.explanation,
      finalExplanationAudioUri: finalExplanation.audioDataUri || "", // Ensure it's a string
    });

    // After validating an exam, check if there are any other exams pending validation
    const allExams = await getExamsByPatientId(patientId);
    const hasPendingExams = allExams.some(exam => exam.status === 'Requer Validação');

    // If no more exams are pending, update the patient's overall status to 'Validado'
    if (!hasPendingExams) {
        await updatePatient(patientId, {
            status: 'Validado',
        });
    }
    
    // Revalidate paths to reflect changes immediately across the app
    revalidatePath(`/doctor/patients/${patientId}`);
    revalidatePath('/doctor/patients');
    revalidatePath(`/patient/history/${examId}`);
    revalidatePath('/patient/dashboard'); // Revalidate patient dashboard
    
    return { success: true, message: 'Exame validado com sucesso!' };
  } catch (error) {
    console.error('Failed to validate exam diagnosis:', error);
    return { success: false, message: 'Erro ao validar o exame.' };
  }
}

export async function saveDraftNotesAction(patientId: string, examId: string, doctorNotes: string) {
    try {
        await updateExam(patientId, examId, {
            doctorNotes: doctorNotes,
        });
        revalidatePath(`/doctor/patients/${patientId}`);
        revalidatePath(`/patient/history/${examId}`);
        return { success: true, message: 'Rascunho salvo com sucesso!' };
    } catch (error)
    {
        console.error('Failed to save draft notes:', error);
        return { success: false, message: 'Erro ao salvar o rascunho.' };
    }
}
