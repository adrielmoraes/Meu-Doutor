import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { patients, doctors, exams } from './shared/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco de dados Neon...\n');
    
    const patientsCount = await db.select().from(patients);
    console.log(`✅ Tabela 'patients': ${patientsCount.length} registros encontrados`);
    
    const doctorsCount = await db.select().from(doctors);
    console.log(`✅ Tabela 'doctors': ${doctorsCount.length} registros encontrados`);
    
    const examsCount = await db.select().from(exams);
    console.log(`✅ Tabela 'exams': ${examsCount.length} registros encontrados`);
    
    console.log('\n✅ Conexão com o banco de dados Neon estabelecida com sucesso!');
    console.log('✅ Todas as tabelas foram migradas corretamente!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    process.exit(1);
  }
}

testConnection();
