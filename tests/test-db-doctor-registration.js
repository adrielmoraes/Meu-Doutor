/**
 * Script para testar o registro de médicos no banco de dados Firestore
 * Este script verifica se os dados de cadastro de médicos estão sendo salvos corretamente
 */

require('dotenv/config');
const { getAdminDb } = require('./src/lib/firebase-admin.js');
const { addDoctorWithAuth, getDoctorByEmail } = require('./src/lib/firestore-admin-adapter.js');
const bcrypt = require('bcrypt');

// Dados de teste para um médico fictício
const testDoctor = {
  name: 'Médico Teste',
  email: `medico-teste-${Date.now()}@example.com`, // Email único para evitar conflitos
  specialty: 'Clínico Geral',
  city: 'São Paulo',
  state: 'SP',
  online: false,
  avatar: 'https://placehold.co/128x128.png',
  avatarHint: 'person portrait',
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  validations: 0,
  badges: [],
};

const testPassword = 'senha123';

async function testDoctorRegistration() {
  console.log('Iniciando teste de registro de médico...');
  
  try {
    // 1. Verificar conexão com o banco de dados
    const adminDb = getAdminDb();
    console.log('Conexão com o Firestore estabelecida com sucesso.');
    
    // 2. Verificar se o email já existe
    const existingDoctor = await getDoctorByEmail(testDoctor.email);
    if (existingDoctor) {
      console.error('ERRO: Email já cadastrado. Teste não pode continuar.');
      return false;
    }
    console.log('Email disponível para cadastro.');
    
    // 3. Criar hash da senha
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log('Senha criptografada com sucesso.');
    
    // 4. Salvar médico no banco de dados
    const doctorId = await addDoctorWithAuth(testDoctor, hashedPassword);
    console.log(`Médico adicionado ao banco de dados com ID: ${doctorId}`);
    
    // 5. Verificar se o médico foi salvo corretamente
    const savedDoctor = await getDoctorByEmail(testDoctor.email);
    if (!savedDoctor) {
      console.error('ERRO: Médico não encontrado após cadastro.');
      return false;
    }
    console.log('Médico encontrado no banco de dados após cadastro.');
    
    // 6. Verificar se os dados foram salvos corretamente
    const fieldsToCheck = ['name', 'email', 'specialty', 'city', 'state', 'level', 'xp'];
    const errors = [];
    
    for (const field of fieldsToCheck) {
      if (savedDoctor[field] !== testDoctor[field]) {
        errors.push(`Campo ${field} não corresponde. Esperado: ${testDoctor[field]}, Recebido: ${savedDoctor[field]}`);
      }
    }
    
    if (errors.length > 0) {
      console.error('ERROS encontrados na validação dos dados:');
      errors.forEach(error => console.error(`- ${error}`));
      return false;
    } else {
      console.log('Todos os dados do médico foram salvos corretamente.');
    }
    
    // 7. Verificar se a senha foi salva na coleção doctorAuth
    const doctorAuthRef = adminDb.collection('doctorAuth').doc(savedDoctor.id);
    const doctorAuth = await doctorAuthRef.get();
    
    if (!doctorAuth.exists) {
      console.error('ERRO: Registro de autenticação do médico não encontrado.');
      return false;
    }
    
    const authData = doctorAuth.data();
    if (!authData || !authData.password) {
      console.error('ERRO: Senha não encontrada no registro de autenticação.');
      return false;
    }
    
    // 8. Verificar se a senha hash pode ser validada
    const passwordIsValid = await bcrypt.compare(testPassword, authData.password);
    if (!passwordIsValid) {
      console.error('ERRO: A senha hash não pode ser validada.');
      return false;
    }
    
    console.log('Senha hash validada com sucesso.');
    console.log('TESTE CONCLUÍDO COM SUCESSO: O registro de médicos está funcionando corretamente!');
    return true;
  } catch (error) {
    console.error('ERRO durante o teste:', error);
    return false;
  }
}

// Executar o teste se este arquivo for executado diretamente
if (require.main === module) {
  testDoctorRegistration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro não tratado:', error);
      process.exit(1);
    });
}

module.exports = testDoctorRegistration;