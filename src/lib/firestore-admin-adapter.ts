
'use server';

import type { Doctor, DoctorWithPassword, Patient, PatientWithPassword } from '@/types';
import { getAdminDb } from './firebase-admin';


export async function getDoctorByEmail(email: string): Promise<Doctor | null> {
    const adminDb = getAdminDb();
    const q = adminDb.collection('doctors').where('email', '==', email);
    const doctorSnapshot = await q.get();
    if (doctorSnapshot.empty) {
        return null;
    }
    const doctorDoc = doctorSnapshot.docs[0];
    return { id: doctorDoc.id, ...doctorDoc.data() } as Doctor;
}


export async function getDoctorByEmailWithAuth(email: string): Promise<DoctorWithPassword | null> {
    const adminDb = getAdminDb();
    const q = adminDb.collection('doctors').where('email', '==', email);
    const snapshot = await q.get();

    if (snapshot.empty) {
        return null;
    }
    const doctorDoc = snapshot.docs[0];
    const doctorData = doctorDoc.data() as Doctor;

    const authDoc = await adminDb.collection('doctorAuth').doc(doctorDoc.id).get();
    const password = authDoc.exists ? authDoc.data()?.password : null;


    return { id: doctorDoc.id, ...doctorData, password };
}

export async function addDoctorWithAuth(doctorData: Omit<Doctor, 'id'>, hashedPassword: string): Promise<void> {
    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    const doctorRef = adminDb.collection('doctors').doc(); // Firestore generates the ID
    batch.set(doctorRef, doctorData);

    const authRef = adminDb.collection('doctorAuth').doc(doctorRef.id);
    batch.set(authRef, { password: hashedPassword });

    await batch.commit();
}

export async function getPatientByEmail(email: string): Promise<Patient | null> {
    const adminDb = getAdminDb();
    const q = adminDb.collection('patients').where('email', '==', email);
    const patientSnapshot = await q.get();
    if (patientSnapshot.empty) {
        return null;
    }
    const patientDoc = patientSnapshot.docs[0];
    return { id: patientDoc.id, ...patientDoc.data() } as Patient;
}

export async function getPatientByEmailWithAuth(email: string): Promise<PatientWithPassword | null> {
    const adminDb = getAdminDb();
    const q = adminDb.collection('patients').where('email', '==', email);
    const snapshot = await q.get();

    if (snapshot.empty) {
        return null;
    }
    const patientDoc = snapshot.docs[0];
    const patientData = patientDoc.data() as Patient;

    const authDoc = await adminDb.collection('patientAuth').doc(patientDoc.id).get();
    const password = authDoc.exists ? authDoc.data()?.password : null;

    return { id: patientDoc.id, ...patientData, password };
}

export async function addPatientWithAuth(patientData: Omit<Patient, 'id'>, hashedPassword: string): Promise<void> {
    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    const patientRef = adminDb.collection('patients').doc(); // Firestore generates the ID
    batch.set(patientRef, patientData);

    const authRef = adminDb.collection('patientAuth').doc(patientRef.id);
    batch.set(authRef, { password: hashedPassword });

    await batch.commit();
}
