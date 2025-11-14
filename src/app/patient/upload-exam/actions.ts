
'use server';

import { put } from '@vercel/blob';
import { getSession } from '@/lib/session';

export async function uploadExamFilesAction(formData: FormData): Promise<{
  success: boolean;
  message: string;
  urls?: string[];
}> {
  const session = await getSession();

  if (!session || session.role !== 'patient') {
    return { success: false, message: 'Usuário não autenticado.' };
  }

  try {
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return { success: false, message: 'Nenhum arquivo foi enviado.' };
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validações
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        return { 
          success: false, 
          message: `Arquivo ${file.name} muito grande. Máximo: 10MB.` 
        };
      }

      const ALLOWED_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'image/webp'
      ];

      if (!ALLOWED_TYPES.includes(file.type)) {
        return {
          success: false,
          message: `Tipo de arquivo ${file.name} não permitido.`
        };
      }

      // Upload para Vercel Blob
      const blob = await put(
        `exams/${session.userId}/${Date.now()}-${file.name}`,
        file,
        {
          access: 'public', // ou 'private' se quiser URLs assinadas
          addRandomSuffix: true,
        }
      );

      uploadedUrls.push(blob.url);
    }

    console.log(`[UploadExam] ${files.length} arquivo(s) enviado(s) por ${session.userId}`);

    return {
      success: true,
      message: `${files.length} arquivo(s) enviado(s) com sucesso!`,
      urls: uploadedUrls,
    };
  } catch (error) {
    console.error('[UploadExam] Erro:', error);
    return {
      success: false,
      message: 'Erro ao fazer upload dos arquivos.',
    };
  }
}
