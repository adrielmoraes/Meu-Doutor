
'use server';

import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/firebase-admin'; // Garante que o app admin seja inicializado
import { getSession } from '@/lib/session';
import { revalidateTag } from 'next/cache';

// Inicialize o Firestore e o Storage se ainda não foram
const db = getFirestore();
const storage = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

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
        // 1. Fazer o upload do buffer para o Firebase Storage
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split('.').pop();
        const fileName = `avatars/${userId}-${Date.now()}.${fileExtension}`;
        const fileUpload = storage.file(fileName);

        await fileUpload.save(fileBuffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // 2. Tornar o arquivo público
        await fileUpload.makePublic();

        // 3. Obter a URL pública
        const publicUrl = fileUpload.publicUrl();

        // 4. Atualizar a URL no Firestore
        const doctorRef = db.collection('doctors').doc(userId);
        await doctorRef.update({ avatarUrl: publicUrl });

        // 5. Revalidar o cache da página de perfil
        revalidateTag(`doctor-profile-${userId}`);

        console.log(`[UploadAction] Avatar do médico ${userId} atualizado com sucesso. Nova URL: ${publicUrl}`);

        return { success: true, message: "Avatar atualizado com sucesso!", url: publicUrl };

    } catch (error) {
        console.error("[UploadAction] Erro durante o upload do avatar:", error);
        // Adicionar verificação de tipo para o erro
        if (error instanceof Error) {
             // Se for um erro conhecido (ex: permissões), a mensagem pode ser útil
            return { success: false, message: `Falha no upload do arquivo: ${error.message}` };
        }
        // Para erros desconhecidos
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
  const updatedData: { [key: string]: any } = {};

  // Extraia apenas os campos que você quer que sejam atualizáveis
  const specialty = formData.get('specialty');
  const bio = formData.get('bio');

  if (specialty) updatedData.specialty = specialty as string;
  if (bio) updatedData.bio = bio as string;

  if (Object.keys(updatedData).length === 0) {
    return { success: false, message: 'Nenhum dado para atualizar.' };
  }

  try {
    const doctorRef = db.collection('doctors').doc(userId);
    await doctorRef.update(updatedData);

    revalidateTag(`doctor-profile-${userId}`);

    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error) {
    console.error("Erro ao atualizar perfil do médico:", error);
    return { success: false, message: 'Falha ao atualizar o perfil.' };
  }
}
