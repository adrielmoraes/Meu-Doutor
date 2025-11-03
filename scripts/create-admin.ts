// Script para criar um administrador
import { addAdminWithAuth } from '../src/lib/db-adapter';
import bcrypt from 'bcrypt';

async function createAdmin() {
  const email = 'admin@mediai.com';
  const password = 'admin123';  // Senha padrão - deve ser alterada após primeiro login
  const name = 'Administrador';
  const avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    await addAdminWithAuth(
      {
        name,
        email,
        avatar,
        role: 'admin',
      },
      hashedPassword
    );
    
    console.log('✅ Administrador criado com sucesso!');
    console.log('📧 Email: admin@mediai.com');
    console.log('🔑 Senha: admin123');
    console.log('⚠️  Por favor, altere a senha após o primeiro login!');
  } catch (error: any) {
    if (error.message?.includes('unique constraint')) {
      console.log('ℹ️  Administrador já existe no banco de dados.');
    } else {
      console.error('❌ Erro ao criar administrador:', error);
    }
  }
  
  process.exit(0);
}

createAdmin();
