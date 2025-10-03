/**
 * Script para testar a consulta de dados de médicos no banco de dados Firestore
 * Este script verifica se as operações de leitura estão funcionando corretamente
 */

require('dotenv/config');
const { getAdminDb } = require('./src/lib/firebase-admin.js');
const { getDoctorByEmail, getDoctorById } = require('./src/lib/firestore-admin-adapter.js');

async function testDoctorQueries() {
  console.log('Iniciando teste de consultas de médicos...');
  
  try {
    // 1. Verificar conexão com o banco de dados
    const adminDb = getAdminDb();
    console.log('Conexão com o Firestore estabelecida com sucesso.');
    
    // 2. Buscar médicos existentes para teste
    const doctorsRef = adminDb.collection('doctors');
    const doctorsSnapshot = await doctorsRef.limit(5).get();
    
    if (doctorsSnapshot.empty) {
      console.log('Nenhum médico encontrado para teste de consultas.');
      return false;
    }
    
    console.log(`Encontrados ${doctorsSnapshot.size} médicos para teste.`);
    
    // 3. Testar consulta por ID
    console.log('\nTestando consulta de médico por ID...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const doctorDoc of doctorsSnapshot.docs) {
      const doctorId = doctorDoc.id;
      const doctorData = doctorDoc.data();
      
      try {
        const doctor = await getDoctorById(doctorId);
        
        if (doctor && doctor.id === doctorId) {
          console.log(`- Médico ${doctorId} encontrado com sucesso.`);
          successCount++;
          
          // Verificar se os dados correspondem
          const fieldsToCheck = ['name', 'email', 'specialty'];
          let dataMatch = true;
          
          for (const field of fieldsToCheck) {
            if (doctor[field] !== doctorData[field]) {
              console.log(`  AVISO: Campo ${field} não corresponde. Esperado: ${doctorData[field]}, Recebido: ${doctor[field]}`);
              dataMatch = false;
            }
          }
          
          if (dataMatch) {
            console.log(`  Todos os campos verificados correspondem.`);
          }
        } else {
          console.error(`- ERRO: Médico ${doctorId} não encontrado ou ID não corresponde.`);
          errorCount++;
        }
      } catch (error) {
        console.error(`- ERRO ao consultar médico ${doctorId}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nResultado da consulta por ID: ${successCount} sucessos, ${errorCount} erros.`);
    
    // 4. Testar consulta por email
    console.log('\nTestando consulta de médico por email...');
    let emailSuccessCount = 0;
    let emailErrorCount = 0;
    
    for (const doctorDoc of doctorsSnapshot.docs) {
      const doctorId = doctorDoc.id;
      const doctorData = doctorDoc.data();
      const email = doctorData.email;
      
      if (!email) {
        console.log(`- Médico ${doctorId} não possui email cadastrado. Pulando teste.`);
        continue;
      }
      
      try {
        const doctor = await getDoctorByEmail(email);
        
        if (doctor && doctor.email === email) {
          console.log(`- Médico com email ${email} encontrado com sucesso.`);
          emailSuccessCount++;
          
          // Verificar se o ID corresponde
          if (doctor.id === doctorId) {
            console.log(`  ID corresponde: ${doctorId}`);
          } else {
            console.log(`  AVISO: ID não corresponde. Esperado: ${doctorId}, Recebido: ${doctor.id}`);
          }
        } else {
          console.error(`- ERRO: Médico com email ${email} não encontrado.`);
          emailErrorCount++;
        }
      } catch (error) {
        console.error(`- ERRO ao consultar médico com email ${email}:`, error);
        emailErrorCount++;
      }
    }
    
    console.log(`\nResultado da consulta por email: ${emailSuccessCount} sucessos, ${emailErrorCount} erros.`);
    
    // 5. Testar consulta com email inexistente
    console.log('\nTestando consulta com email inexistente...');
    const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;
    
    try {
      const doctor = await getDoctorByEmail(nonExistentEmail);
      
      if (doctor) {
        console.error(`- ERRO: Médico encontrado com email inexistente: ${nonExistentEmail}`);
        return false;
      } else {
        console.log(`- Sucesso: Nenhum médico encontrado com email inexistente: ${nonExistentEmail}`);
      }
    } catch (error) {
      console.error(`- ERRO ao consultar email inexistente:`, error);
      return false;
    }
    
    console.log('\nTeste de consultas de médicos concluído!');
    return (errorCount === 0 && emailErrorCount === 0);
  } catch (error) {
    console.error('ERRO durante o teste de consultas de médicos:', error);
    return false;
  }
}

// Executar o teste se este arquivo for executado diretamente
if (require.main === module) {
  testDoctorQueries()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro não tratado:', error);
      process.exit(1);
    });
}

module.exports = testDoctorQueries;