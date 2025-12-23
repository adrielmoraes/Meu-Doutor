
import { NextResponse } from 'next/server';
import { generateHealthPodcast } from '@/ai/flows/generate-health-podcast';
import { db } from '../../../../server/storage';
import { patients, exams } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const patientResult = await db
            .select({
                id: patients.id,
                name: patients.name,
            })
            .from(patients)
            .innerJoin(exams, eq(exams.patientId, patients.id))
            .limit(1);

        const patient = patientResult[0];

        if (!patient) {
            return NextResponse.json({ error: "No patient found" }, { status: 404 });
        }

        const result = await generateHealthPodcast({ patientId: patient.id });

        return NextResponse.json({
            patient: patient.name,
            transcript: result.transcript,
            audioLength: result.audioUrl.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
