
'use server';

import { getSession } from '@/lib/session';
import { revalidateTag } from 'next/cache';
import { updatePatient, updateDoctor } from '@/lib/db-adapter';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function uploadAvatarAction(formData: FormData): Promise<{ success: boolean; message: string; url?: string }> {
    const session = await getSession();

    if (!session || session.role !== 'doctor') {
        return { success: false, message: "Usuário não autenticado ou não é um médico." };
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
        const uploadDir = path.join(process.cwd(), 'public', 'avatars', 'doctors');
        await mkdir(uploadDir, { recursive: true });
        
        // Salvar arquivo localmente
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, fileBuffer);
        
        // URL público relativo
        const publicUrl = `/avatars/doctors/${fileName}`;

        await updateDoctor(userId, { avatar: publicUrl });
        revalidateTag(`doctor-profile-${userId}`);

        console.log(`[UploadAction] Avatar do médico ${userId} atualizado com sucesso. Nova URL: ${publicUrl}`);

        return { success: true, message: "Avatar atualizado com sucesso!", url: publicUrl };

    } catch (error) {
        console.error("[UploadAction] Erro durante o upload do avatar:", error);
        if (error instanceof Error) {
            return { success: false, message: `Falha no upload do arquivo: ${error.message}` };
        }
        return { success: false, message: "Ocorreu um erro desconhecido no servidor." };
    }
}

// Ação para atualizar outros campos do perfil do médico
export async function updateDoctorProfile(formData: FormData): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session || session.role !== 'doctor') {
    return { success: false, message: 'Não autorizado' };
  }

  const { userId } = session;
  const updatedData: any = {};

  const specialty = formData.get('specialty');
  const bio = formData.get('bio');

  if (specialty) updatedData.specialty = specialty as string;
  if (bio) updatedData.bio = bio as string;

  if (Object.keys(updatedData).length === 0) {
    return { success: false, message: 'Nenhum dado para atualizar.' };
  }

  try {
    await updateDoctor(userId, updatedData);
    revalidateTag(`doctor-profile-${userId}`);

    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error) {
    console.error("Erro ao atualizar perfil do médico:", error);
    return { success: false, message: 'Falha ao atualizar o perfil.' };
  }
}
