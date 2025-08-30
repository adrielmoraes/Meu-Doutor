

import { db } from './firebase';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where, deleteDoc } from 'firebase/firestore';
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

export async function addExamToPatient(patientId: string, examData: Omit<Exam, 'id' | 'date'>): Promise<string> {
    const examsCol = collection(db, `patients/${patientId}/exams`);
    const examDocData = {
        ...examData,
        date: new Date().toISOString(),
    };
    const docRef = await addDoc(examsCol, examDocData);
    return docRef.id;
}


export async function deleteExam(patientId: string, examId: string): Promise<void> {
    const examDocRef = doc(db, `patients/${patientId}/exams`, examId);
    await deleteDoc(examDocRef);
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
