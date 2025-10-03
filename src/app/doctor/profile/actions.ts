
'use server';

import { Storage } from '@google-cloud/storage';
import { getSession } from '@/lib/session';
import { revalidateTag } from 'next/cache';
import { updatePatient, updateDoctor } from '@/lib/db-adapter';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mediai-uploads';

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
        const fileName = `avatars/doctors/${userId}-${Date.now()}.${fileExtension}`;
        
        const bucket = storage.bucket(bucketName);
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(fileBuffer, {
            metadata: { contentType: file.type },
        });

        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

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
