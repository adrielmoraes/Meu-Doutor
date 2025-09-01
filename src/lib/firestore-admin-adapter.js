/**
 * Adaptador para o Firestore Admin
 * Contém funções para autenticação e gerenciamento de usuários
 */

const { getAdminDb } = require('./firebase-admin');
const bcrypt = require('bcrypt');

// Funções para médicos
async function getDoctorByEmail(email) {
  const adminDb = getAdminDb();
  const doctorsRef = adminDb.collection('doctors');
  const snapshot = await doctorsRef.where('email', '==', email).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doctorDoc = snapshot.docs[0];
  return {
    id: doctorDoc.id,
    ...doctorDoc.data()
  };
}

async function getDoctorByEmailWithAuth(email, password) {
  const adminDb = getAdminDb();
  const doctor = await getDoctorByEmail(email);
  
  if (!doctor) {
    return null;
  }
  
  // Buscar a senha na coleção doctorAuth
  const doctorAuthRef = adminDb.collection('doctorAuth').doc(doctor.id);
  const doctorAuth = await doctorAuthRef.get();
  
  if (!doctorAuth.exists) {
    return null;
  }
  
  const authData = doctorAuth.data();
  const passwordMatch = await bcrypt.compare(password, authData.password);
  
  if (!passwordMatch) {
    return null;
  }
  
  return doctor;
}

async function addDoctorWithAuth(doctorData, hashedPassword) {
  const adminDb = getAdminDb();
  
  // Verificar se o email já existe
  const existingDoctor = await getDoctorByEmail(doctorData.email);
  if (existingDoctor) {
    throw new Error('Email já cadastrado');
  }
  
  // Criar novo médico
  const doctorRef = adminDb.collection('doctors').doc();
  
  // Remover senha dos dados do médico se existir
  const { password, ...doctorDataWithoutPassword } = doctorData;
  
  // Criar documento do médico
  await doctorRef.set(doctorDataWithoutPassword);
  
  // Criar documento de autenticação separado
  const doctorAuthRef = adminDb.collection('doctorAuth').doc(doctorRef.id);
  await doctorAuthRef.set({
    email: doctorData.email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  });
  
  return doctorRef.id;
}

// Funções para pacientes
async function getPatientByEmail(email) {
  const adminDb = getAdminDb();
  const patientsRef = adminDb.collection('patients');
  const snapshot = await patientsRef.where('email', '==', email).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const patientDoc = snapshot.docs[0];
  return {
    id: patientDoc.id,
    ...patientDoc.data()
  };
}

async function getPatientByEmailWithAuth(email, password) {
  const adminDb = getAdminDb();
  const patient = await getPatientByEmail(email);
  
  if (!patient) {
    return null;
  }
  
  // Buscar a senha na coleção patientAuth
  const patientAuthRef = adminDb.collection('patientAuth').doc(patient.id);
  const patientAuth = await patientAuthRef.get();
  
  if (!patientAuth.exists) {
    return null;
  }
  
  const authData = patientAuth.data();
  const passwordMatch = await bcrypt.compare(password, authData.password);
  
  if (!passwordMatch) {
    return null;
  }
  
  return patient;
}

async function addPatientWithAuth(patientData, hashedPassword) {
  const adminDb = getAdminDb();
  
  // Verificar se o email já existe
  const existingPatient = await getPatientByEmail(patientData.email);
  if (existingPatient) {
    throw new Error('Email já cadastrado');
  }
  
  // Criar novo paciente
  const patientRef = adminDb.collection('patients').doc();
  
  // Remover senha dos dados do paciente se existir
  const { password, ...patientDataWithoutPassword } = patientData;
  
  // Criar documento do paciente
  await patientRef.set(patientDataWithoutPassword);
  
  // Criar documento de autenticação separado
  const patientAuthRef = adminDb.collection('patientAuth').doc(patientRef.id);
  await patientAuthRef.set({
    email: patientData.email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  });
  
  return patientRef.id;
}

// Função para buscar médico por ID
async function getDoctorById(doctorId) {
  const adminDb = getAdminDb();
  const doctorRef = adminDb.collection('doctors').doc(doctorId);
  const doctorDoc = await doctorRef.get();
  
  if (!doctorDoc.exists) {
    return null;
  }
  
  return {
    id: doctorDoc.id,
    ...doctorDoc.data()
  };
}

// Função para buscar paciente por ID
async function getPatientById(patientId) {
  const adminDb = getAdminDb();
  const patientRef = adminDb.collection('patients').doc(patientId);
  const patientDoc = await patientRef.get();
  
  if (!patientDoc.exists) {
    return null;
  }
  
  return {
    id: patientDoc.id,
    ...patientDoc.data()
  };
}

// Exportar todas as funções
module.exports = {
  getDoctorByEmail,
  getDoctorByEmailWithAuth,
  addDoctorWithAuth,
  getPatientByEmail,
  getPatientByEmailWithAuth,
  addPatientWithAuth,
  getDoctorById,
  getPatientById
};