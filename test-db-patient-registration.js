/**
 * Script para testar o registro de pacientes no banco de dados Firestore
 * Este script verifica se o processo de registro está funcionando corretamente
 */

require('dotenv/config');
const { getAdminDb } = require('./src/lib/firebase-admin.js');
const { addPatientWithAuth } = require('./src/lib/firestore-admin-adapter.js');
const bcrypt = require('bcrypt');

async function testPatientRegistration() {
  console.log('Iniciando teste de registro de paciente...');
  
  try {
    // 1. Verificar conexão com o banco de dados
    const adminDb = getAdminDb();
    console.log('Conexão com o Firestore estabelecida com sucesso.');
    
    // 2. Criar dados de teste para um novo paciente
    const testPatient = {
      name: 'Paciente Teste',
      email: `teste-${Date.now()}@exemplo.com`, // Email único para evitar conflitos
      phone: '(11) 98765-4321',
      birthDate: '1990-01-01',
      gender: 'Masculino',
      address: 'Rua de Teste, 123',
      city: 'São Paulo',
      state: 'SP',
      healthInsurance: 'Plano de Saúde Teste',
      healthInsuranceNumber: '123456789',
      emergencyContact: 'Contato de Emergência',
      emergencyPhone: '(11) 12345-6789',
      createdAt: new Date().toISOString(),
    };
    
    const password = 'Senha@123';
    
    // 3. Verificar se o email já existe
    const patientsRef = adminDb.collection('patients');
    const emailQuery = await patientsRef.where('email', '==', testPatient.email).get();
    
    if (!emailQuery.empty) {
      console.error('ERRO: Email já cadastrado.');
      return;
    }
    
    // 4. Gerar hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 5. Salvar paciente no banco de dados
    console.log('Salvando paciente de teste no banco de dados...');
    const patientId = await addPatientWithAuth(testPatient, hashedPassword);
    
    if (!patientId) {
      console.error('ERRO: Falha ao salvar paciente no banco de dados.');
      return;
    }
    
    console.log(`Paciente salvo com sucesso! ID: ${patientId}`);
    
    // 6. Verificar se os dados foram salvos corretamente
    const patientDoc = await adminDb.collection('patients').doc(patientId).get();
    const patientAuthDoc = await adminDb.collection('patientAuth').doc(patientId).get();
    
    if (!patientDoc.exists) {
      console.error('ERRO: Documento do paciente não encontrado após o registro.');
      return;
    }
    
    if (!patientAuthDoc.exists) {
      console.error('ERRO: Documento de autenticação do paciente não encontrado após o registro.');
      return;
    }
    
    const savedPatient = patientDoc.data();
    const savedAuth = patientAuthDoc.data();
    
    console.log('\nVerificação de dados salvos:');
    console.log('- Dados do paciente salvos corretamente:', 
      savedPatient.name === testPatient.name && 
      savedPatient.email === testPatient.email);
    console.log('- Senha hash salva corretamente:', !!savedAuth.password);
    
    // 7. Verificar se a senha hash funciona
    const passwordIsValid = await bcrypt.compare(password, savedAuth.password);
    console.log('- Validação de senha:', passwordIsValid ? 'Sucesso' : 'Falha');
    
    // 8. Limpar dados de teste
    console.log('\nLimpando dados de teste...');
    await adminDb.collection('patients').doc(patientId).delete();
    await adminDb.collection('patientAuth').doc(patientId).delete();
    console.log('Dados de teste removidos com sucesso.');
    
    console.log('\nTeste de registro de paciente concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('ERRO durante o teste de registro de paciente:', error);
    return false;
  }
}

// Executar o teste se este arquivo for executado diretamente
if (require.main === module) {
  testPatientRegistration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro não tratado:', error);
      process.exit(1);
    });
}

module.exports = testPatientRegistration;