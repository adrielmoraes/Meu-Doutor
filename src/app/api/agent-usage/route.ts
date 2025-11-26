import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackUsage } from '@/lib/db-adapter';
import { getPatientById } from '@/lib/db-adapter';
import { 
  calculateLLMCost, 
  calculateAvatarCost, 
  usdToBRLCents,
  AI_PRICING 
} from '@/lib/ai-pricing';

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
  avatarProvider: z.enum(['beyondpresence', 'tavus']).default('beyondpresence'),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Autenticação via header x-agent-secret ou Authorization Bearer
    const agentSecret = request.headers.get('x-agent-secret') || 
                        request.headers.get('Authorization')?.replace('Bearer ', '');
    const expectedSecret = process.env.AGENT_SECRET || 'mediai-agent-secret-2024';

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

    // Use real Gemini Native Audio pricing: Input $1.00/1M, Output $20.00/1M
    const NATIVE_AUDIO_INPUT_PRICE = 1.00; // per 1M tokens
    const NATIVE_AUDIO_OUTPUT_PRICE = 20.00; // per 1M tokens
    
    // Salvar métricas STT (usando Native Audio pricing)
    if (validatedData.sttTokens > 0) {
      const sttCostUSD = (validatedData.sttTokens / 1_000_000) * NATIVE_AUDIO_INPUT_PRICE;
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'stt',
        resourceName: 'Gemini 2.5 Flash Native Audio (STT)',
        tokensUsed: validatedData.sttTokens,
        durationSeconds: validatedData.activeSeconds,
        cost: usdToBRLCents(sttCostUSD),
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          costUSD: sttCostUSD,
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas LLM (usando pricing do Gemini 2.5 Flash: $0.30 input, $2.50 output)
    const totalLlmTokens = validatedData.llmInputTokens + validatedData.llmOutputTokens;
    if (totalLlmTokens > 0) {
      const llmCost = calculateLLMCost(
        'gemini-2.5-flash',
        validatedData.llmInputTokens,
        validatedData.llmOutputTokens
      );
      
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'llm',
        resourceName: 'Gemini 2.5 Flash',
        tokensUsed: totalLlmTokens,
        durationSeconds: validatedData.activeSeconds,
        cost: usdToBRLCents(llmCost.totalCost),
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.5-flash',
          inputTokens: validatedData.llmInputTokens,
          outputTokens: validatedData.llmOutputTokens,
          costUSD: llmCost.totalCost,
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas TTS (usando Native Audio pricing)
    if (validatedData.ttsTokens > 0) {
      const ttsCostUSD = (validatedData.ttsTokens / 1_000_000) * NATIVE_AUDIO_OUTPUT_PRICE;
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'tts',
        resourceName: 'Gemini 2.5 Flash Native Audio (TTS)',
        tokensUsed: validatedData.ttsTokens,
        durationSeconds: validatedData.activeSeconds,
        cost: usdToBRLCents(ttsCostUSD),
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          costUSD: ttsCostUSD,
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas de Visão (usando pricing do Gemini 2.5 Flash)
    const totalVisionTokens = validatedData.visionInputTokens + validatedData.visionOutputTokens;
    if (totalVisionTokens > 0 || validatedData.visionTokens > 0) {
      const visionCost = calculateLLMCost(
        'gemini-2.5-flash',
        validatedData.visionInputTokens || validatedData.visionTokens,
        validatedData.visionOutputTokens || 0
      );
      
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'vision',
        resourceName: 'Gemini 2.5 Flash Vision',
        tokensUsed: totalVisionTokens || validatedData.visionTokens,
        durationSeconds: 0,
        cost: usdToBRLCents(visionCost.totalCost),
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.5-flash',
          inputTokens: validatedData.visionInputTokens,
          outputTokens: validatedData.visionOutputTokens,
          visionAnalysis: true,
          costUSD: visionCost.totalCost,
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas do Avatar (BeyondPresence: $0.175/min)
    if (validatedData.activeSeconds > 0) {
      const avatarCostUSD = calculateAvatarCost(
        validatedData.avatarProvider,
        validatedData.activeSeconds / 60
      );
      
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'avatar',
        resourceName: AI_PRICING.avatars[validatedData.avatarProvider].name,
        tokensUsed: 0,
        durationSeconds: validatedData.activeSeconds,
        cost: usdToBRLCents(avatarCostUSD),
        metadata: {
          sessionId: validatedData.sessionId,
          avatarProvider: validatedData.avatarProvider,
          durationMinutes: validatedData.activeSeconds / 60,
          costUSD: avatarCostUSD,
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas consolidadas da consulta ao vivo
    if (validatedData.activeSeconds > 0) {
      const totalTokensUsed = validatedData.sttTokens + validatedData.llmInputTokens + 
                              validatedData.llmOutputTokens + validatedData.ttsTokens + totalVisionTokens;
      
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'live_consultation',
        resourceName: 'Consulta IA ao Vivo',
        tokensUsed: totalTokensUsed,
        durationSeconds: validatedData.activeSeconds,
        cost: validatedData.costCents || 0,
        metadata: {
          sessionId: validatedData.sessionId,
          avatarProvider: validatedData.avatarProvider,
          totalTokens: totalTokensUsed,
          breakdown: {
            sttTokens: validatedData.sttTokens,
            llmInputTokens: validatedData.llmInputTokens,
            llmOutputTokens: validatedData.llmOutputTokens,
            ttsTokens: validatedData.ttsTokens,
            visionTokens: totalVisionTokens,
          },
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
