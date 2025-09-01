/**
 * Script para testar a atualização de dados de pacientes no banco de dados Firestore
 * Este script verifica se o processo de atualização está funcionando corretamente
 */

require('dotenv/config');
const { getAdminDb } = require('./src/lib/firebase-admin.js');
const { getPatientById } = require('./src/lib/firestore-adapter.js');

// Função para testar a atualização de dados de pacientes
async function testPatientUpdate() {
  console.log('Iniciando teste de atualização de dados de pacientes...');
  
  try {
    // 1. Verificar conexão com o banco de dados
    const adminDb = getAdminDb();
    console.log('Conexão com o Firestore estabelecida com sucesso.');
    
    // 2. Buscar um paciente existente para teste
    const patientsRef = adminDb.collection('patients');
    const patientsSnapshot = await patientsRef.limit(1).get();
    
    if (patientsSnapshot.empty) {
      console.error('ERRO: Nenhum paciente encontrado para teste de atualização.');
      return false;
    }
    
    const patientDoc = patientsSnapshot.docs[0];
    const patientId = patientDoc.id;
    const originalData = patientDoc.data();
    
    console.log(`Paciente encontrado para teste: ID ${patientId}`);
    console.log('Dados originais:', originalData);
    
    // 3. Atualizar dados do paciente
    const updateData = {
      lastUpdate: new Date().toISOString(),
      testField: `Teste de atualização ${Date.now()}`
    };
    
    console.log('Atualizando dados do paciente...');
    await patientsRef.doc(patientId).update(updateData);
    
    // 4. Verificar se os dados foram atualizados corretamente
    const updatedPatient = await getPatientById(patientId);
    
    if (!updatedPatient) {
      console.error('ERRO: Não foi possível recuperar o paciente após a atualização.');
      return false;
    }
    
    console.log('Dados atualizados:', updatedPatient);
    
    // 5. Verificar se os campos foram atualizados corretamente
    if (updatedPatient.testField === updateData.testField) {
      console.log('✅ Atualização de dados do paciente realizada com sucesso!');
    } else {
      console.error('❌ Falha na atualização de dados do paciente.');
      return false;
    }
    
    // 6. Restaurar dados originais (remover campo de teste)
    console.log('Restaurando dados originais...');
    await patientsRef.doc(patientId).update({
      testField: null
    });
    
    console.log('Teste de atualização de dados de pacientes concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('ERRO durante o teste de atualização de paciente:', error);
    return false;
  }
}

// Executar o teste
testPatientUpdate();