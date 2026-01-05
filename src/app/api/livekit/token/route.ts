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
      const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
      try {
        // Create room with patient metadata so agent can access it
        await roomService.createRoom({
          name: roomName,
          metadata: JSON.stringify(metadata)
        });

        console.log(`[LiveKit] Sala criada com metadata:`, metadata);
      } catch (roomError: any) {
        console.log(`[LiveKit] Sala já existe, atualizando metadata`);
        try {
          const updateRoomMetadata = (roomService as any).updateRoomMetadata;
          if (typeof updateRoomMetadata === 'function') {
            await updateRoomMetadata.call(
              roomService,
              roomName,
              JSON.stringify(metadata),
            );
          }
        } catch { }
      }
    }

    // Check for subscription limits if patient_id is present
    let tokenTTL = undefined; // Default TTL (usually 6 hours)

    if (metadata?.patient_id) {
      const { canUseResource } = await import('@/lib/subscription-limits');
      const quota = await canUseResource(metadata.patient_id, 'aiConsultationMinutes');

      // If strict limit reached, deny token
      if (!quota.allowed) {
        console.log(`[LiveKit] Limite atingido para ${metadata.patient_id}: ${quota.current}/${quota.limit}`);
        return NextResponse.json(
          { error: quota.message || 'Limite de minutos de consulta atingido.' },
          { status: 403 }
        );
      }

      // If finite limit, set TTL equal to remaining time
      if (quota.limit !== Infinity) {
        const remainingMinutes = Math.max(0, quota.limit - quota.current);

        // Safety check
        if (remainingMinutes <= 0) {
          return NextResponse.json(
            { error: 'Você não tem mais minutos disponíveis.' },
            { status: 403 }
          );
        }

        // Set TTL (seconds) = remaining minutes * 60 + 15s buffer
        tokenTTL = (remainingMinutes * 60) + 15;
        console.log(`[LiveKit] Definindo TTL do token para ${tokenTTL}s (${remainingMinutes} min restantes)`);
      }
    }

    // Create access token for participant
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      ttl: tokenTTL
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
