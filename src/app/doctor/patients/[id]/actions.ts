
'use server';

import { getPatientById, updatePatient, updateExam, getExamsByPatientId } from '@/lib/db-adapter';
import { revalidatePath } from 'next/cache';
import { generateHealthInsights } from '@/ai/flows/generate-health-insights';
import { summarizePatientHistory } from '@/ai/flows/summarize-patient-history';
import { explainDiagnosisToPatient } from '@/ai/flows/explain-diagnosis-flow';
import { regeneratePatientWellnessPlan } from '@/ai/flows/update-wellness-plan';

import { saveFileBuffer } from '@/lib/file-storage';

export async function validateExamDiagnosisAction(patientId: string, examId: string, doctorNotes: string) {
  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
        throw new Error("Patient not found");
    }

    // Generate the patient-friendly explanation and audio narration
    const finalExplanation = await explainDiagnosisToPatient({
        diagnosisAndNotes: doctorNotes,
        patientId,
    });
    
    let audioUrl = "";
    if (finalExplanation.audioDataUri) {
        try {
            // Convert Data URI to Buffer
            const audioBuffer = Buffer.from(finalExplanation.audioDataUri.split(',')[1], 'base64');
            // Upload to Vercel Blob
            audioUrl = await saveFileBuffer(audioBuffer, `diagnosis-explanation-${examId}.mp3`, 'diagnosis-audio');
        } catch (uploadError) {
            console.error("Error uploading diagnosis audio:", uploadError);
            // Fallback: keep empty or handle error. 
            // If upload fails, we might still want to save the explanation text.
        }
    }

    // Update the specific exam with the validated status and doctor's notes
    await updateExam(patientId, examId, {
      status: 'Validado',
      doctorNotes: doctorNotes,
      finalExplanation: finalExplanation.explanation,
      finalExplanationAudioUri: audioUrl, 
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

    try {
      await regeneratePatientWellnessPlan(patientId);
    } catch (error) {
      console.error('[validateExamDiagnosisAction] Failed to update wellness plan:', error);
    }
    
    // Revalidate paths to reflect changes immediately across the app
    revalidatePath(`/doctor/patients/${patientId}`);
    revalidatePath('/doctor/patients');
    revalidatePath(`/patient/history/${examId}`);
    revalidatePath('/patient/dashboard'); // Revalidate patient dashboard
    revalidatePath('/patient/wellness');
    
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

export async function validateMultipleExamsAction(patientId: string, examIds: string[]) {
    try {
        const patient = await getPatientById(patientId);
        if (!patient) throw new Error("Patient not found");

        for (const examId of examIds) {
             await updateExam(patientId, examId, {
                status: 'Validado',
                doctorNotes: 'Exame revisado. Resultados dentro dos parâmetros aceitáveis.',
                finalExplanation: 'Seu médico revisou este exame e confirmou que está tudo certo.',
             });
        }
        
        const allExams = await getExamsByPatientId(patientId);
        const hasPendingExams = allExams.some(exam => exam.status === 'Requer Validação');

        if (!hasPendingExams) {
            await updatePatient(patientId, { status: 'Validado' });
        }

        try {
            await regeneratePatientWellnessPlan(patientId);
        } catch (error) {
            console.error('[validateMultipleExamsAction] Failed to update wellness plan:', error);
        }

        revalidatePath(`/doctor/patients/${patientId}`);
        revalidatePath('/patient/wellness');
        return { success: true, message: `${examIds.length} exames validados com sucesso.` };

    } catch (error) {
        console.error("Bulk validation error:", error);
        return { success: false, message: "Erro na validação em lote." };
    }
}
