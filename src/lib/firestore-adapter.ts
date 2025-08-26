
import { db } from './firebase';
import { db as adminDb } from './firebase-admin';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where, writeBatch } from 'firebase/firestore';
import type { Patient, Doctor, Appointment, Exam, PatientWithPassword, DoctorWithPassword } from '@/types';


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
    if (!adminDb) {
      throw new Error('Admin DB not initialized');
    }
    const q = adminDb.collection('patients').where('email', '==', email);
    const patientSnapshot = await q.get();
    if (patientSnapshot.empty) {
        return null;
    }
    const patientDoc = patientSnapshot.docs[0];
    return { id: patientDoc.id, ...patientDoc.data() } as Patient;
}

export async function getPatientByEmailWithAuth(email: string): Promise<PatientWithPassword | null> {
    if (!adminDb) {
        throw new Error("Admin DB not initialized.");
    }
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
    if (!adminDb) {
        throw new Error("Admin DB not initialized.");
    }
    const batch = adminDb.batch();

    const patientRef = adminDb.collection('patients').doc();
    batch.set(patientRef, patientData);

    const authRef = adminDb.collection('patientAuth').doc(patientRef.id);
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
    if (!adminDb) {
        throw new Error("Admin DB not initialized.");
    }
    const q = adminDb.collection('doctors').where('email', '==', email);
    const doctorSnapshot = await q.get();
    if (doctorSnapshot.empty) {
        return null;
    }
    const doctorDoc = doctorSnapshot.docs[0];
    return { id: doctorDoc.id, ...doctorDoc.data() } as Doctor;
}


export async function getDoctorByEmailWithAuth(email: string): Promise<DoctorWithPassword | null> {
    if (!adminDb) {
        throw new Error("Admin DB not initialized.");
    }
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
    if (!adminDb) {
        throw new Error("Admin DB not initialized.");
    }
    const batch = adminDb.batch();

    const doctorRef = adminDb.collection('doctors').doc();
    batch.set(doctorRef, doctorData);

    const authRef = adminDb.collection('doctorAuth').doc(doctorRef.id);
    batch.set(authRef, { password: hashedPassword });

    await batch.commit();
}
