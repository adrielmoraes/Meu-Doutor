'use server';

import { db } from '../../../../server/storage';
import { adminAuth, admins, platformSettings } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { getAdminSettings, updateAdminSettings, createAuditLog } from '@/lib/db-adapter';
import type { AdminSettings } from '@/types';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';

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
    // Buscar admin e senha
    const [authRecord, adminRecord] = await Promise.all([
      db.select().from(adminAuth).where(eq(adminAuth.id, adminId)).limit(1),
      db.select().from(admins).where(eq(admins.id, adminId)).limit(1),
    ]);

    if (!authRecord[0] || !adminRecord[0]) {
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

    // Criar log de auditoria
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await createAuditLog({
      adminId: adminRecord[0].id,
      adminName: adminRecord[0].name,
      adminEmail: adminRecord[0].email,
      action: 'change_password',
      entityType: 'admin_auth',
      entityId: adminId,
      changes: [
        {
          field: 'password',
          oldValue: '***',
          newValue: '***',
        },
      ],
      ipAddress,
      userAgent,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return { success: false, error: 'Erro ao processar solicitação' };
  }
}

export async function getSettings(): Promise<AdminSettings | null> {
  try {
    return await getAdminSettings();
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return null;
  }
}

export async function updateGeneralSettings({
  adminId,
  platformName,
  platformDescription,
  supportEmail,
  maxFileSize,
  sessionTimeout,
}: {
  adminId: string;
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  maxFileSize: number;
  sessionTimeout: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getAdminSettings();
    if (!settings) {
      return { success: false, error: 'Configurações não encontradas' };
    }

    const adminRecord = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
    if (!adminRecord[0]) {
      return { success: false, error: 'Administrador não encontrado' };
    }

    // Criar logs das mudanças
    const changes: Array<{
      field: string;
      oldValue: string | number | boolean | null;
      newValue: string | number | boolean | null;
    }> = [];

    if (settings.platformName !== platformName) {
      changes.push({ field: 'platformName', oldValue: settings.platformName, newValue: platformName });
    }
    if (settings.platformDescription !== platformDescription) {
      changes.push({ field: 'platformDescription', oldValue: settings.platformDescription, newValue: platformDescription });
    }
    if (settings.supportEmail !== supportEmail) {
      changes.push({ field: 'supportEmail', oldValue: settings.supportEmail, newValue: supportEmail });
    }
    if (settings.maxFileSize !== maxFileSize) {
      changes.push({ field: 'maxFileSize', oldValue: settings.maxFileSize, newValue: maxFileSize });
    }
    if (settings.sessionTimeout !== sessionTimeout) {
      changes.push({ field: 'sessionTimeout', oldValue: settings.sessionTimeout, newValue: sessionTimeout });
    }

    await updateAdminSettings(settings.id, {
      platformName,
      platformDescription,
      supportEmail,
      maxFileSize,
      sessionTimeout,
    });

    // Criar log de auditoria
    if (changes.length > 0) {
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      await createAuditLog({
        adminId: adminRecord[0].id,
        adminName: adminRecord[0].name,
        adminEmail: adminRecord[0].email,
        action: 'update_general_settings',
        entityType: 'admin_settings',
        entityId: settings.id,
        changes,
        ipAddress,
        userAgent,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar configurações gerais:', error);
    return { success: false, error: 'Erro ao processar solicitação' };
  }
}

export async function updateNotificationSettings({
  adminId,
  notifyNewPatient,
  notifyNewDoctor,
  notifyNewExam,
  notifyNewConsultation,
  notifySystemAlerts,
  notifyWeeklyReport,
}: {
  adminId: string;
  notifyNewPatient: boolean;
  notifyNewDoctor: boolean;
  notifyNewExam: boolean;
  notifyNewConsultation: boolean;
  notifySystemAlerts: boolean;
  notifyWeeklyReport: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getAdminSettings();
    if (!settings) {
      return { success: false, error: 'Configurações não encontradas' };
    }

    const adminRecord = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
    if (!adminRecord[0]) {
      return { success: false, error: 'Administrador não encontrado' };
    }

    // Criar logs das mudanças
    const changes: Array<{
      field: string;
      oldValue: string | number | boolean | null;
      newValue: string | number | boolean | null;
    }> = [];

    if (settings.notifyNewPatient !== notifyNewPatient) {
      changes.push({ field: 'notifyNewPatient', oldValue: settings.notifyNewPatient, newValue: notifyNewPatient });
    }
    if (settings.notifyNewDoctor !== notifyNewDoctor) {
      changes.push({ field: 'notifyNewDoctor', oldValue: settings.notifyNewDoctor, newValue: notifyNewDoctor });
    }
    if (settings.notifyNewExam !== notifyNewExam) {
      changes.push({ field: 'notifyNewExam', oldValue: settings.notifyNewExam, newValue: notifyNewExam });
    }
    if (settings.notifyNewConsultation !== notifyNewConsultation) {
      changes.push({ field: 'notifyNewConsultation', oldValue: settings.notifyNewConsultation, newValue: notifyNewConsultation });
    }
    if (settings.notifySystemAlerts !== notifySystemAlerts) {
      changes.push({ field: 'notifySystemAlerts', oldValue: settings.notifySystemAlerts, newValue: notifySystemAlerts });
    }
    if (settings.notifyWeeklyReport !== notifyWeeklyReport) {
      changes.push({ field: 'notifyWeeklyReport', oldValue: settings.notifyWeeklyReport, newValue: notifyWeeklyReport });
    }

    await updateAdminSettings(settings.id, {
      notifyNewPatient,
      notifyNewDoctor,
      notifyNewExam,
      notifyNewConsultation,
      notifySystemAlerts,
      notifyWeeklyReport,
    });

    // Criar log de auditoria
    if (changes.length > 0) {
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      await createAuditLog({
        adminId: adminRecord[0].id,
        adminName: adminRecord[0].name,
        adminEmail: adminRecord[0].email,
        action: 'update_notification_settings',
        entityType: 'admin_settings',
        entityId: settings.id,
        changes,
        ipAddress,
        userAgent,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar configurações de notificação:', error);
    return { success: false, error: 'Erro ao processar solicitação' };
  }
}

export async function updateAvatarSettings({
  adminId,
  avatarProvider,
}: {
  adminId: string;
  avatarProvider: 'tavus' | 'bey';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getAdminSettings();
    if (!settings) {
      return { success: false, error: 'Configurações não encontradas' };
    }

    const adminRecord = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
    if (!adminRecord[0]) {
      return { success: false, error: 'Administrador não encontrado' };
    }

    // Criar logs das mudanças
    const changes: Array<{
      field: string;
      oldValue: string | number | boolean | null;
      newValue: string | number | boolean | null;
    }> = [];

    if (settings.avatarProvider !== avatarProvider) {
      changes.push({ field: 'avatarProvider', oldValue: settings.avatarProvider, newValue: avatarProvider });
    }

    await updateAdminSettings(settings.id, {
      avatarProvider,
    });

    // Criar log de auditoria
    if (changes.length > 0) {
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      await createAuditLog({
        adminId: adminRecord[0].id,
        adminName: adminRecord[0].name,
        adminEmail: adminRecord[0].email,
        action: 'update_avatar_settings',
        entityType: 'admin_settings',
        entityId: settings.id,
        changes,
        ipAddress,
        userAgent,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar configurações de avatar:', error);
    return { success: false, error: 'Erro ao processar solicitação' };
  }
}

export async function getPaymentSettings(): Promise<{ pixEnabled: boolean }> {
  try {
    const result = await db.select().from(platformSettings).where(eq(platformSettings.key, 'pix_enabled')).limit(1);
    
    if (result[0]) {
      return {
        pixEnabled: result[0].value === 'true'
      };
    }
    
    return { pixEnabled: false };
  } catch (error) {
    console.error('Erro ao obter configurações de pagamento:', error);
    return { pixEnabled: false };
  }
}

export async function updatePaymentSettings({
  adminId,
  pixEnabled,
}: {
  adminId: string;
  pixEnabled: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminRecord = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
    
    if (!adminRecord[0]) {
      return { success: false, error: 'Administrador não encontrado' };
    }

    const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, 'pix_enabled')).limit(1);
    
    if (existing[0]) {
      await db.update(platformSettings)
        .set({
          value: pixEnabled ? 'true' : 'false',
          updatedAt: new Date(),
        })
        .where(eq(platformSettings.key, 'pix_enabled'));
    } else {
      await db.insert(platformSettings).values({
        id: randomUUID(),
        key: 'pix_enabled',
        value: pixEnabled ? 'true' : 'false',
        description: 'Habilita/desabilita PIX como método de pagamento',
      });
    }

    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await createAuditLog({
      adminId: adminRecord[0].id,
      adminName: adminRecord[0].name,
      adminEmail: adminRecord[0].email,
      action: 'update_payment_settings',
      entityType: 'payment_settings',
      entityId: 'pix',
      changes: [
        {
          field: 'pix_enabled',
          oldValue: existing[0]?.value || 'false',
          newValue: pixEnabled ? 'true' : 'false',
        },
      ],
      ipAddress,
      userAgent,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar configurações de pagamento:', error);
    return { success: false, error: 'Erro ao processar solicitação' };
  }
}
