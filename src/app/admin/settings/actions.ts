'use server';

import { db } from '../../../../server/storage';
import { adminAuth } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function changeAdminPassword({
  adminId,
  currentPassword,
  newPassword,
}: {
  adminId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar a senha atual do admin
    const authRecord = await db
      .select()
      .from(adminAuth)
      .where(eq(adminAuth.id, adminId))
      .limit(1);

    if (!authRecord[0]) {
      return { success: false, error: 'Administrador não encontrado' };
    }

    // Verificar se a senha atual está correta
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      authRecord[0].password
    );

    if (!isCurrentPasswordValid) {
      return { success: false, error: 'Senha atual incorreta' };
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar a senha
    await db
      .update(adminAuth)
      .set({ password: hashedNewPassword })
      .where(eq(adminAuth.id, adminId));

    return { success: true };
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return { success: false, error: 'Erro ao processar solicitação' };
  }
}
