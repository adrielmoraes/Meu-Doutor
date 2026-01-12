import { db } from '../../server/storage';
import { prescriptions } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface Prescription {
    id: string;
    doctorId: string;
    patientId: string;
    medications: any; // Using any for JSON structure
    instructions?: string | null;
    signedPdfUrl?: string | null;
    signatureMethod?: 'a1_local' | 'bry_cloud' | null;
    bryTransactionId?: string | null;
    externalId?: string | null;
    status: 'draft' | 'pending_process' | 'signed' | 'error';
    createdAt: Date;
    updatedAt: Date;
}

export async function createPrescription(data: {
    doctorId: string;
    patientId: string;
    type?: 'receita' | 'atestado' | 'laudo' | 'outro';
    title?: string;
    medications?: any;
    instructions?: string;
    externalId?: string;
    signedPdfUrl?: string;
    status?: 'draft' | 'signed';
}): Promise<string> {
    const id = randomUUID();
    await db.insert(prescriptions).values({
        id,
        ...data,
        status: data.status || 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return id;
}

export async function getPrescriptionById(id: string): Promise<Prescription | null> {
    const result = await db.select().from(prescriptions).where(eq(prescriptions.id, id)).limit(1);
    return result[0] ? (result[0] as Prescription) : null;
}

export async function updatePrescriptionStatus(
    id: string,
    status: Prescription['status'],
    signedPdfUrl?: string,
    signatureMethod?: Prescription['signatureMethod'],
    bryTransactionId?: string
) {
    const updateData: any = { status, updatedAt: new Date() };
    if (signedPdfUrl) updateData.signedPdfUrl = signedPdfUrl;
    if (signatureMethod) updateData.signatureMethod = signatureMethod;
    if (bryTransactionId) updateData.bryTransactionId = bryTransactionId;

    await db.update(prescriptions).set(updateData).where(eq(prescriptions.id, id));
}

export async function getPrescriptionsByDoctor(doctorId: string) {
    return await db.select().from(prescriptions).where(eq(prescriptions.doctorId, doctorId)).orderBy(desc(prescriptions.createdAt));
}

export async function getPrescriptionsByPatient(patientId: string) {
    return await db.select().from(prescriptions).where(eq(prescriptions.patientId, patientId)).orderBy(desc(prescriptions.createdAt));
}
