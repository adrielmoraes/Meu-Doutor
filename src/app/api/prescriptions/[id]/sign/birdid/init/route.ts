import { NextRequest, NextResponse } from 'next/server';
import { fetchBirdIdAuthUrl } from '@/services/signature-service';
import { getPrescriptionById } from '@/lib/prescriptions-adapter';
import { getDoctorById, getPatientById } from '@/lib/db-adapter';
import { generatePrescriptionPDF } from '@/services/prescription-pdf';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        const prescription = await getPrescriptionById(id);
        if (!prescription) {
            return NextResponse.json({ error: 'Prescrição não encontrada' }, { status: 404 });
        }

        const doctor = await getDoctorById(prescription.doctorId);
        const patient = await getPatientById(prescription.patientId);

        if (!doctor || !patient) {
            return NextResponse.json({ error: 'Médico ou paciente não encontrado' }, { status: 404 });
        }

        const pdfBytes = await generatePrescriptionPDF({
            doctorName: doctor.name,
            doctorCRM: doctor.crm,
            patientName: patient.name,
            medications: prescription.medications,
            instructions: prescription.instructions || undefined,
            date: new Date()
        });

        const url = await fetchBirdIdAuthUrl(id, Buffer.from(pdfBytes));
        return NextResponse.redirect(url);
    } catch (error: any) {
        console.error('[BirdID Init] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
