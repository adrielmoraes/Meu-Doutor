
'use server';

import { getSession } from '@/lib/session';
import { revalidateTag } from 'next/cache';
import { updateDoctor } from '@/lib/db-adapter';
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
        // Validação de tamanho (2MB máximo)
        const MAX_FILE_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            return { success: false, message: "Arquivo muito grande. Tamanho máximo: 2MB." };
        }

        // Validação de tipo MIME do arquivo
        const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'];
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return { success: false, message: "Tipo de arquivo não permitido. Use apenas JPEG, PNG, GIF ou WebP." };
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        
        // Validação adicional usando magic bytes se file-type estiver disponível
        try {
            const { fileTypeFromBuffer } = await import('file-type');
            const detectedType = await fileTypeFromBuffer(fileBuffer);
            
            if (detectedType && !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
                return { success: false, message: "Tipo de arquivo detectado não é válido." };
            }
        } catch (importError) {
            // Se file-type não estiver disponível, continue com a validação básica
            console.log('[UploadAction] file-type não disponível, usando validação básica');
        }
        
        // Gerar nome de arquivo seguro
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) ? extension : 'jpg';
        const fileName = `${userId}-${Date.now()}.${safeExtension}`;
        
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
