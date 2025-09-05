
import { NextResponse } from 'next/server';
import { uploadFileToStorage } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || !session.userId || !session.role) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `avatars/${session.role}s/${session.userId}-${Date.now()}-${file.name}`;
    const fileUrl = await uploadFileToStorage(buffer, filePath, file.type);

    // Atualizar o avatar no Firestore
    const adminDb = getAdminDb();
    await adminDb.collection(`${session.role}s`).doc(session.userId).update({ avatar: fileUrl });

    return NextResponse.json({ success: true, fileUrl, message: 'Avatar atualizado com sucesso!' });
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json({ message: `Falha no upload do avatar: ${error.message}` }, { status: 500 });
  }
}
