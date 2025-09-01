/**
 * Script para testar a autenticação de usuários no banco de dados Firestore
 * Este script verifica se o processo de login está funcionando corretamente
 */

require('dotenv/config');
const { getAdminDb } = require('./src/lib/firebase-admin.js');
const { getPatientByEmailWithAuth, getDoctorByEmailWithAuth } = require('./src/lib/firestore-admin-adapter.js');
const bcrypt = require('bcrypt');

// Função para testar a autenticação de pacientes
async function testPatientAuthentication(email, password) {
  console.log(`Testando autenticação de paciente com email: ${email}`);
  
  try {
    // 1. Buscar paciente pelo email
    const patient = await getPatientByEmailWithAuth(email);
    if (!patient) {
      console.error('ERRO: Paciente não encontrado.');
      return false;
    }
    console.log('Paciente encontrado no banco de dados.');
    
    // 2. Verificar se o paciente tem senha cadastrada
    if (!patient.password) {
      console.error('ERRO: Paciente não possui senha cadastrada.');
      return false;
    }
    
    // 3. Validar a senha
    const passwordIsValid = await bcrypt.compare(password, patient.password);
    if (!passwordIsValid) {
      console.error('ERRO: Senha inválida.');
      return false;
    }
    
    console.log('Autenticação de paciente bem-sucedida!');
    return true;
  } catch (error) {
    console.error('ERRO durante a autenticação de paciente:', error);
    return false;
  }
}

// Função para testar a autenticação de médicos
async function testDoctorAuthentication(email, password) {
  console.log(`Testando autenticação de médico com email: ${email}`);
  
  try {
    // 1. Buscar médico pelo email
    const doctor = await getDoctorByEmailWithAuth(email);
    if (!doctor) {
      console.error('ERRO: Médico não encontrado.');
      return false;
    }
    console.log('Médico encontrado no banco de dados.');
    
    // 2. Verificar se o médico tem senha cadastrada
    if (!doctor.password) {
      console.error('ERRO: Médico não possui senha cadastrada.');
      return false;
    }
    
    // 3. Validar a senha
    const passwordIsValid = await bcrypt.compare(password, doctor.password);
    if (!passwordIsValid) {
      console.error('ERRO: Senha inválida.');
      return false;
    }
    
    console.log('Autenticação de médico bem-sucedida!');
    return true;
  } catch (error) {
    console.error('ERRO durante a autenticação de médico:', error);
    return false;
  }
}

// Função principal para executar os testes
async function runAuthenticationTests() {
  console.log('Iniciando testes de autenticação...');
  
  try {
    // 1. Verificar conexão com o banco de dados
    const adminDb = getAdminDb();
    console.log('Conexão com o Firestore estabelecida com sucesso.');
    
    // 2. Buscar um paciente existente para teste
    const patientsRef = adminDb.collection('patients');
    const patientsSnapshot = await patientsRef.limit(1).get();
    
    if (patientsSnapshot.empty) {
      console.log('Nenhum paciente encontrado para teste de autenticação.');
    } else {
      const patientDoc = patientsSnapshot.docs[0];
      const patientData = patientDoc.data();
      const patientEmail = patientData.email;
      
      // Buscar a senha do paciente (apenas para fins de teste)
      const patientAuthRef = adminDb.collection('patientAuth').doc(patientDoc.id);
      const patientAuthDoc = await patientAuthRef.get();
      
      if (patientAuthDoc.exists) {
        console.log('Teste de autenticação de paciente não pode ser realizado automaticamente.');
        console.log('Para testar, você precisa fornecer uma senha válida para um usuário existente.');
        console.log(`Email do paciente para teste manual: ${patientEmail}`);
      }
    }
    
    // 3. Buscar um médico existente para teste
    const doctorsRef = adminDb.collection('doctors');
    const doctorsSnapshot = await doctorsRef.limit(1).get();
    
    if (doctorsSnapshot.empty) {
      console.log('Nenhum médico encontrado para teste de autenticação.');
    } else {
      const doctorDoc = doctorsSnapshot.docs[0];
      const doctorData = doctorDoc.data();
      const doctorEmail = doctorData.email;
      
      // Buscar a senha do médico (apenas para fins de teste)
      const doctorAuthRef = adminDb.collection('doctorAuth').doc(doctorDoc.id);
      const doctorAuthDoc = await doctorAuthRef.get();
      
      if (doctorAuthDoc.exists) {
        console.log('Teste de autenticação de médico não pode ser realizado automaticamente.');
        console.log('Para testar, você precisa fornecer uma senha válida para um médico existente.');
        console.log(`Email do médico para teste manual: ${doctorEmail}`);
      }
    }
    
    console.log('\nPara testar a autenticação manualmente, execute:');
    console.log('testPatientAuthentication("email@exemplo.com", "senha123") ou');
    console.log('testDoctorAuthentication("medico@exemplo.com", "senha123")');
    
  } catch (error) {
    console.error('ERRO durante os testes de autenticação:', error);
  }
}

// Exportar funções para uso manual
module.exports = { testPatientAuthentication, testDoctorAuthentication };

// Executar os testes
runAuthenticationTests();