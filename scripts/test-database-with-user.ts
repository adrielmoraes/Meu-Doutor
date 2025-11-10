
import { db } from '../server/storage';
import { patients, patientAuth } from '../shared/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function testDatabaseWithUser() {
  console.log('🧪 Iniciando teste do banco de dados com usuário fictício...\n');
  
  const testEmail = `teste.ficticio.${Date.now()}@exemplo.com`;
  const testPassword = 'Senha@123';
  
  try {
    // 1. Criar usuário fictício
    console.log('📝 Criando usuário fictício...');
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    const [newPatient] = await db.insert(patients).values({
      name: 'João Teste Fictício',
      email: testEmail,
      phone: '(11) 99999-9999',
      cpf: '000.000.000-00',
      birthDate: '1990-01-01',
      gender: 'Masculino',
      city: 'São Paulo',
      state: 'SP',
      address: 'Rua de Teste, 123',
      zipCode: '01000-000',
      emailVerified: true,
    }).returning();
    
    console.log(`✅ Paciente criado com ID: ${newPatient.id}`);
    
    // 2. Criar autenticação
    console.log('🔐 Criando credenciais de autenticação...');
    await db.insert(patientAuth).values({
      patientId: newPatient.id,
      password: hashedPassword,
    });
    
    console.log('✅ Credenciais criadas com sucesso\n');
    
    // 3. Verificar se o usuário foi criado
    console.log('🔍 Verificando se o usuário foi salvo corretamente...');
    const savedPatient = await db.query.patients.findFirst({
      where: eq(patients.email, testEmail),
    });
    
    if (!savedPatient) {
      throw new Error('❌ Usuário não encontrado após criação');
    }
    
    console.log('✅ Usuário encontrado no banco de dados');
    console.log(`   Nome: ${savedPatient.name}`);
    console.log(`   Email: ${savedPatient.email}`);
    console.log(`   CPF: ${savedPatient.cpf}\n`);
    
    // 4. Verificar autenticação
    console.log('🔐 Verificando autenticação...');
    const auth = await db.query.patientAuth.findFirst({
      where: eq(patientAuth.patientId, savedPatient.id),
    });
    
    if (!auth) {
      throw new Error('❌ Credenciais de autenticação não encontradas');
    }
    
    const passwordMatch = await bcrypt.compare(testPassword, auth.password);
    if (!passwordMatch) {
      throw new Error('❌ Senha não corresponde');
    }
    
    console.log('✅ Autenticação verificada com sucesso\n');
    
    // 5. Limpar dados de teste
    console.log('🧹 Limpando dados de teste...');
    await db.delete(patientAuth).where(eq(patientAuth.patientId, savedPatient.id));
    await db.delete(patients).where(eq(patients.id, savedPatient.id));
    console.log('✅ Dados de teste removidos\n');
    
    console.log('✨ TESTE CONCLUÍDO COM SUCESSO! ✨');
    console.log('O banco de dados está funcionando corretamente.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO durante o teste:', error);
    process.exit(1);
  }
}

testDatabaseWithUser();
