
'use server';

import { addExamToPatient, updatePatient, addAppointment, deleteExam, trackUsage, updateExam } from "@/lib/db-adapter";
import { revalidatePath } from "next/cache";
import type { Appointment, Exam } from "@/types";
import { regeneratePatientWellnessPlan } from "@/ai/flows/update-wellness-plan";
import { getSession } from "@/lib/session";
import { calculateLLMCost, usdToBRLCents } from "@/lib/ai-pricing";
import { countTextTokens } from "@/lib/token-counter";
import { analyzeSingleExam, type SingleDocumentOutput } from "@/ai/flows/analyze-single-exam";
import { consolidateExamsAnalysis, type IndividualExamResult } from "@/ai/flows/consolidate-exams-analysis";

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

        // Calculate token estimates based on output text
        // Input: ~15K tokens for context + exam + specialist instructions (based on TOKEN_ESTIMATES)
        // Output: calculated from actual response text
        const outputText = [
            analysisData.preliminaryDiagnosis,
            analysisData.explanation,
            analysisData.suggestions,
            ...(analysisData.specialistFindings || []).map(f => 
                `${f.specialist}: ${f.findings} ${f.clinicalAssessment} ${f.recommendations}`
            ),
        ].join(' ');
        
        const outputTokens = countTextTokens(outputText);
        const inputTokens = 15000; // Estimated based on context + documents + specialist prompts
        const specialistCount = analysisData.specialistFindings?.length || 1;
        
        // Calculate cost
        const model = 'gemini-2.5-flash';
        const { totalCost } = calculateLLMCost(model, inputTokens, outputTokens);
        const costCents = usdToBRLCents(totalCost);

        // Track exam analysis usage with token estimates
        trackUsage({
            patientId,
            usageType: 'exam_analysis',
            resourceName: analysisData.fileName,
            model,
            inputTokens,
            outputTokens,
            tokensUsed: inputTokens + outputTokens,
            cost: costCents,
            metadata: {
                examId: newExamId,
                specialistCount,
                inputTokens,
                outputTokens,
                costUSD: totalCost,
            },
        }).catch(error => {
            console.error('[Usage Tracking] Failed to track exam analysis:', error);
        });

        console.log(`[Exam Analysis] Tracked usage - Input: ${inputTokens}, Output: ${outputTokens}, Cost: R$${(costCents / 100).toFixed(2)}`);

        // Trigger wellness plan update in the background (fire-and-forget)
        regeneratePatientWellnessPlan(patientId).catch(error => {
            console.error('[saveExamAnalysisAction] Failed to update wellness plan:', error);
            console.error('[saveExamAnalysisAction] Error details:', {
                message: error.message,
                stack: error.stack,
                patientId,
            });
            // Note: Error is logged but not thrown to avoid blocking exam save
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
    const session = await getSession();
    if (!session?.userId) {
        return { success: false, error: 'Usuário não autenticado' };
    }

    try {
        const examId = await addExamToPatient(patientId, examData);

        if (!examId) {
            throw new Error('Falha ao adicionar o exame ao paciente');
        }

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

export type SingleExamAnalysisResult = {
    success: boolean;
    examId?: string;
    analysis?: SingleDocumentOutput;
    error?: string;
};

export async function analyzeSingleExamAction(
    patientId: string,
    document: { examDataUri: string; fileName: string }
): Promise<SingleExamAnalysisResult> {
    try {
        console.log(`[Analyze Single Exam] Starting analysis for: ${document.fileName}`);
        
        const analysis = await analyzeSingleExam(document);
        
        const examId = await addExamToPatient(patientId, {
            type: document.fileName,
            result: analysis.examResultsSummary.substring(0, 200) + '...',
            icon: 'FileText',
            preliminaryDiagnosis: 'Aguardando consolidação...',
            explanation: analysis.patientExplanation,
            suggestions: 'A ser gerado após análise completa.',
            results: analysis.structuredResults || [],
            specialistFindings: [],
        });

        const outputText = [
            analysis.examResultsSummary,
            analysis.patientExplanation,
        ].join(' ');
        
        const outputTokens = countTextTokens(outputText);
        const inputTokens = 3000;
        const model = 'gemini-2.5-flash';
        const { totalCost } = calculateLLMCost(model, inputTokens, outputTokens);
        const costCents = usdToBRLCents(totalCost);

        trackUsage({
            patientId,
            usageType: 'exam_analysis',
            resourceName: `single_${document.fileName}`,
            model,
            inputTokens,
            outputTokens,
            tokensUsed: inputTokens + outputTokens,
            cost: costCents,
            metadata: {
                examId,
                stage: 'individual',
                documentType: analysis.documentType,
            },
        }).catch(error => {
            console.error('[Usage Tracking] Failed to track single exam analysis:', error);
        });

        console.log(`[Analyze Single Exam] ✅ Completed: ${document.fileName}, examId: ${examId}`);
        
        return { success: true, examId, analysis };
    } catch (error: any) {
        console.error(`[Analyze Single Exam] ❌ Failed: ${document.fileName}`, error);
        return { success: false, error: error.message };
    }
}

export type ConsolidationResult = {
    success: boolean;
    message: string;
    primaryExamId?: string;
};

export async function consolidateExamsAction(
    patientId: string,
    examResults: Array<{
        fileName: string;
        examId: string;
        analysis: SingleDocumentOutput;
    }>
): Promise<ConsolidationResult> {
    try {
        console.log(`[Consolidate Exams] Consolidating ${examResults.length} exam(s)...`);
        
        const consolidatedAnalysis = await consolidateExamsAnalysis(examResults);
        
        const primaryExamId = consolidatedAnalysis.examIds[0];
        
        for (const examId of consolidatedAnalysis.examIds) {
            await updateExam(patientId, examId, {
                preliminaryDiagnosis: consolidatedAnalysis.preliminaryDiagnosis,
                explanation: consolidatedAnalysis.explanation,
                suggestions: consolidatedAnalysis.suggestions,
                specialistFindings: consolidatedAnalysis.specialistFindings || [],
            });
        }

        const outputText = [
            consolidatedAnalysis.preliminaryDiagnosis,
            consolidatedAnalysis.explanation,
            consolidatedAnalysis.suggestions,
            ...(consolidatedAnalysis.specialistFindings || []).map(f => 
                `${f.specialist}: ${f.findings} ${f.clinicalAssessment} ${f.recommendations}`
            ),
        ].join(' ');
        
        const outputTokens = countTextTokens(outputText);
        const specialistCount = consolidatedAnalysis.specialistFindings?.length || 1;
        const triageTokens = 1700;
        const tokensPerSpecialist = 4500;
        const synthesisTokens = 5000;
        const inputTokens = triageTokens + (specialistCount * tokensPerSpecialist) + synthesisTokens;
        const model = 'gemini-2.5-flash';
        const { totalCost } = calculateLLMCost(model, inputTokens, outputTokens);
        const costCents = usdToBRLCents(totalCost);

        trackUsage({
            patientId,
            usageType: 'diagnosis',
            resourceName: `multi_specialist_diagnosis_${specialistCount}_specialists`,
            model,
            inputTokens,
            outputTokens,
            tokensUsed: inputTokens + outputTokens,
            cost: costCents,
            metadata: {
                examIds: consolidatedAnalysis.examIds,
                specialistCount,
                stage: 'multi_specialist_diagnosis',
            },
        }).catch(error => {
            console.error('[Usage Tracking] Failed to track multi-specialist diagnosis:', error);
        });

        console.log(`[Consolidate Exams] ✅ Consolidation complete`);

        regeneratePatientWellnessPlan(patientId).catch(error => {
            console.error('[Consolidate Exams] Failed to update wellness plan:', error);
        });

        revalidatePath('/patient/history');
        revalidatePath('/patient/wellness');

        return { 
            success: true, 
            message: 'Análise consolidada com sucesso!', 
            primaryExamId 
        };
    } catch (error: any) {
        console.error('[Consolidate Exams] ❌ Failed:', error);
        return { success: false, message: error.message };
    }
}
