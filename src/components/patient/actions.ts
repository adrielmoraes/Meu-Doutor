
'use server';

import { addExamToPatient, updatePatient } from "@/lib/firestore-adapter";
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

export async function saveConversationHistoryAction(patientId: string, history: {role: 'user' | 'model', content: string}[]) {
    try {
        const conversationText = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        await updatePatient(patientId, {
            conversationHistory: conversationText
        });
        revalidatePath(`/doctor/patients/${patientId}`);
        return { success: true, message: 'Histórico da conversa salvo com sucesso!' };
    } catch (error) {
        console.error('Failed to save conversation history:', error);
        return { success: false, message: 'Erro ao salvar o histórico da conversa.' };
    }
}
