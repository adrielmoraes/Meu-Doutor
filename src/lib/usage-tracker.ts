/**
 * Usage Tracker Service
 * Tracks all AI usage across the platform and stores costs in the database
 */

import { db } from '../../server/storage';
import { usageTracking } from '../../shared/schema';
import { 
  calculateLLMCost, 
  calculateTTSCost,
  calculateSTTCost,
  calculateAvatarCost,
  calculateLiveKitCost,
  usdToBRLCents,
  estimateAudioTokens,
  AI_PRICING
} from './ai-pricing';
import { countTextTokens, estimateImageTokens, estimateAudioTokens as estimateAudioTokensAccurate } from './token-counter';

export type UsageType = 
  | 'chat'              // AI Therapist chat
  | 'exam_analysis'     // Medical exam analysis
  | 'consultation_flow' // AI consultation flow
  | 'live_consultation' // Live AI consultation with avatar
  | 'tts'               // Text-to-Speech
  | 'stt'               // Speech-to-Text
  | 'diagnosis'         // Preliminary diagnosis generation
  | 'avatar'            // Avatar usage (BEY/Tavus)
  | 'livekit'           // LiveKit video/audio
  | 'vision'            // Vision API usage
  | 'wellness_plan';    // Wellness plan generation

interface TrackUsageParams {
  patientId: string;
  usageType: UsageType;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  inputText?: string;
  outputText?: string;
  durationSeconds?: number;
  contextLength?: number;
  metadata?: Record<string, any>;
}

/**
 * Track AI usage and calculate costs
 */
export async function trackAIUsage({
  patientId,
  usageType,
  model = 'gemini-2.5-flash',
  inputTokens,
  outputTokens,
  inputText,
  outputText,
  durationSeconds = 0,
  contextLength = 0,
  metadata = {},
}: TrackUsageParams): Promise<string> {
  try {
    // Estimate tokens from text if not provided
    // UPDATED: Use accurate token counting from token-counter.ts
    const estimatedInputTokens = inputTokens ?? (inputText ? countTextTokens(inputText) : 0);
    const estimatedOutputTokens = outputTokens ?? (outputText ? countTextTokens(outputText) : 0);
    
    let costUSD = 0;
    let resourceName = '';

    // Calculate cost based on usage type
    switch (usageType) {
      case 'chat':
      case 'exam_analysis':
      case 'consultation_flow':
      case 'diagnosis':
      case 'wellness_plan':
      case 'vision':
        const llmCost = calculateLLMCost(model, estimatedInputTokens, estimatedOutputTokens, { contextLength });
        costUSD = llmCost.totalCost;
        resourceName = AI_PRICING.models[model as keyof typeof AI_PRICING.models]?.name || model;
        break;

      case 'tts':
        costUSD = calculateTTSCost(model, estimatedOutputTokens);
        resourceName = AI_PRICING.audioModels[model as keyof typeof AI_PRICING.audioModels]?.name || 'Gemini TTS';
        break;

      case 'stt':
        // STT costs based on audio tokens (Gemini multimodal audio input: $3.00/1M tokens)
        // UPDATED: Use more accurate estimation (180 tokens/sec instead of 25)
        const audioTokens = estimateAudioTokensAccurate(durationSeconds);
        costUSD = calculateSTTCost(audioTokens);
        resourceName = 'Gemini 2.5 Flash STT';
        break;

      case 'live_consultation':
        // Includes LLM + TTS + Avatar costs
        const llmLiveCost = calculateLLMCost(model, estimatedInputTokens, estimatedOutputTokens);
        const avatarProvider = metadata.avatarProvider as 'beyondpresence' | 'tavus' || 'beyondpresence';
        const avatarCost = calculateAvatarCost(avatarProvider, durationSeconds / 60);
        costUSD = llmLiveCost.totalCost + avatarCost;
        resourceName = `Live Consultation (${AI_PRICING.avatars[avatarProvider].name})`;
        break;

      case 'avatar':
        const provider = metadata.avatarProvider as 'beyondpresence' | 'tavus' || 'beyondpresence';
        costUSD = calculateAvatarCost(provider, durationSeconds / 60);
        resourceName = AI_PRICING.avatars[provider].name;
        break;

      case 'livekit':
        const hasVideo = metadata.hasVideo !== false;
        costUSD = calculateLiveKitCost(durationSeconds / 60, hasVideo);
        resourceName = hasVideo ? 'LiveKit Video' : 'LiveKit Audio';
        break;
    }

    // Convert to BRL cents for storage
    const costCents = usdToBRLCents(costUSD);
    
    // Generate unique ID
    const id = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in database
    await db.insert(usageTracking).values({
      id,
      patientId,
      usageType,
      resourceName,
      tokensUsed: estimatedInputTokens + estimatedOutputTokens,
      durationSeconds,
      cost: costCents,
      metadata: {
        model,
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        contextLength,
        costUSD,
        ...metadata,
      },
    });

    console.log(`[Usage Tracker] Recorded ${usageType} for patient ${patientId}: ${resourceName}, cost: $${costUSD.toFixed(6)} (R$${(costCents / 100).toFixed(2)})`);

    return id;
  } catch (error) {
    console.error('[Usage Tracker] Error tracking usage:', error);
    throw error;
  }
}

/**
 * Track chat message usage
 */
export async function trackChatMessage(
  patientId: string,
  inputText: string,
  outputText: string,
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'chat',
    model,
    inputText,
    outputText,
    metadata: { messageType: 'therapist_chat' },
  });
}

/**
 * Track exam analysis usage
 */
export async function trackExamAnalysis(
  patientId: string,
  examId: string,
  inputTokens: number,
  outputTokens: number,
  model: string = 'gemini-2.5-flash',
  specialistCount: number = 1
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'exam_analysis',
    model,
    inputTokens,
    outputTokens,
    metadata: { examId, specialistCount },
  });
}

/**
 * Track TTS usage
 */
export async function trackTTS(
  patientId: string,
  text: string,
  model: string = 'gemini-2.5-flash-preview-tts'
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'tts',
    model,
    outputText: text,
    metadata: { textLength: text.length },
  });
}

/**
 * Track STT usage
 */
export async function trackSTT(
  patientId: string,
  durationSeconds: number,
  transcribedText: string
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'stt',
    durationSeconds,
    outputText: transcribedText,
    metadata: { transcriptLength: transcribedText.length },
  });
}

/**
 * Track live consultation usage
 */
export async function trackLiveConsultation(
  patientId: string,
  durationSeconds: number,
  totalInputTokens: number,
  totalOutputTokens: number,
  avatarProvider: 'beyondpresence' | 'tavus' = 'beyondpresence',
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'live_consultation',
    model,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    durationSeconds,
    metadata: { avatarProvider },
  });
}

/**
 * Track vision API usage
 */
export async function trackVision(
  patientId: string,
  inputTokens: number,
  outputTokens: number,
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'vision',
    model,
    inputTokens,
    outputTokens,
    metadata: { type: 'patient_visual_analysis' },
  });
}

/**
 * Track diagnosis generation
 */
export async function trackDiagnosis(
  patientId: string,
  examId: string,
  inputTokens: number,
  outputTokens: number,
  specialistCount: number,
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'diagnosis',
    model,
    inputTokens,
    outputTokens,
    metadata: { examId, specialistCount, pipeline: 'multi-specialist' },
  });
}

/**
 * Track wellness plan generation
 */
export async function trackWellnessPlan(
  patientId: string,
  inputTokens: number,
  outputTokens: number,
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'wellness_plan',
    model,
    inputTokens,
    outputTokens,
    metadata: { type: 'nutritionist_wellness' },
  });
}

/**
 * Track exam document analysis (image processing + LLM)
 */
export async function trackExamDocumentAnalysis(
  patientId: string,
  documentCount: number,
  inputTokens: number,
  outputTokens: number,
  imageTokens: number = 0,
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'exam_analysis',
    model,
    inputTokens: inputTokens + imageTokens,
    outputTokens,
    metadata: { 
      documentCount, 
      imageTokens,
      textInputTokens: inputTokens,
      pipeline: 'document_analysis' 
    },
  });
}

/**
 * Track multi-specialist diagnosis generation
 */
export async function trackMultiSpecialistDiagnosis(
  patientId: string,
  inputTokens: number,
  outputTokens: number,
  specialistCount: number,
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  return trackAIUsage({
    patientId,
    usageType: 'diagnosis',
    model,
    inputTokens,
    outputTokens,
    metadata: { 
      specialistCount, 
      pipeline: 'multi-specialist',
      tokensPerSpecialist: Math.round((inputTokens + outputTokens) / Math.max(specialistCount, 1))
    },
  });
}

/**
 * Track consultation flow (AI therapist chat with audio)
 */
export async function trackConsultationFlow(
  patientId: string,
  inputText: string,
  outputText: string,
  includesTTS: boolean = true,
  model: string = 'gemini-2.5-flash'
): Promise<string[]> {
  const ids: string[] = [];
  
  // Track the LLM usage
  const llmId = await trackAIUsage({
    patientId,
    usageType: 'consultation_flow',
    model,
    inputText,
    outputText,
    metadata: { includesTTS },
  });
  ids.push(llmId);

  // Track TTS if included
  if (includesTTS && outputText) {
    const ttsId = await trackTTS(patientId, outputText);
    ids.push(ttsId);
  }

  return ids;
}
