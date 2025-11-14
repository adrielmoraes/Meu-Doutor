
import { NextRequest, NextResponse } from 'next/server';
import { Client as ObjectStorageClient } from '@replit/object-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join('/');

    const objectStorage = new ObjectStorageClient();
    const fileBuffer = await objectStorage.downloadAsBytes(filePath);

    // Detectar tipo de arquivo
    const { fileTypeFromBuffer } = await import('file-type');
    const detectedType = await fileTypeFromBuffer(fileBuffer);

    const contentType = detectedType?.mime || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Storage API] Erro ao buscar arquivo:', error);
    return NextResponse.json(
      { error: 'Arquivo não encontrado' },
      { status: 404 }
    );
  }
}
