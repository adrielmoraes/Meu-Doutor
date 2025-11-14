
'use server';

import { getSession } from '@/lib/session';
import { revalidateTag } from 'next/cache';
import { updateDoctor } from '@/lib/db-adapter';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Validação server-side do tipo real do arquivo usando magic bytes
        const { fileTypeFromBuffer } = await import('file-type');
        const detectedType = await fileTypeFromBuffer(fileBuffer);

        const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
        if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
            return { success: false, message: "Tipo de arquivo não permitido. Use apenas JPEG, PNG ou GIF." };
        }

        // Converter buffer para base64 para upload no Cloudinary
        const base64File = `data:${detectedType.mime};base64,${fileBuffer.toString('base64')}`;

        // Upload para Cloudinary
        const uploadResult = await cloudinary.uploader.upload(base64File, {
            folder: 'mediai/avatars/doctors',
            public_id: `doctor_${userId}_${Date.now()}`,
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto:good' }
            ],
            format: 'jpg'
        });

        // URL pública do Cloudinary
        const publicUrl = uploadResult.secure_url;

        await updateDoctor(userId, { avatar: publicUrl });
        revalidateTag(`doctor-profile-${userId}`);

        console.log(`[UploadAction] Avatar do médico ${userId} atualizado com sucesso. Nova URL: ${publicUrl}`);

        return { success: true, message: "Avatar atualizado com sucesso!", url: publicUrl };

    } catch (error) {
        console.error("[DoctorUploadAction] Erro durante o upload do avatar:", error);
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
    return { success: false, message: 'Falha ao atualizar o perfil no servidor.' };
  }
}
