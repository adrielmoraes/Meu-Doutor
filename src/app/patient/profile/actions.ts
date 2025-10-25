
'use server';

import { getSession } from '@/lib/session';
import { revalidateTag } from 'next/cache';
import { updatePatient } from '@/lib/db-adapter';
import type { Patient } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Ação para atualizar os campos de texto do perfil do paciente
export async function updatePatientProfile(formData: FormData): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
    return { success: false, message: 'Não autorizado' };
  }

  const { userId } = session;
  
  // Extrair dados do formulário
  const name = formData.get('name') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;

  const updatedData: Partial<Patient> = {};

  if (name) updatedData.name = name;
  if (city) updatedData.city = city;
  if (state) updatedData.state = state;

  if (Object.keys(updatedData).length === 0) {
    return { success: false, message: 'Nenhum dado para atualizar.' };
  }

  try {
    await updatePatient(userId, updatedData);
    revalidateTag(`patient-profile-${userId}`);

    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error) {
    console.error("Erro ao atualizar perfil do paciente:", error);
    return { success: false, message: 'Falha ao atualizar o perfil no servidor.' };
  }
}

// Ação para fazer upload do avatar do paciente
export async function uploadPatientAvatarAction(formData: FormData): Promise<{ success: boolean; message: string; url?: string }> {
    const session = await getSession();

    if (!session || session.role !== 'patient') {
        return { success: false, message: "Usuário não autenticado ou não é um paciente." };
    }

    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
        return { success: false, message: "Arquivo ou ID do usuário não fornecido." };
    }

    if (userId !== session.userId) {
        return { success: false, message: "Não autorizado a atualizar este perfil." };
    }

    try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExtension}`;
        
        // Criar diretório se não existir
        const uploadDir = path.join(process.cwd(), 'public', 'avatars', 'patients');
        await mkdir(uploadDir, { recursive: true });
        
        // Salvar arquivo localmente
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, fileBuffer);
        
        // URL público relativo
        const publicUrl = `/avatars/patients/${fileName}`;

        await updatePatient(userId, { avatar: publicUrl });
        revalidateTag(`patient-profile-${userId}`);

        return { success: true, message: "Avatar atualizado com sucesso!", url: publicUrl };

    } catch (error) {
        console.error("[PatientUploadAction] Erro durante o upload do avatar:", error);
        if (error instanceof Error) {
            return { success: false, message: `Falha no upload do arquivo: ${error.message}` };
        }
        return { success: false, message: "Ocorreu um erro desconhecido no servidor." };
    }
}
