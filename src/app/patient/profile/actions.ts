
'use server';

import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { revalidateTag } from 'next/cache';
import type { Patient } from '@/types';

const db = getFirestore();
const storage = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

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
    const patientRef = db.collection('patients').doc(userId);
    await patientRef.update(updatedData);

    // Revalidar o cache para esta página e outras onde os dados podem aparecer
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
        const fileName = `avatars/patients/${userId}-${Date.now()}.${fileExtension}`;
        const fileUpload = storage.file(fileName);

        await fileUpload.save(fileBuffer, {
            metadata: { contentType: file.type },
        });

        await fileUpload.makePublic();
        const publicUrl = fileUpload.publicUrl();

        const patientRef = db.collection('patients').doc(userId);
        await patientRef.update({ avatarUrl: publicUrl });

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
