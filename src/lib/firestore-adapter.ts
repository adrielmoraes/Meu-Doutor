


import { db } from './firebase';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import type { Patient, Doctor, Exam, Appointment } from '@/types';
import { db as adminDb } from './firebase-admin';

export async function getPatients(): Promise<Patient[]> {
    const patientsCol = collection(db, 'patients');
    const patientSnapshot = await getDocs(patientsCol);
    const patientList = patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
    return patientList;
}

export async function getPatientById(id: string): Promise<Patient | null> {
    const patientDocRef = doc(db, 'patients', id);
    const patientDoc = await getDoc(patientDocRef);
    if (patientDoc.exists()) {
        return { id: patientDoc.id, ...patientDoc.data() } as Patient;
    }
    return null;
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<void> {
    const patientDocRef = doc(db, 'patients', id);
    await updateDoc(patientDocRef, data);
}


export async function getDoctors(): Promise<Doctor[]> {
    if (!adminDb) {
        console.warn('Admin DB not initialized. Skipping getDoctors.');
        return [];
    }
    const doctorsCol = adminDb.collection('doctors');
    const doctorSnapshot = await doctorsCol.get();
    const doctorList = doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
    return doctorList;
}

export async function getExamsByPatientId(patientId: string): Promise<Exam[]> {
    const examsCol = collection(db, `patients/${patientId}/exams`);
    const examSnapshot = await getDocs(examsCol);
    const examList = examSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    return examList;
}

export async function getExamById(patientId: string, examId: string): Promise<Exam | null> {
    const examDocRef = doc(db, `patients/${patientId}/exams`, examId);
    const examDoc = await getDoc(examDocRef);
    if (examDoc.exists()) {
        return { id: examDoc.id, ...examDoc.data() } as Exam;
    }
    return null;
}

export async function addExamToPatient(patientId: string, examData: Omit<Exam, 'id' | 'date'>) {
    const examsCol = collection(db, `patients/${patientId}/exams`);
    const examDoc = {
        ...examData,
        date: new Date().toISOString(),
    };
    await addDoc(examsCol, examDoc);
}

export async function getAppointments(): Promise<Appointment[]> {
    const appointmentsCol = collection(db, 'appointments');
    const appointmentSnapshot = await getDocs(appointmentsCol);
    const appointmentList = appointmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    // For now, we will just return all appointments. In a real app, you'd filter by doctor, date, etc.
    return appointmentList;
}

export async function getAppointmentsByDate(doctorId: string, date: string): Promise<Appointment[]> {
    const appointmentsCol = collection(db, 'appointments');
    const q = query(
        appointmentsCol,
        where('doctorId', '==', doctorId),
        where('date', '==', date)
    );
    const appointmentSnapshot = await getDocs(q);
    return appointmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
}

export async function addAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<void> {
    const appointmentsCol = collection(db, 'appointments');
    await addDoc(appointmentsCol, appointmentData);
}
