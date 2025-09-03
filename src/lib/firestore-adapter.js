/**
 * Adaptador para o Firestore
 * Contém funções para acesso e manipulação de dados
 */

const { db } = require('./firebase');
const { collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where, deleteDoc } = require('firebase/firestore');

async function getPatients() {
    const patientsCol = collection(db, 'patients');
    const patientSnapshot = await getDocs(patientsCol);
    const patientList = patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return patientList;
}

async function getPatientById(id) {
    const patientDocRef = doc(db, 'patients', id);
    const patientDoc = await getDoc(patientDocRef);
    if (patientDoc.exists()) {
        return { id: patientDoc.id, ...patientDoc.data() };
    }
    return null;
}

async function updatePatient(id, data) {
    const patientDocRef = doc(db, 'patients', id);
    await updateDoc(patientDocRef, data);
}

async function getExamsByPatientId(patientId) {
    const examsCol = collection(db, `patients/${patientId}/exams`);
    const examSnapshot = await getDocs(examsCol);
    const examList = examSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return examList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function getExamById(patientId, examId) {
    const examDocRef = doc(db, `patients/${patientId}/exams`, examId);
    const examDoc = await getDoc(examDocRef);

    if (examDoc.exists()) {
        return { id: examDoc.id, ...examDoc.data() };
    }
    return null;
}

async function addExamToPatient(patientId, examData) {
    const examsCol = collection(db, `patients/${patientId}/exams`);
    const examDocData = {
        ...examData,
        patientId: patientId,
        date: new Date().toISOString(),
        status: 'pending'
    };
    const docRef = await addDoc(examsCol, examDocData);
    return docRef.id;
}

async function updateExam(patientId, examId, data) {
    const examDocRef = doc(db, `patients/${patientId}/exams`, examId);
    await updateDoc(examDocRef, data);
}

async function getDoctors() {
    const doctorsCol = collection(db, 'doctors');
    const doctorSnapshot = await getDocs(doctorsCol);
    const doctorList = doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return doctorList;
}

async function getDoctorById(id) {
    const doctorDocRef = doc(db, 'doctors', id);
    const doctorDoc = await getDoc(doctorDocRef);
    if (doctorDoc.exists()) {
        return { id: doctorDoc.id, ...doctorDoc.data() };
    }
    return null;
}

async function updateDoctor(id, data) {
    const doctorDocRef = doc(db, 'doctors', id);
    await updateDoc(doctorDocRef, data);
}

module.exports = {
    getPatients,
    getPatientById,
    updatePatient,
    getExamsByPatientId,
    getExamById,
    addExamToPatient,
    updateExam,
    getDoctors,
    getDoctorById,
    updateDoctor
};