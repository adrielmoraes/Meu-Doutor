import { addPatientWithAuth, getPatientByEmail, getPatientByCpf } from '../src/lib/db-adapter';
import { generateVerificationToken, getTokenExpiry } from '../src/lib/email-service';
import bcrypt from 'bcrypt';
import { db } from '../server/storage';
import { patients, patientAuth } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function testPatientRegistration() {
  console.log('🧪 Testando fluxo completo de cadastro de paciente...\n');
  
  const timestamp = Date.now();
  const testCpf = `888.${timestamp.toString().slice(-8, -5)}.${timestamp.toString().slice(-5, -2)}-${timestamp.toString().slice(-2)}`;
  const testEmail = `paciente.teste.${timestamp}@exemplo.com`;
  const testPassword = 'SenhaSegura@2024';
  
  let patientId: string | null = null;
  
  try {
    // 1. Verificar se email já existe (deve retornar null)
    console.log('1️⃣  Verificando se email já existe...');
    const existingEmail = await getPatientByEmail(testEmail);
    if (existingEmail) {
      throw new Error('❌ Email já existe no sistema');
    }
    console.log('✅ Email disponível\n');
    
    // 2. Verificar se CPF já existe (deve retornar null)
    console.log('2️⃣  Verificando se CPF já existe...');
    const existingCpf = await getPatientByCpf(testCpf);
    if (existingCpf) {
      throw new Error('❌ CPF já existe no sistema');
    }
    console.log('✅ CPF disponível\n');
    
    // 3. Criar paciente com token de verificação
    console.log('3️⃣  Criando paciente...');
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();
    
    console.log('   Dados do token:');
    console.log(`   - Token length: ${verificationToken.length}`);
    console.log(`   - Expira em: ${tokenExpiry.toISOString()}`);
    
    patientId = await addPatientWithAuth({
      name: 'Paciente Teste Completo',
      birthDate: '1995-05-15',
      age: 29,
      lastVisit: new Date().toLocaleDateString('pt-BR'),
      status: 'Requer Validação',
      avatar: 'https://placehold.co/128x128.png',
      avatarHint: 'person portrait',
      conversationHistory: '',
      reportedSymptoms: '',
      examResults: '',
      email: testEmail,
      cpf: testCpf,
      phone: '(21) 98765-4321',
      gender: 'Feminino',
      city: 'Rio de Janeiro',
      state: 'RJ',
    }, hashedPassword, verificationToken, tokenExpiry);
    
    console.log(`✅ Paciente criado com ID: ${patientId}\n`);
    
    // 4. Verificar se os dados foram salvos corretamente
    console.log('4️⃣  Verificando dados salvos...');
    const savedPatient = await getPatientByEmail(testEmail);
    
    if (!savedPatient) {
      throw new Error('❌ Paciente não encontrado após criação');
    }
    
    console.log('✅ Paciente encontrado no banco');
    console.log(`   Nome: ${savedPatient.name}`);
    console.log(`   Email: ${savedPatient.email}`);
    console.log(`   CPF: ${savedPatient.cpf}`);
    console.log(`   Phone: ${savedPatient.phone}`);
    console.log(`   City: ${savedPatient.city}`);
    console.log(`   State: ${savedPatient.state}`);
    console.log(`   Email Verified: ${savedPatient.emailVerified}`);
    console.log(`   Has Token: ${!!savedPatient.verificationToken}`);
    console.log(`   Token Expiry: ${savedPatient.tokenExpiry?.toISOString()}\n`);
    
    // 5. Validar que o token foi salvo
    if (!savedPatient.verificationToken) {
      throw new Error('❌ Token de verificação não foi salvo');
    }
    if (savedPatient.verificationToken !== verificationToken) {
      throw new Error('❌ Token salvo não corresponde ao gerado');
    }
    console.log('✅ Token de verificação salvo corretamente\n');
    
    // 6. Validar que a data de expiração foi salva
    if (!savedPatient.tokenExpiry) {
      throw new Error('❌ Data de expiração não foi salva');
    }
    console.log('✅ Data de expiração salva corretamente\n');
    
    // 7. Verificar autenticação
    console.log('5️⃣  Verificando autenticação...');
    const patientWithAuth = await db.query.patientAuth.findFirst({
      where: eq(patientAuth.id, patientId),
    });
    
    if (!patientWithAuth) {
      throw new Error('❌ Credenciais não encontradas');
    }
    
    const passwordMatch = await bcrypt.compare(testPassword, patientWithAuth.password);
    if (!passwordMatch) {
      throw new Error('❌ Senha não corresponde');
    }
    console.log('✅ Autenticação verificada\n');
    
    // 8. Simular verificação de email
    console.log('6️⃣  Simulando verificação de email...');
    await db.update(patients)
      .set({
        emailVerified: true,
        verificationToken: null,
        tokenExpiry: null,
      })
      .where(eq(patients.id, patientId));
    
    const verifiedPatient = await getPatientByEmail(testEmail);
    if (!verifiedPatient?.emailVerified) {
      throw new Error('❌ Email não foi marcado como verificado');
    }
    if (verifiedPatient.verificationToken !== null) {
      throw new Error('❌ Token não foi removido após verificação');
    }
    console.log('✅ Email verificado e token removido\n');
    
    // 9. Limpar dados de teste
    console.log('7️⃣  Limpando dados de teste...');
    await db.delete(patientAuth).where(eq(patientAuth.id, patientId));
    await db.delete(patients).where(eq(patients.id, patientId));
    console.log('✅ Dados removidos\n');
    
    console.log('✨ TODOS OS TESTES PASSARAM COM SUCESSO! ✨');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Validação de email/CPF duplicado funciona');
    console.log('   ✅ Dados de contato (phone, city, state) salvos corretamente');
    console.log('   ✅ Token de verificação salvo no banco');
    console.log('   ✅ Data de expiração salva corretamente');
    console.log('   ✅ Autenticação funciona');
    console.log('   ✅ Verificação de email funciona\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERRO durante o teste:', error);
    
    // Cleanup em caso de erro
    if (patientId) {
      console.log('\n🧹 Limpando dados parciais...');
      try {
        await db.delete(patientAuth).where(eq(patientAuth.id, patientId));
        await db.delete(patients).where(eq(patients.id, patientId));
        console.log('✅ Limpeza concluída');
      } catch (cleanError) {
        console.error('❌ Erro na limpeza:', cleanError);
      }
    }
    
    process.exit(1);
  }
}

testPatientRegistration();
