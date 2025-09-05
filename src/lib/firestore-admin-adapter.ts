
'use server';

import type { Doctor, DoctorWithPassword, Patient, PatientWithPassword, Exam, Appointment } from '@/types';
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

export async function getDoctorById(id: string): Promise<Doctor | null> {
    const adminDb = getAdminDb();
    const doctorDoc = await adminDb.collection('doctors').doc(id).get();
    if (!doctorDoc.exists) {
        return null;
    }
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

export async function getDoctors(): Promise<Doctor[]> {
    const adminDb = getAdminDb();
    const doctorsSnapshot = await adminDb.collection('doctors').get();
    const doctors: Doctor[] = [];
    doctorsSnapshot.forEach(doc => {
        doctors.push({ id: doc.id, ...doc.data() } as Doctor);
    });
    return doctors;
}

export async function addDoctorWithAuth(doctorData: Omit<Doctor, 'id'>, hashedPassword: string): Promise<void> {
    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    const doctorRef = adminDb.collection('doctors').doc(); 
    batch.set(doctorRef, doctorData);

    const authRef = adminDb.collection('doctorAuth').doc(doctorRef.id);
    batch.set(authRef, { password: hashedPassword });

    await batch.commit();
}

export async function getPatients(): Promise<Patient[]> {
    const adminDb = getAdminDb();
    const patientsSnapshot = await adminDb.collection('patients').get();
    const patients: Patient[] = [];
    patientsSnapshot.forEach(doc => {
        patients.push({ id: doc.id, ...doc.data() } as Patient);
    });
    return patients;
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

export async function getPatientById(id: string): Promise<Patient | null> {
    const adminDb = getAdminDb();
    const patientDoc = await adminDb.collection('patients').doc(id).get();
    if (!patientDoc.exists) {
        return null;
    }
    return { id: patientDoc.id, ...patientDoc.data() } as Patient;
}

export async function getExamsByPatientId(patientId: string): Promise<Exam[]> {
    const adminDb = getAdminDb();
    const examsSnapshot = await adminDb.collection('patients').doc(patientId).collection('exams').orderBy('date', 'desc').get();
    const exams: Exam[] = [];
    examsSnapshot.forEach(doc => {
        exams.push({ id: doc.id, ...doc.data() } as Exam);
    });
    return exams;
}

export async function getAppointmentsByDate(doctorId: string, date: string): Promise<Appointment[]> {
    const adminDb = getAdminDb();
    const appointmentsSnapshot = await adminDb.collection('appointments')
        .where('doctorId', '==', doctorId)
        .where('date', '==', date)
        .get();
    const appointments: Appointment[] = [];
    appointmentsSnapshot.forEach(doc => {
        appointments.push({ id: doc.id, ...doc.data() } as Appointment);
    });
    return appointments;
}

export async function addAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<void> {
    const adminDb = getAdminDb();
    await adminDb.collection('appointments').add(appointmentData);
}

export async function updateDoctorAvailability(doctorId: string, availability: { date: string; time: string; available: boolean }[]): Promise<void> {
    const adminDb = getAdminDb();
    await adminDb.collection('doctors').doc(doctorId).update({ availability });
}

export async function getAllAppointmentsForDoctor(doctorId: string): Promise<Appointment[]> {
    const adminDb = getAdminDb();
    const appointmentsSnapshot = await adminDb.collection('appointments')
        .where('doctorId', '==', doctorId)
        .orderBy('date', 'desc')
        .orderBy('time', 'asc')
        .get();
    const appointments: Appointment[] = [];
    appointmentsSnapshot.forEach(doc => {
        appointments.push({ id: doc.id, ...doc.data() } as Appointment);
    });
    return appointments;
}

export async function updateDoctorStatus(doctorId: string, status: boolean): Promise<void> {
    const adminDb = getAdminDb();
    await adminDb.collection('doctors').doc(doctorId).update({ online: status });
}

export async function getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
    const adminDb = getAdminDb();
    const appointmentsSnapshot = await adminDb.collection('appointments')
        .where('patientId', '==', patientId)
        .orderBy('date', 'asc')
        .orderBy('time', 'asc')
        .get();
    const appointments: Appointment[] = [];
    appointmentsSnapshot.forEach(doc => {
        appointments.push({ id: doc.id, ...doc.data() } as Appointment);
    });
    return appointments;
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

    const patientRef = adminDb.collection('patients').doc();
    batch.set(patientRef, patientData);

    const authRef = adminDb.collection('patientAuth').doc(patientRef.id);
    batch.set(authRef, { password: hashedPassword });

    await batch.commit();
}
