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
    const expectedSecret = process.env.AGENT_SECRET;

    // Require AGENT_SECRET to be configured - no hardcoded fallback for security
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

    // Use real Gemini Native Audio pricing: Input $1.00/1M, Output $20.00/1M
    const NATIVE_AUDIO_INPUT_PRICE = 1.00; // per 1M tokens
    const NATIVE_AUDIO_OUTPUT_PRICE = 20.00; // per 1M tokens
    
    // Calculate all costs upfront
    const sttCostUSD = (validatedData.sttTokens / 1_000_000) * NATIVE_AUDIO_INPUT_PRICE;
    const ttsCostUSD = (validatedData.ttsTokens / 1_000_000) * NATIVE_AUDIO_OUTPUT_PRICE;
    const llmCost = calculateLLMCost(
      'gemini-2.5-flash',
      validatedData.llmInputTokens,
      validatedData.llmOutputTokens
    );
    const totalVisionTokens = validatedData.visionInputTokens + validatedData.visionOutputTokens;
    const visionCost = calculateLLMCost(
      'gemini-2.5-flash',
      validatedData.visionInputTokens || validatedData.visionTokens || 0,
      validatedData.visionOutputTokens || 0
    );
    const avatarCostUSD = calculateAvatarCost(
      validatedData.avatarProvider,
      validatedData.activeSeconds / 60
    );
    
    // Total cost calculated from components
    const totalCostUSD = sttCostUSD + ttsCostUSD + llmCost.totalCost + visionCost.totalCost + avatarCostUSD;
    
    // Salvar métricas STT (durationSeconds=0 to avoid double counting)
    if (validatedData.sttTokens > 0) {
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'stt',
        resourceName: 'Gemini 2.5 Flash Native Audio (STT)',
        tokensUsed: validatedData.sttTokens,
        durationSeconds: 0, // Don't duplicate duration - only record on ai_call
        cost: usdToBRLCents(sttCostUSD),
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          costUSD: sttCostUSD,
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas LLM (durationSeconds=0 to avoid double counting)
    const totalLlmTokens = validatedData.llmInputTokens + validatedData.llmOutputTokens;
    if (totalLlmTokens > 0) {
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'llm',
        resourceName: 'Gemini 2.5 Flash',
        tokensUsed: totalLlmTokens,
        durationSeconds: 0, // Don't duplicate duration
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

    // Salvar métricas TTS (durationSeconds=0 to avoid double counting)
    if (validatedData.ttsTokens > 0) {
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'tts',
        resourceName: 'Gemini 2.5 Flash Native Audio (TTS)',
        tokensUsed: validatedData.ttsTokens,
        durationSeconds: 0, // Don't duplicate duration
        cost: usdToBRLCents(ttsCostUSD),
        metadata: {
          sessionId: validatedData.sessionId,
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          costUSD: ttsCostUSD,
          ...validatedData.metadata,
        },
      });
    }

    // Salvar métricas de Visão (durationSeconds=0 to avoid double counting)
    if (totalVisionTokens > 0 || validatedData.visionTokens > 0) {
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'vision',
        resourceName: 'Gemini 2.5 Flash Vision',
        tokensUsed: totalVisionTokens || validatedData.visionTokens,
        durationSeconds: 0, // Don't duplicate duration
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

    // Salvar métricas do Avatar (durationSeconds=0, cost tracked separately)
    if (validatedData.activeSeconds > 0) {
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'avatar',
        resourceName: AI_PRICING.avatars[validatedData.avatarProvider].name,
        tokensUsed: 0,
        durationSeconds: 0, // Don't duplicate duration - only record on ai_call
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

    // Salvar métricas consolidadas da chamada IA (único registro com duration, cost=0 para evitar duplicação)
    // Os custos individuais são registrados nas linhas acima
    if (validatedData.activeSeconds > 0) {
      const totalTokensUsed = validatedData.sttTokens + validatedData.llmInputTokens + 
                              validatedData.llmOutputTokens + validatedData.ttsTokens + totalVisionTokens;
      
      await trackUsage({
        patientId: validatedData.patientId,
        usageType: 'ai_call',
        resourceName: 'Consulta IA ao Vivo',
        tokensUsed: totalTokensUsed,
        durationSeconds: validatedData.activeSeconds, // Duration only recorded here
        cost: 0, // Costs already recorded in component rows above
        metadata: {
          sessionId: validatedData.sessionId,
          avatarProvider: validatedData.avatarProvider,
          totalTokens: totalTokensUsed,
          totalCostUSD: totalCostUSD,
          totalCostBRL: usdToBRLCents(totalCostUSD) / 100,
          breakdown: {
            sttTokens: validatedData.sttTokens,
            sttCostUSD: sttCostUSD,
            llmInputTokens: validatedData.llmInputTokens,
            llmOutputTokens: validatedData.llmOutputTokens,
            llmCostUSD: llmCost.totalCost,
            ttsTokens: validatedData.ttsTokens,
            ttsCostUSD: ttsCostUSD,
            visionTokens: totalVisionTokens || validatedData.visionTokens,
            visionCostUSD: visionCost.totalCost,
            avatarCostUSD: avatarCostUSD,
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
