
import { db } from '../server/storage';
import { patients, doctors } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function diagnoseEmailVerification() {
  console.log('🔍 Diagnóstico do Sistema de Verificação de Email\n');
  console.log('='.repeat(60));

  try {
    // Buscar pacientes com tokens pendentes
    console.log('\n📋 Buscando pacientes com tokens de verificação...');
    const patientsWithTokens = await db
      .select()
      .from(patients)
      .where(eq(patients.emailVerified, false));

    console.log(`\n✅ Encontrados ${patientsWithTokens.length} pacientes não verificados:\n`);
    
    patientsWithTokens.forEach((patient, index) => {
      console.log(`${index + 1}. Paciente:`);
      console.log(`   ID: ${patient.id}`);
      console.log(`   Email: ${patient.email}`);
      console.log(`   Nome: ${patient.name}`);
      console.log(`   Email Verificado: ${patient.emailVerified}`);
      console.log(`   Token Presente: ${patient.verificationToken ? 'SIM' : 'NÃO'}`);
      if (patient.verificationToken) {
        console.log(`   Token (primeiros 16 chars): ${patient.verificationToken.substring(0, 16)}...`);
        console.log(`   Token Completo Length: ${patient.verificationToken.length}`);
      }
      console.log(`   Token Expira: ${patient.tokenExpiry ? new Date(patient.tokenExpiry).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   Token Expirado: ${patient.tokenExpiry ? new Date(patient.tokenExpiry) < new Date() : 'N/A'}`);
      console.log('');
    });

    // Buscar médicos com tokens pendentes
    console.log('\n📋 Buscando médicos com tokens de verificação...');
    const doctorsWithTokens = await db
      .select()
      .from(doctors)
      .where(eq(doctors.emailVerified, false));

    console.log(`\n✅ Encontrados ${doctorsWithTokens.length} médicos não verificados:\n`);
    
    doctorsWithTokens.forEach((doctor, index) => {
      console.log(`${index + 1}. Médico:`);
      console.log(`   ID: ${doctor.id}`);
      console.log(`   Email: ${doctor.email}`);
      console.log(`   Nome: ${doctor.name}`);
      console.log(`   Email Verificado: ${doctor.emailVerified}`);
      console.log(`   Token Presente: ${doctor.verificationToken ? 'SIM' : 'NÃO'}`);
      if (doctor.verificationToken) {
        console.log(`   Token (primeiros 16 chars): ${doctor.verificationToken.substring(0, 16)}...`);
        console.log(`   Token Completo Length: ${doctor.verificationToken.length}`);
      }
      console.log(`   Token Expira: ${doctor.tokenExpiry ? new Date(doctor.tokenExpiry).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   Token Expirado: ${doctor.tokenExpiry ? new Date(doctor.tokenExpiry) < new Date() : 'N/A'}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnóstico concluído!');
    
    if (patientsWithTokens.length === 0 && doctorsWithTokens.length === 0) {
      console.log('\n⚠️  Nenhum usuário não verificado encontrado no banco de dados.');
      console.log('   Tente registrar um novo usuário para testar.');
    }

  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
  }
}

diagnoseEmailVerification()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
