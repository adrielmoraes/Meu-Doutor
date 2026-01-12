import { NextRequest, NextResponse } from 'next/server';
import { createPrescription } from '@/lib/prescriptions-adapter';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { doctorId, patientId, medications, instructions, type, title, externalId, signedPdfUrl, status } = body;

        if (!doctorId || !patientId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = await createPrescription({
            doctorId,
            patientId,
            medications,
            instructions,
            type,
            title,
            externalId,
            signedPdfUrl,
            status
        });

        return NextResponse.json({ id, message: 'Prescription created successfully' });
    } catch (error) {
        console.error('Error creating prescription:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
