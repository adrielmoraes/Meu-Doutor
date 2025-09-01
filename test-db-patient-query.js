/**
 * Script para testar a consulta de dados de pacientes no banco de dados Firestore
 * Este script verifica se as operações de leitura estão funcionando corretamente
 */

require('dotenv/config');
const { getAdminDb } = require('./src/lib/firebase-admin.js');
const { getPatientByEmail, getPatientById } = require('./src/lib/firestore-admin-adapter.js');

async function testPatientQueries() {
  console.log('Iniciando teste de consultas de pacientes...');
  
  try {
    // 1. Verificar conexão com o banco de dados
    const adminDb = getAdminDb();
    console.log('Conexão com o Firestore estabelecida com sucesso.');
    
    // 2. Buscar pacientes existentes para teste
    const patientsRef = adminDb.collection('patients');
    const patientsSnapshot = await patientsRef.limit(5).get();
    
    if (patientsSnapshot.empty) {
      console.log('Nenhum paciente encontrado para teste de consultas.');
      return;
    }
    
    console.log(`Encontrados ${patientsSnapshot.size} pacientes para teste.`);
    
    // 3. Testar consulta por ID
    console.log('\nTestando consulta de paciente por ID...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const patientDoc of patientsSnapshot.docs) {
      const patientId = patientDoc.id;
      const patientData = patientDoc.data();
      
      try {
        const patient = await getPatientById(patientId);
        
        if (patient && patient.id === patientId) {
          console.log(`- Paciente ${patientId} encontrado com sucesso.`);
          successCount++;
          
          // Verificar se os dados correspondem
          const fieldsToCheck = ['name', 'email'];
          let dataMatch = true;
          
          for (const field of fieldsToCheck) {
            if (patient[field] !== patientData[field]) {
              console.log(`  ALERTA: Campo '${field}' não corresponde.`);
              dataMatch = false;
            }
          }
          
          if (dataMatch) {
            console.log('  Todos os campos verificados correspondem.');
          }
        } else {
          console.error(`- ERRO: Paciente ${patientId} não encontrado ou ID não corresponde.`);
          errorCount++;
        }
      } catch (error) {
        console.error(`- ERRO ao consultar paciente ${patientId}:`, error);
        errorCount++;
      }
    }
    
    // 4. Testar consulta por email
    console.log('\nTestando consulta de paciente por email...');
    let emailSuccessCount = 0;
    let emailErrorCount = 0;
    
    for (const patientDoc of patientsSnapshot.docs) {
      const patientData = patientDoc.data();
      const email = patientData.email;
      
      if (!email) {
        console.log(`- Paciente ${patientDoc.id} não possui email cadastrado. Pulando...`);
        continue;
      }
      
      try {
        const patient = await getPatientByEmail(email);
        
        if (patient && patient.email === email) {
          console.log(`- Paciente com email ${email} encontrado com sucesso.`);
          emailSuccessCount++;
        } else {
          console.error(`- ERRO: Paciente com email ${email} não encontrado ou email não corresponde.`);
          emailErrorCount++;
        }
      } catch (error) {
        console.error(`- ERRO ao consultar paciente com email ${email}:`, error);
        emailErrorCount++;
      }
    }
    
    // 5. Resumo dos testes
    console.log('\nResumo dos testes de consulta de pacientes:');
    console.log(`- Consulta por ID: ${successCount} sucesso(s), ${errorCount} erro(s)`);
    console.log(`- Consulta por email: ${emailSuccessCount} sucesso(s), ${emailErrorCount} erro(s)`);
    
    const totalSuccess = successCount + emailSuccessCount;
    const totalError = errorCount + emailErrorCount;
    const totalTests = totalSuccess + totalError;
    
    console.log(`\nTotal: ${totalTests} teste(s), ${totalSuccess} sucesso(s), ${totalError} erro(s)`);
    
    if (totalError === 0) {
      console.log('✅ Todos os testes de consulta de pacientes foram bem-sucedidos!');
      return true;
    } else {
      console.log('⚠️ Alguns testes de consulta de pacientes falharam.');
      return false;
    }
  } catch (error) {
    console.error('ERRO durante o teste de consultas de pacientes:', error);
    return false;
  }
}

// Executar o teste se este arquivo for executado diretamente
if (require.main === module) {
  testPatientQueries()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro não tratado:', error);
      process.exit(1);
    });
}

module.exports = testPatientQueries;