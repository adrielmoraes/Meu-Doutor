
'use server';

import { addExamToPatient } from "@/lib/firestore-adapter";
import { revalidatePath } from "next/cache";

interface ExamAnalysisData {
    preliminaryDiagnosis: string;
    explanation: string;
    fileName: string;
}

export async function saveExamAnalysisAction(patientId: string, analysisData: ExamAnalysisData) {
    try {
        await addExamToPatient(patientId, {
            type: analysisData.fileName,
            result: analysisData.preliminaryDiagnosis,
            icon: 'FileText',
            ...analysisData
        });
        // Revalidate the history page to show the new exam
        revalidatePath('/patient/history');
        return { success: true, message: 'Análise salva com sucesso!' };
    } catch (error) {
        console.error('Failed to save exam analysis:', error);
        return { success: false, message: 'Erro ao salvar a análise do exame.' };
    }
}
