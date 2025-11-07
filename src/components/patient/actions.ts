'use server';

import { addExamToPatient, updatePatient, addAppointment, deleteExam, trackUsage } from "@/lib/db-adapter";
import { revalidatePath } from "next/cache";
import type { Appointment, Exam } from "@/types";
import { regeneratePatientWellnessPlan } from "@/ai/flows/update-wellness-plan";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface ExamAnalysisData {
    preliminaryDiagnosis: string;
    explanation: string;
    suggestions: string;
    fileName: string;
    structuredResults?: { name: string; value: string; reference: string }[];
    specialistFindings?: Array<{
        specialist: string;
        findings: string;
        clinicalAssessment: string;
        recommendations: string;
    }>;
}

export async function saveExamAnalysisAction(patientId: string, analysisData: ExamAnalysisData): Promise<{ success: boolean; message: string; examId?: string; }> {
    try {
        const newExamId = await addExamToPatient(patientId, {
            type: analysisData.fileName,
            result: analysisData.preliminaryDiagnosis,
            icon: 'FileText',
            preliminaryDiagnosis: analysisData.preliminaryDiagnosis,
            explanation: analysisData.explanation,
            suggestions: analysisData.suggestions,
            results: analysisData.structuredResults || [],
            specialistFindings: analysisData.specialistFindings || [],
        });

        // Track exam analysis usage
        trackUsage({
            patientId,
            usageType: 'exam_analysis',
            resourceName: analysisData.fileName,
        }).catch(error => {
            console.error('[Usage Tracking] Failed to track exam analysis:', error);
        });

        // Trigger wellness plan update in the background (fire-and-forget)
        regeneratePatientWellnessPlan(patientId).catch(error => {
            console.error('[saveExamAnalysisAction] Failed to update wellness plan:', error);
        });

        // Revalidate pages to show the new exam and potentially updated wellness plan
        revalidatePath('/patient/history');
        revalidatePath('/patient/wellness');

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

export async function addExamAction(patientId: string, examData: Omit<Exam, 'id'>): Promise<{ success: boolean; examId?: string; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  try {
    const examId = await addExamToPatient(patientId, examData);

    // Se houve um erro ao adicionar o exame, lança uma exceção para ser capturada pelo catch
    if (!examId) {
      throw new Error('Falha ao adicionar o exame ao paciente');
    }

    // Registrar uso do recurso
    const { trackResourceUsage } = await import('@/lib/subscription-limits');
    await trackResourceUsage(session.userId, 'exam_analysis', {
      resourceName: examData.type,
    });

    revalidatePath('/patient/history');
    return { success: true, examId };
  } catch (error: any) {
    console.error('Erro ao adicionar exame:', error);
    return { success: false, error: error.message };
  }
}