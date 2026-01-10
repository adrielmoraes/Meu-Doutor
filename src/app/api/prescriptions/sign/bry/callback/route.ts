import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionById, updatePrescriptionStatus } from '@/lib/prescriptions-adapter';
import { getDoctorById, getPatientById } from '@/lib/db-adapter';
import { generatePrescriptionPDF } from '@/services/prescription-pdf';
import { finalizeBrySignature } from '@/services/signature-service';
import { saveFileBuffer } from '@/lib/file-storage';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const prescriptionId = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code || !prescriptionId) {
        return NextResponse.redirect(new URL('/doctor?error=bry_auth_failed', req.url));
    }

    try {
        // 1. Fetch Data
        const prescription = await getPrescriptionById(prescriptionId);
        if (!prescription) throw new Error('Prescription not found');

        const doctor = await getDoctorById(prescription.doctorId);
        const patient = await getPatientById(prescription.patientId);

        if (!doctor || !patient) throw new Error('Entities not found');

        // 2. Generate PDF
        const pdfBytes = await generatePrescriptionPDF({
            doctorName: doctor.name,
            doctorCRM: doctor.crm,
            patientName: patient.name,
            medications: prescription.medications,
            instructions: prescription.instructions || undefined,
            date: new Date()
        });

        // 3. Sign with BRy
        const { signedPdf, transactionId } = await finalizeBrySignature(
            prescriptionId,
            code,
            Buffer.from(pdfBytes)
        );

        // 4. Save and Update
        const fileName = `prescription_${prescriptionId}_signed_bry.pdf`;
        const signedPdfUrl = await saveFileBuffer(Buffer.from(signedPdf), fileName, 'prescriptions');

        await updatePrescriptionStatus(
            prescriptionId,
            'signed',
            signedPdfUrl,
            'bry_cloud',
            transactionId
        );

        // 5. Success Redirect
        return NextResponse.redirect(new URL('/doctor?success=prescription_signed', req.url));

    } catch (err: any) {
        console.error('BRy Callback Error:', err);
        return NextResponse.redirect(new URL(`/doctor?error=${encodeURIComponent(err.message)}`, req.url));
    }
}
