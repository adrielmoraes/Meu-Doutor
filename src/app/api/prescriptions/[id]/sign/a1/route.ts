import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionById, updatePrescriptionStatus } from '@/lib/prescriptions-adapter';
import { getDoctorById, getPatientById } from '@/lib/db-adapter';
import { generatePrescriptionPDF } from '@/services/prescription-pdf';
import { signWithA1 } from '@/services/signature-service';
import { saveFileBuffer } from '@/lib/file-storage';
import { regeneratePatientWellnessPlan } from '@/ai/flows/update-wellness-plan';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next.js 15
) {
    try {
        const { id } = await params;
        const formData = await req.formData();
        const pfxFile = formData.get('pfx') as File;
        const password = formData.get('password') as string;

        if (!pfxFile || !password) {
            return NextResponse.json({ error: 'Missing PFX file or password' }, { status: 400 });
        }

        // 1. Fetch Data
        const prescription = await getPrescriptionById(id);
        if (!prescription) {
            return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
        }

        const doctor = await getDoctorById(prescription.doctorId);
        const patient = await getPatientById(prescription.patientId);

        if (!doctor || !patient) {
            return NextResponse.json({ error: 'Doctor or Patient not found' }, { status: 404 });
        }

        // 2. Generate PDF Draft
        const pdfBytes = await generatePrescriptionPDF({
            doctorName: doctor.name,
            doctorCRM: doctor.crm,
            patientName: patient.name,
            medications: prescription.medications,
            instructions: prescription.instructions || undefined,
            date: new Date()
        });

        // 3. Prepare buffers
        const pdfBuffer = Buffer.from(pdfBytes);
        const pfxArrayBuffer = await pfxFile.arrayBuffer();
        const pfxBuffer = Buffer.from(pfxArrayBuffer);

        // 4. Sign PDF (Local A1)
        const { signedPdf } = await signWithA1(pdfBuffer, pfxBuffer, password);

        // 5. Upload Signed PDF
        const fileName = `prescription_${id}_signed.pdf`;
        const signedPdfUrl = await saveFileBuffer(Buffer.from(signedPdf), fileName, 'prescriptions');

        // 6. Update DB
        await updatePrescriptionStatus(id, 'signed', signedPdfUrl, 'a1_local');

        // 7. Trigger Wellness Plan Update
        try {
            await regeneratePatientWellnessPlan(prescription.patientId);
        } catch (planError) {
            console.error('Error regenerating wellness plan after A1 signature:', planError);
        }

        return NextResponse.json({
            success: true,
            url: signedPdfUrl
        });

    } catch (error: any) {
        console.error('Error signing prescription:', error);
        return NextResponse.json({ error: error.message || 'Signing failed' }, { status: 500 });
    }
}
