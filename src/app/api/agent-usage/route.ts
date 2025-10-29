import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackUsage } from '@/lib/db-adapter';
import { getPatientById } from '@/lib/db-adapter';

const agentUsageSchema = z.object({
  patientId: z.string().uuid(),
  sessionId: z.string(),
  sttTokens: z.number().int().min(0).default(0),
  llmInputTokens: z.number().int().min(0).default(0),
  llmOutputTokens: z.number().int().min(0).default(0),
  ttsTokens: z.number().int().min(0).default(0),
  visionTokens: z.number().int().min(0).default(0),
  visionInputTokens: z.number().int().min(0).default(0),
  visionOutputTokens: z.number().int().min(0).default(0),
  activeSeconds: z.number().int().min(0).default(0),
  costCents: z.number().int().min(0).default(0),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Autenticação via header X-Agent-Secret
    const agentSecret = request.headers.get('X-Agent-Secret');
    const expectedSecret = process.env.AGENT_SECRET;

    if (!expectedSecret) {
      console.error('[Agent Usage] AGENT_SECRET não configurado no ambiente');
      return NextResponse.json(
        { success: false, error: 'Configuração do servidor inválida' },
        { status: 500 }
      );
    }

    if (!agentSecret || agentSecret !== expectedSecret) {
      console.warn('[Agent Usage] Tentativa de acesso não autorizado');
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Validação do body
    const body = await request.json();
    const validatedData = agentUsageSchema.parse(body);

    // Validar que o paciente existe
    const patient = await getPatientById(validatedData.patientId);
    if (!patient) {
      console.warn(`[Agent Usage] Paciente não encontrado: ${validatedData.patientId}`);
      return NextResponse.json(
        { success: false, error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    console.log(`[Agent Usage] Recebendo métricas para paciente ${patient.name} (${validatedData.patientId})`);
    console.log(`[Agent Usage] Session: ${validatedData.sessionId}`);
    console.log(`[Agent Usage] Tokens - STT: ${validatedData.sttTokens}, LLM In: ${validatedData.llmInputTokens}, LLM Out: ${validatedData.llmOutputTokens}, TTS: ${validatedData.ttsTokens}, Vision: ${validatedData.visionTokens}`);
    console.log(`[Agent Usage] Tempo ativo: ${validatedData.activeSeconds}s, Custo: R$ ${(validatedData.costCents / 100).toFixed(2)}`);

    // Salvar métricas STT
    if (validatedData.sttTokens > 0) {
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'stt',
        resourceName: 'Gemini Live STT',
        tokensUsed: validatedData.sttTokens,
        durationSeconds: validatedData.activeSeconds,
        cost: Math.ceil((validatedData.sttTokens / 1000000) * 0.10 * 5.0 * 100), // USD -> BRL centavos
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.0-flash-exp',
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas LLM (input + output)
    const totalLlmTokens = validatedData.llmInputTokens + validatedData.llmOutputTokens;
    if (totalLlmTokens > 0) {
      const llmCost = 
        (validatedData.llmInputTokens / 1000000) * 0.10 * 5.0 * 100 + // Input: $0.10/1M
        (validatedData.llmOutputTokens / 1000000) * 0.40 * 5.0 * 100;  // Output: $0.40/1M
      
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'llm',
        resourceName: 'Gemini 2.0 Flash',
        tokensUsed: totalLlmTokens,
        durationSeconds: validatedData.activeSeconds,
        cost: Math.ceil(llmCost),
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.0-flash-exp',
          inputTokens: validatedData.llmInputTokens,
          outputTokens: validatedData.llmOutputTokens,
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas TTS
    if (validatedData.ttsTokens > 0) {
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'tts',
        resourceName: 'Gemini Live TTS',
        tokensUsed: validatedData.ttsTokens,
        durationSeconds: validatedData.activeSeconds,
        cost: Math.ceil((validatedData.ttsTokens / 1000000) * 0.40 * 5.0 * 100), // USD -> BRL centavos
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.0-flash-exp',
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas de Visão
    const totalVisionTokens = validatedData.visionInputTokens + validatedData.visionOutputTokens;
    if (totalVisionTokens > 0 || validatedData.visionTokens > 0) {
      const visionCost = 
        (validatedData.visionInputTokens / 1000000) * 0.075 * 5.0 * 100 + // Input: $0.075/1M
        (validatedData.visionOutputTokens / 1000000) * 0.30 * 5.0 * 100;  // Output: $0.30/1M
      
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'llm', // Vision usa tipo 'llm' pois é parte do Gemini
        resourceName: 'Gemini Vision',
        tokensUsed: totalVisionTokens || validatedData.visionTokens,
        durationSeconds: 0,
        cost: Math.ceil(visionCost),
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.0-flash-exp',
          inputTokens: validatedData.visionInputTokens,
          outputTokens: validatedData.visionOutputTokens,
          visionAnalysis: true,
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas de duração da chamada AI
    if (validatedData.activeSeconds > 0) {
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'ai_call',
        resourceName: 'Gemini Live Consultation',
        tokensUsed: 0,
        durationSeconds: validatedData.activeSeconds,
        cost: validatedData.costCents,
        metadata: {
          sessionId: validatedData.sessionId,
          totalTokens: validatedData.sttTokens + validatedData.llmInputTokens + validatedData.llmOutputTokens + validatedData.ttsTokens + totalVisionTokens,
          ...validatedData.metadata,
        },
      });
    }

    console.log(`[Agent Usage] ✅ Métricas salvas com sucesso para ${patient.name}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Agent Usage] Erro de validação:', error.errors);
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Agent Usage] Erro ao processar métricas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
