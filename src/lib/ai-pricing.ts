/**
 * AI Pricing Configuration
 * All prices are per 1 million tokens (for LLMs) or per minute (for audio/avatar)
 * Values in USD
 */

export const AI_PRICING = {
  // Gemini Models - LLM (per 1M tokens)
  // Official pricing from: https://ai.google.dev/gemini-api/docs/pricing
  // Last updated: December 2025
  models: {
    'gemini-3-pro-preview': {
      name: 'Gemini 3 Pro Preview',
      input: { upTo200k: 2.00, over200k: 4.00 },
      output: { upTo200k: 12.00, over200k: 18.00 },
      knowledgeCutoff: '2025-01',
    },
    'gemini-2.5-pro': {
      name: 'Gemini 2.5 Pro',
      input: { upTo200k: 1.25, over200k: 2.50 },
      output: { upTo200k: 10.00, over200k: 15.00 },
      knowledgeCutoff: '2025-01',
    },
    'gemini-2.5-flash': {
      name: 'Gemini 2.5 Flash',
      // Input: $0.30 (text/image/video), $1.00 (audio)
      // Output: $0.60 (no thinking), $3.50 (with thinking)
      input: { all: 0.30, audio: 1.00 },
      output: { all: 0.60, withThinking: 3.50 },
      knowledgeCutoff: '2025-01',
    },
    'gemini-2.5-flash-lite': {
      name: 'Gemini 2.5 Flash-Lite',
      input: { all: 0.10 },
      output: { all: 0.40 },
      knowledgeCutoff: '2025-01',
    },
    'gemini-2.0-flash': {
      name: 'Gemini 2.0 Flash',
      input: { all: 0.10 },
      output: { all: 0.40 },
      knowledgeCutoff: '2024-08',
    },
    'gemini-2.0-flash-lite': {
      name: 'Gemini 2.0 Flash-Lite',
      input: { all: 0.075 },
      output: { all: 0.30 },
      knowledgeCutoff: '2024-08',
    },
    'gemini-2.0-flash-exp': {
      name: 'Gemini 2.0 Flash (Experimental)',
      input: { all: 0.10 },
      output: { all: 0.40 },
      knowledgeCutoff: '2024-08',
    },
  },

  // Image Generation Models (per image output)
  imageModels: {
    'gemini-3-pro-image-preview': {
      name: 'Gemini 3 Pro Image Preview',
      textInput: 2.00,
      textOutput: 12.00,
      imageOutput: 0.134,
    },
    'gemini-2.5-flash-image': {
      name: 'Gemini 2.5 Flash Image',
      textInput: 0.30,
      textOutput: 0.60,
      imageOutput: 0.039,
    },
  },

  // Audio Models (per 1M tokens) - Official pricing Dec 2025
  audioModels: {
    // Native Audio - Natural voice with better pacing, voice naturalness, mood
    'gemini-2.5-flash-native-audio-preview-09-2025': {
      name: 'Gemini 2.5 Flash Native Audio Preview',
      input: 1.00,   // $1.00 per 1M tokens
      output: 20.00, // $20.00 per 1M tokens
    },
    // Standard TTS
    'gemini-2.5-flash-preview-tts': {
      name: 'Gemini 2.5 Flash Preview TTS',
      input: 0.50,
      output: 10.00,
    },
    'gemini-2.5-pro-preview-tts': {
      name: 'Gemini 2.5 Pro Preview TTS',
      input: 0.50,
      output: 10.00,
    },
  },
  
  // Live API Native Audio (for real-time consultations)
  liveApiAudio: {
    // Gemini 2.5 Flash Native Audio (Live API)
    input: 1.00,   // $1.00 per 1M audio input tokens
    output: 20.00, // $20.00 per 1M audio output tokens
  },

  // Avatar Providers (per minute)
  avatars: {
    'beyondpresence': {
      name: 'BeyondPresence Avatar',
      perMinute: 0.175, // $0.175/min
    },
    'tavus': {
      name: 'Tavus CVI',
      perMinute: 0.10, // Estimated - update with actual pricing
    },
  },

  // LiveKit (estimated costs)
  livekit: {
    videoPerMinute: 0.004, // $0.004/min per participant
    audioPerMinute: 0.001, // $0.001/min per participant
  },
} as const;

// Helper function to calculate LLM cost
export function calculateLLMCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  options: {
    contextLength?: number;
    hasAudioInput?: boolean;
    hasThinking?: boolean;
  } = {}
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = AI_PRICING.models[model as keyof typeof AI_PRICING.models];
  
  if (!pricing) {
    console.warn(`[AI Pricing] Unknown model: ${model}, using gemini-2.5-flash pricing`);
    return calculateLLMCost('gemini-2.5-flash', inputTokens, outputTokens, options);
  }

  const { contextLength = 0, hasAudioInput = false, hasThinking = false } = options;
  const isOver200k = contextLength > 200000;
  
  let inputPrice: number;
  let outputPrice: number;

  if ('all' in pricing.input) {
    // For models with flat pricing (Flash, etc)
    // Check if audio input pricing is available
    if (hasAudioInput && 'audio' in pricing.input) {
      inputPrice = (pricing.input as { all: number; audio: number }).audio;
    } else {
      inputPrice = pricing.input.all;
    }
    
    // Check if thinking output pricing is available
    if (hasThinking && 'withThinking' in pricing.output) {
      outputPrice = (pricing.output as { all: number; withThinking: number }).withThinking;
    } else {
      outputPrice = (pricing.output as { all: number }).all;
    }
  } else {
    // For models with tiered pricing (Pro, etc)
    inputPrice = isOver200k ? pricing.input.over200k : pricing.input.upTo200k;
    outputPrice = isOver200k 
      ? (pricing.output as { upTo200k: number; over200k: number }).over200k 
      : (pricing.output as { upTo200k: number; over200k: number }).upTo200k;
  }

  // Convert from per-1M-tokens to actual cost
  const inputCost = (inputTokens / 1_000_000) * inputPrice;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

// Calculate Live API audio costs (real-time consultations with Native Audio)
export function calculateLiveApiAudioCost(
  inputAudioTokens: number,
  outputAudioTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputAudioTokens / 1_000_000) * AI_PRICING.liveApiAudio.input;
  const outputCost = (outputAudioTokens / 1_000_000) * AI_PRICING.liveApiAudio.output;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

// Helper function to calculate TTS cost (based on output tokens/characters)
export function calculateTTSCost(
  model: string,
  outputTokens: number
): number {
  const pricing = AI_PRICING.audioModels[model as keyof typeof AI_PRICING.audioModels];
  
  if (!pricing) {
    // Default to flash TTS pricing
    return (outputTokens / 1_000_000) * 10.00;
  }

  return (outputTokens / 1_000_000) * pricing.output;
}

// Helper function to calculate STT cost (based on audio input tokens)
// Uses Gemini 2.5 Flash multimodal audio input pricing: $1.00 per 1M tokens
export function calculateSTTCost(
  audioTokens: number
): number {
  // Audio input tokens: $1.00 per 1M tokens
  return (audioTokens / 1_000_000) * 1.00;
}

// Estimate tokens from audio duration
// Approximately 25 tokens per second of audio (16kHz, mono)
export function estimateAudioTokens(durationSeconds: number): number {
  return Math.ceil(durationSeconds * 25);
}

// Helper function to calculate avatar cost
export function calculateAvatarCost(
  provider: 'beyondpresence' | 'tavus',
  durationMinutes: number
): number {
  const pricing = AI_PRICING.avatars[provider];
  return durationMinutes * pricing.perMinute;
}

// Helper function to calculate LiveKit cost
export function calculateLiveKitCost(
  durationMinutes: number,
  hasVideo: boolean = true
): number {
  if (hasVideo) {
    return durationMinutes * AI_PRICING.livekit.videoPerMinute;
  }
  return durationMinutes * AI_PRICING.livekit.audioPerMinute;
}

// Default exchange rate: 5.0 (can be configured via EXCHANGE_RATE env)
const DEFAULT_EXCHANGE_RATE = 5.0;

// Convert USD to BRL cents for storage
export function usdToBRLCents(usdAmount: number, exchangeRate?: number): number {
  const rate = exchangeRate || parseFloat(process.env.EXCHANGE_RATE || '') || DEFAULT_EXCHANGE_RATE;
  return Math.round(usdAmount * rate * 100);
}

// Format cost for display
export function formatCostUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatCostBRL(amountCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

// Estimate tokens from text (rough estimation)
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ~= 4 characters for English, ~3 for Portuguese
  return Math.ceil(text.length / 3.5);
}
