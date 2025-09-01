/**
 * Script para testar a integridade do banco de dados Firestore
 * Este script verifica se as coleções e documentos estão estruturados corretamente
 */

require('dotenv/config');
const { getAdminDb } = require('./src/lib/firebase-admin.js');

async function testDatabaseIntegrity() {
  console.log('Iniciando teste de integridade do banco de dados...');
  
  try {
    // 1. Verificar conexão com o banco de dados
    const adminDb = getAdminDb();
    console.log('Conexão com o Firestore estabelecida com sucesso.');
    
    // 2. Verificar se as coleções principais existem
    const requiredCollections = ['patients', 'doctors', 'patientAuth', 'doctorAuth'];
    const collectionResults = {};
    
    for (const collectionName of requiredCollections) {
      const collection = adminDb.collection(collectionName);
      const snapshot = await collection.limit(1).get();
      collectionResults[collectionName] = {
        exists: true,
        hasDocuments: !snapshot.empty
      };
    }
    
    console.log('\nVerificação de coleções:');
    for (const [collection, result] of Object.entries(collectionResults)) {
      console.log(`- ${collection}: ${result.exists ? 'Existe' : 'Não existe'} ${result.hasDocuments ? '(contém documentos)' : '(vazia)'}`);
    }
    
    // 3. Verificar integridade entre patients e patientAuth
    console.log('\nVerificando integridade entre patients e patientAuth...');
    const patientsRef = adminDb.collection('patients');
    const patientsSnapshot = await patientsRef.limit(10).get();
    
    if (patientsSnapshot.empty) {
      console.log('Nenhum paciente encontrado para verificação de integridade.');
    } else {
      let patientAuthIntegrityCount = 0;
      let patientAuthMissingCount = 0;
      
      for (const patientDoc of patientsSnapshot.docs) {
        const patientId = patientDoc.id;
        const patientAuthRef = adminDb.collection('patientAuth').doc(patientId);
        const patientAuthDoc = await patientAuthRef.get();
        
        if (patientAuthDoc.exists) {
          patientAuthIntegrityCount++;
        } else {
          patientAuthMissingCount++;
          console.log(`AVISO: Paciente ${patientId} não possui registro de autenticação correspondente.`);
        }
      }
      
      console.log(`Verificados ${patientsSnapshot.size} pacientes:`);
      console.log(`- ${patientAuthIntegrityCount} pacientes têm registros de autenticação correspondentes`);
      console.log(`- ${patientAuthMissingCount} pacientes não têm registros de autenticação`);
    }
    
    // 4. Verificar integridade entre doctors e doctorAuth
    console.log('\nVerificando integridade entre doctors e doctorAuth...');
    const doctorsRef = adminDb.collection('doctors');
    const doctorsSnapshot = await doctorsRef.limit(10).get();
    
    if (doctorsSnapshot.empty) {
      console.log('Nenhum médico encontrado para verificação de integridade.');
    } else {
      let doctorAuthIntegrityCount = 0;
      let doctorAuthMissingCount = 0;
      
      for (const doctorDoc of doctorsSnapshot.docs) {
        const doctorId = doctorDoc.id;
        const doctorAuthRef = adminDb.collection('doctorAuth').doc(doctorId);
        const doctorAuthDoc = await doctorAuthRef.get();
        
        if (doctorAuthDoc.exists) {
          doctorAuthIntegrityCount++;
        } else {
          doctorAuthMissingCount++;
          console.log(`AVISO: Médico ${doctorId} não possui registro de autenticação correspondente.`);
        }
      }
      
      console.log(`Verificados ${doctorsSnapshot.size} médicos:`);
      console.log(`- ${doctorAuthIntegrityCount} médicos têm registros de autenticação correspondentes`);
      console.log(`- ${doctorAuthMissingCount} médicos não têm registros de autenticação`);
    }
    
    // 5. Verificar subcoleções de exames para pacientes
    console.log('\nVerificando subcoleções de exames para pacientes...');
    let patientsWithExams = 0;
    let totalExams = 0;
    
    for (const patientDoc of patientsSnapshot.docs) {
      const patientId = patientDoc.id;
      const examsRef = adminDb.collection(`patients/${patientId}/exams`);
      const examsSnapshot = await examsRef.get();
      
      if (!examsSnapshot.empty) {
        patientsWithExams++;
        totalExams += examsSnapshot.size;
      }
    }
    
    console.log(`- ${patientsWithExams} de ${patientsSnapshot.size} pacientes têm exames cadastrados`);
    console.log(`- Total de ${totalExams} exames encontrados`);
    
    console.log('\nTeste de integridade do banco de dados concluído!');
    return true;
  } catch (error) {
    console.error('ERRO durante o teste de integridade do banco de dados:', error);
    return false;
  }
}

// Executar o teste se este arquivo for executado diretamente
if (require.main === module) {
  testDatabaseIntegrity()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro não tratado:', error);
      process.exit(1);
    });
}

module.exports = testDatabaseIntegrity;