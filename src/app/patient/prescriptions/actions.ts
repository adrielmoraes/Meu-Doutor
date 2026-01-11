'use server';

import { db } from '@/server/storage';
import { prescriptions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { getSession } from "@/lib/session";
import { explainDocumentFlow } from "@/ai/flows/explain-document-flow";
import { saveFileBuffer } from "@/lib/file-storage";
import { revalidatePath } from "next/cache";

export async function explainPatientDocumentAction(prescriptionId: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'patient') {
            throw new Error("Não autorizado");
        }

        // 1. Get Prescription
        const [doc] = await db
            .select()
            .from(prescriptions)
            .where(eq(prescriptions.id, prescriptionId))
            .limit(1);

        if (!doc) throw new Error("Documento não encontrado");
        if (doc.patientId !== session.userId) throw new Error("Acesso negado");

        // 2. Prepare content for AI
        let content = doc.instructions || "";
        if (doc.type === 'receita' && doc.medications) {
            const meds = doc.medications as any[];
            const medsText = meds.map(m => `- ${m.name}: ${m.dosage} (${m.frequency})`).join('\n');
            content = `MEDICAMENTOS:\n${medsText}\n\nINSTRUÇÕES:\n${content}`;
        }

        // 3. Run AI Flow
        const aiResult = await explainDocumentFlow({
            patientId: session.userId,
            documentType: doc.type,
            documentTitle: doc.title || undefined,
            content: content
        });

        // 4. Save Audio if exists
        let audioUrl = "";
        if (aiResult.audioDataUri) {
            const audioBuffer = Buffer.from(aiResult.audioDataUri.split(',')[1], 'base64');
            audioUrl = await saveFileBuffer(audioBuffer, `explanation-${prescriptionId}.mp3`, 'prescriptions-audio');
        }

        // 5. Update DB
        await db
            .update(prescriptions)
            .set({
                aiExplanation: aiResult.explanation,
                aiExplanationAudioUri: audioUrl,
                updatedAt: new Date()
            })
            .where(eq(prescriptions.id, prescriptionId));

        revalidatePath('/patient/prescriptions');

        return { success: true, explanation: aiResult.explanation, audioUrl };

    } catch (error: any) {
        console.error('Error explaining document:', error);
        return { success: false, message: error.message };
    }
}
