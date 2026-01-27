import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionById, updatePrescriptionStatus } from '@/lib/prescriptions-adapter';
import { finalizeBirdIdSignature } from '@/services/signature-service';
import { saveFileBuffer } from '@/lib/file-storage';
import { regeneratePatientWellnessPlan } from '@/ai/flows/update-wellness-plan';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code || !state) {
        console.error('[BirdID Callback] Erro ou parâmetros ausentes:', { error, code: !!code, state: !!state });
        return NextResponse.redirect(new URL('/doctor?error=birdid_auth_failed', req.url));
    }

    const [prescriptionId, tcn] = state.split(':');

    if (!prescriptionId || !tcn) {
        console.error('[BirdID Callback] State inválido:', state);
        return NextResponse.redirect(new URL('/doctor?error=invalid_state', req.url));
    }

    try {
        const prescription = await getPrescriptionById(prescriptionId);
        if (!prescription) {
            throw new Error('Prescrição não encontrada');
        }

        const { signedPdf, transactionId } = await finalizeBirdIdSignature(tcn, code);

        const fileName = `prescription_${prescriptionId}_signed_birdid.pdf`;
        const signedPdfUrl = await saveFileBuffer(Buffer.from(signedPdf), fileName, 'prescriptions');

        await updatePrescriptionStatus(
            prescriptionId,
            'signed',
            signedPdfUrl,
            'birdid_cloud',
            transactionId
        );

        try {
            await regeneratePatientWellnessPlan(prescription.patientId);
        } catch (planError) {
            console.error('[BirdID] Erro ao regenerar plano de bem-estar:', planError);
        }

        return NextResponse.redirect(new URL('/doctor?success=prescription_signed', req.url));

    } catch (err: any) {
        console.error('[BirdID Callback] Erro:', err);
        return NextResponse.redirect(new URL(`/doctor?error=${encodeURIComponent(err.message)}`, req.url));
    }
}
