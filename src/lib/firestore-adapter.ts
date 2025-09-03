

import { getAdminDb } from './firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import type { Patient, Doctor, Appointment, Exam } from '@/types';


export async function getPatients(): Promise<Patient[]> {
    const db = getAdminDb();
    const patientsCol = db.collection('patients');
    const patientSnapshot = await patientsCol.get();
    const patientList = patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
    return patientList;
}

export async function getPatientById(id: string): Promise<Patient | null> {
    const db = getAdminDb();
    const patientDocRef = db.collection('patients').doc(id);
    const patientDoc = await patientDocRef.get();
    if (patientDoc.exists) {
        return { id: patientDoc.id, ...patientDoc.data() } as Patient;
    }
    return null;
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<void> {
    const db = getAdminDb();
    const patientDocRef = db.collection('patients').doc(id);
    await patientDocRef.update(data);
}

export async function getExamsByPatientId(patientId: string): Promise<Exam[]> {
    const db = getAdminDb();
    const examsCol = db.collection('patients').doc(patientId).collection('exams');
    const examSnapshot = await examsCol.get();
    const examList = examSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    return examList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getExamById(patientId: string, examId: string): Promise<Exam | null> {
    const db = getAdminDb();
    const examDocRef = db.collection('patients').doc(patientId).collection('exams').doc(examId);
    const examDoc = await examDocRef.get();

    if (examDoc.exists) {
        return { id: examDoc.id, ...examDoc.data() } as Exam;
    }
    return null;
}

export async function addExamToPatient(patientId: string, examData: Omit<Exam, 'id' | 'date' | 'status' | 'patientId'>): Promise<string> {
    const db = getAdminDb();
    const examsCol = db.collection('patients').doc(patientId).collection('exams');
    const examDocData = {
        ...examData,
        patientId: patientId,
        date: new Date().toISOString(),
        status: 'Requer Validação' as const,
    };
    const docRef = await examsCol.add(examDocData);
    return docRef.id;
}

export async function updateExam(patientId: string, examId: string, data: Partial<Exam>): Promise<void> {
    const db = getAdminDb();
    const examDocRef = db.collection('patients').doc(patientId).collection('exams').doc(examId);
    await examDocRef.update(data);
}


export async function deleteExam(patientId: string, examId: string): Promise<void> {
    const db = getAdminDb();
    const examDocRef = db.collection('patients').doc(patientId).collection('exams').doc(examId);
    await examDocRef.delete();
}


export async function getDoctors(): Promise<Doctor[]> {
    const db = getAdminDb();
    const doctorsCol = db.collection('doctors');
    const doctorSnapshot = await doctorsCol.get();
    const doctorList = doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
    return doctorList;
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
    const db = getAdminDb();
    const doctorDocRef = db.collection('doctors').doc(id);
    const doctorDoc = await doctorDocRef.get();
    if (doctorDoc.exists) {
        return { id: doctorDoc.id, ...doctorDoc.data() } as Doctor;
    }
    return null;
}


export async function getAppointments(): Promise<Appointment[]> {
    const db = getAdminDb();
    const appointmentsCol = db.collection('appointments');
    const appointmentSnapshot = await appointmentsCol.get();
    const appointmentList = appointmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    // For now, we will just return all appointments. In a real app, you'd filter by doctor, date, etc.
    return appointmentList;
}

export async function getAppointmentsByDate(doctorId: string, date: string): Promise<Appointment[]> {
    const db = getAdminDb();
    const appointmentsCol = db.collection('appointments');
    const q = appointmentsCol
        .where('doctorId', '==', doctorId)
        .where('date', '==', date);
    const appointmentSnapshot = await q.get();
    return appointmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
}

export async function addAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<void> {
    const db = getAdminDb();
    const appointmentsCol = db.collection('appointments');
    await appointmentsCol.add(appointmentData);
}
