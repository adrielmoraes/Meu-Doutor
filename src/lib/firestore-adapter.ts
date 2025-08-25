

import { db } from './firebase';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { Patient, Doctor, Appointment, Exam } from '@/types';


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

export async function getPatientByEmail(email: string): Promise<Patient | null> {
    const patientsCol = collection(db, 'patients');
    const q = query(patientsCol, where('email', '==', email));
    const patientSnapshot = await getDocs(q);
    if (patientSnapshot.empty) {
        return null;
    }
    const patientDoc = patientSnapshot.docs[0];
    return { id: patientDoc.id, ...patientDoc.data() } as Patient;
}


export async function addPatientWithAuth(patientData: Omit<Patient, 'id'>, hashedPassword: string): Promise<void> {
    const batch = writeBatch(db);

    const patientRef = doc(collection(db, 'patients'));
    batch.set(patientRef, patientData);

    const authRef = doc(db, 'patientAuth', patientRef.id);
    batch.set(authRef, { password: hashedPassword });

    await batch.commit();
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<void> {
    const patientDocRef = doc(db, 'patients', id);
    await updateDoc(patientDocRef, data);
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

export async function getDoctors(): Promise<Doctor[]> {
    const doctorsCol = collection(db, 'doctors');
    const doctorSnapshot = await getDocs(doctorsCol);
    const doctorList = doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
    return doctorList;
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
    const doctorDocRef = doc(db, 'doctors', id);
    const doctorDoc = await getDoc(doctorDocRef);
    if (doctorDoc.exists()) {
        return { id: doctorDoc.id, ...doctorDoc.data() } as Doctor;
    }
    return null;
}

export async function getDoctorByEmail(email: string): Promise<Doctor | null> {
    const doctorsCol = collection(db, 'doctors');
    const q = query(doctorsCol, where('email', '==', email));
    const doctorSnapshot = await getDocs(q);
    if (doctorSnapshot.empty) {
        return null;
    }
    const doctorDoc = doctorSnapshot.docs[0];
    return { id: doctorDoc.id, ...doctorDoc.data() } as Doctor;
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

export async function addDoctorWithAuth(doctorData: Omit<Doctor, 'id'>, hashedPassword: string): Promise<void> {
    const batch = writeBatch(db);

    const doctorRef = doc(collection(db, 'doctors'));
    batch.set(doctorRef, doctorData);

    const authRef = doc(db, 'doctorAuth', doctorRef.id);
    batch.set(authRef, { password: hashedPassword });

    await batch.commit();
}
