
import { db } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Patient, Doctor, Exam } from '@/types';

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

export async function getDoctors(): Promise<Doctor[]> {
    const doctorsCol = collection(db, 'doctors');
    const doctorSnapshot = await getDocs(doctorsCol);
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
