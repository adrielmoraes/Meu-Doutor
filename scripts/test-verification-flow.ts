
import { db } from '../server/storage';
import { patients, doctors } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { generateVerificationToken, getTokenExpiry } from '../src/lib/email-service';

async function testVerificationFlow() {
  console.log('🧪 Teste Completo do Fluxo de Verificação de Email\n');
  console.log('='.repeat(60));

  try {
    // 1. Gerar token de teste
    const testToken = generateVerificationToken();
    const testExpiry = getTokenExpiry();

    console.log('\n1️⃣ Token gerado:');
    console.log('   Token:', testToken.substring(0, 16) + '...');
    console.log('   Length:', testToken.length);
    console.log('   Expira em:', testExpiry.toLocaleString('pt-BR'));
    console.log('   Expira em (ISO):', testExpiry.toISOString());

    // 2. Buscar um paciente não verificado
    const unverifiedPatients = await db
      .select()
      .from(patients)
      .where(eq(patients.emailVerified, false))
      .limit(1);

    if (unverifiedPatients.length === 0) {
      console.log('\n⚠️  Nenhum paciente não verificado encontrado.');
      console.log('   Cadastre um novo usuário para testar.');
      return;
    }

    const patient = unverifiedPatients[0];
    console.log('\n2️⃣ Paciente encontrado:');
    console.log('   ID:', patient.id);
    console.log('   Email:', patient.email);
    console.log('   Nome:', patient.name);
    console.log('   Token atual:', patient.verificationToken ? patient.verificationToken.substring(0, 16) + '...' : 'NENHUM');
    console.log('   Token Expiry:', patient.tokenExpiry?.toISOString() || 'NENHUM');

    // 3. Atualizar com novo token de teste
    console.log('\n3️⃣ Atualizando paciente com novo token...');
    await db
      .update(patients)
      .set({
        verificationToken: testToken,
        tokenExpiry: testExpiry,
        updatedAt: new Date()
      })
      .where(eq(patients.id, patient.id));

    // 4. Verificar se foi salvo
    console.log('\n4️⃣ Verificando se foi salvo...');
    const updatedPatient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patient.id))
      .limit(1);

    if (updatedPatient.length === 0) {
      console.error('   ❌ Erro: Paciente não encontrado após update!');
      return;
    }

    const updated = updatedPatient[0];
    console.log('   ✅ Token salvo:', updated.verificationToken ? 'SIM' : 'NÃO');
    console.log('   Token:', updated.verificationToken?.substring(0, 16) + '...');
    console.log('   Token completo length:', updated.verificationToken?.length);
    console.log('   Expiry:', updated.tokenExpiry?.toISOString());

    // 5. Testar busca por token
    console.log('\n5️⃣ Testando busca por token...');
    const foundByToken = await db
      .select()
      .from(patients)
      .where(eq(patients.verificationToken, testToken))
      .limit(1);

    if (foundByToken.length === 0) {
      console.error('   ❌ ERRO: Token não encontrado na busca!');
    } else {
      console.log('   ✅ Token encontrado na busca!');
      console.log('   Email encontrado:', foundByToken[0].email);
    }

    // 6. Simular verificação
    console.log('\n6️⃣ Simulando verificação...');
    await db
      .update(patients)
      .set({
        emailVerified: true,
        verificationToken: null,
        tokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(patients.id, patient.id));

    const verified = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patient.id))
      .limit(1);

    console.log('   ✅ Email Verificado:', verified[0].emailVerified);
    console.log('   Token removido:', verified[0].verificationToken === null ? 'SIM' : 'NÃO');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Teste concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Cadastre um novo usuário');
    console.log('   2. Verifique se o token está no banco (npm run diagnose:email)');
    console.log('   3. Clique no link do email');
    console.log('   4. Verifique se funcionou!');

  } catch (error) {
    console.error('\n❌ Erro durante teste:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
  }
}

testVerificationFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
