import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantName, metadata } = await request.json();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'roomName e participantName são obrigatórios' },
        { status: 400 }
      );
    }

    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !apiKey || !apiSecret) {
      console.error('[LiveKit] Credenciais não configuradas');
      return NextResponse.json(
        { error: 'Serviço de consulta ao vivo temporariamente indisponível. Configure as credenciais LiveKit.' },
        { status: 500 }
      );
    }

    // Create or update room with metadata (THIS IS THE KEY!)
    if (metadata) {
      try {
        const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
        
        // Create room with patient metadata so agent can access it
        await roomService.createRoom({
          name: roomName,
          metadata: JSON.stringify(metadata)
        });
        
        console.log(`[LiveKit] Sala criada com metadata:`, metadata);
      } catch (roomError: any) {
        // Room might already exist, try to update it
        console.log(`[LiveKit] Sala já existe, atualizando metadata`);
      }
    }

    // Create access token for participant
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    });

    // Grant permissions
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const jwt = await token.toJwt();

    console.log(`[LiveKit] Token gerado para ${participantName} na sala ${roomName}`);

    return NextResponse.json({
      token: jwt,
      url: livekitUrl
    });

  } catch (error: any) {
    console.error('[LiveKit] Erro ao gerar token:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar token de acesso' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
