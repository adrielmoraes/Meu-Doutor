
'use server';

import { addExamToPatient, updatePatient, addAppointment, deleteExam } from "@/lib/firestore-adapter";
import { revalidatePath } from "next/cache";
import type { Appointment } from "@/types";

interface ExamAnalysisData {
    preliminaryDiagnosis: string;
    explanation: string;
    suggestions: string;
    fileName: string;
}

export async function saveExamAnalysisAction(patientId: string, analysisData: ExamAnalysisData): Promise<{ success: boolean; message: string; examId?: string; }> {
    try {
        const newExamId = await addExamToPatient(patientId, {
            type: analysisData.fileName,
            result: analysisData.preliminaryDiagnosis,
            icon: 'FileText',
            ...analysisData
        });
        // Revalidate the history page to show the new exam
        revalidatePath('/patient/history');
        return { success: true, message: 'Análise salva com sucesso!', examId: newExamId };
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

export async function createAppointmentAction(appointmentData: Omit<Appointment, 'id'>) {
    try {
        await addAppointment(appointmentData);
        // Revalidate the doctor's schedule to show the new appointment
        revalidatePath('/doctor/schedule');
        return { success: true, message: 'Consulta agendada com sucesso!' };
    } catch (error) {
        console.error('Failed to create appointment:', error);
        return { success: false, message: 'Erro ao agendar a consulta.' };
    }
}

export async function deleteExamAction(patientId: string, examId: string) {
    try {
        await deleteExam(patientId, examId);
        revalidatePath('/patient/history');
        return { success: true, message: 'Exame excluído com sucesso!' };
    } catch (error) {
        console.error('Failed to delete exam:', error);
        return { success: false, message: 'Erro ao excluir o exame.' };
    }
}
