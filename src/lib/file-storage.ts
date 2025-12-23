import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';

export async function saveUploadedFile(file: File, folder: string): Promise<string> {
  // Tentar usar Vercel Blob se o token estiver configurado
  const token = process.env.STORAGE_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  
  if (token) {
    try {
      console.log(`[Storage] Uploading file to Vercel Blob (${folder})...`);
      
      let ext = path.extname(file.name);
      if (!ext && file.type) {
          if (file.type === 'application/pdf') ext = '.pdf';
          else if (file.type === 'image/jpeg') ext = '.jpg';
          else if (file.type === 'image/png') ext = '.png';
          else if (file.type === 'audio/mpeg') ext = '.mp3';
          else if (file.type === 'audio/wav') ext = '.wav';
          else if (file.type === 'audio/ogg') ext = '.ogg';
      }
      
      const fileName = `${folder}/${randomUUID()}${ext || ''}`;
      
      const blob = await put(fileName, file, {
        access: 'public',
        token: token,
      });
      
      console.log(`[Storage] File uploaded successfully: ${blob.url}`);
      return blob.url;
    } catch (error) {
      console.error('[Storage] Error uploading to Vercel Blob, falling back to local:', error);
    }
  } else {
    console.warn('[Storage] Vercel Blob token not found. Using local storage.');
  }

  // Fallback: Local Storage
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Criar diretório se não existir
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Gerar nome único
  let ext = path.extname(file.name);
  if (!ext && file.type) {
      if (file.type === 'application/pdf') ext = '.pdf';
      else if (file.type === 'image/jpeg') ext = '.jpg';
      else if (file.type === 'image/png') ext = '.png';
      else if (file.type === 'audio/mpeg') ext = '.mp3';
      else if (file.type === 'audio/wav') ext = '.wav';
      else if (file.type === 'audio/ogg') ext = '.ogg';
  }
  
  const fileName = `${randomUUID()}${ext || ''}`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, buffer);

  // Retornar caminho relativo para acesso via web
  return `/uploads/${folder}/${fileName}`;
}

export async function saveFileBuffer(buffer: Buffer, originalName: string, folder: string): Promise<string> {
  // Tentar usar Vercel Blob se o token estiver configurado
  const token = process.env.STORAGE_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  
  const ext = path.extname(originalName) || '.bin';
  const fileName = `${folder}/${randomUUID()}${ext}`;

  if (token) {
    try {
      console.log(`[Storage] Uploading buffer to Vercel Blob (${folder})...`);
      
      const blob = await put(fileName, buffer, {
        access: 'public',
        token: token,
      });
      
      console.log(`[Storage] Buffer uploaded successfully: ${blob.url}`);
      return blob.url;
    } catch (error) {
      console.error('[Storage] Error uploading buffer to Vercel Blob, falling back to local:', error);
    }
  }

  // Fallback: Local Storage
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localFileName = `${randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, localFileName);

  fs.writeFileSync(filePath, buffer);

  return `/uploads/${folder}/${localFileName}`;
}
