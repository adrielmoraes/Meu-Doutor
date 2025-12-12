/**
 * AI Pricing Configuration
 * All prices are per 1 million tokens (for LLMs) or per minute (for audio/avatar)
 * Values in USD
 */

export const AI_PRICING = {
  // Gemini Models - LLM (per 1M tokens)
  // Official pricing from: https://ai.google.dev/gemini-api/docs/pricing
  // Last updated: December 2025 (User-provided pricing sheet)
  models: {
    'gemini-3-pro-preview': {
      name: 'Gemini 3 Pro Preview',
      description: 'Most intelligent model with SOTA reasoning and multimodal understanding',
      input: { upTo200k: 2.00, over200k: 4.00 },
      output: { upTo200k: 12.00, over200k: 18.00 },
      knowledgeCutoff: '2025-01',
    },
    'gemini-2.5-pro': {
      name: 'Gemini 2.5 Pro',
      description: 'Advanced reasoning model, excels at coding and complex reasoning tasks',
      input: { upTo200k: 1.25, over200k: 2.50 },
      output: { upTo200k: 10.00, over200k: 15.00 },
      knowledgeCutoff: '2025-01',
    },
    'gemini-2.5-flash': {
      name: 'Gemini 2.5 Flash',
      description: 'Hybrid reasoning model with 1M token context window and thinking budgets',
      // Input: $0.30 per 1M tokens (all context lengths)
      // Output: $2.50 per 1M tokens (all context lengths)
      input: { all: 0.30 },
      output: { all: 2.50 },
      knowledgeCutoff: '2025-01',
    },
    'gemini-2.5-flash-lite': {
      name: 'Gemini 2.5 Flash-Lite',
      description: 'Smallest and most cost effective model, built for at scale usage',
      input: { all: 0.10 },
      output: { all: 0.40 },
      knowledgeCutoff: '2025-01',
    },
    'gemini-2.0-flash': {
      name: 'Gemini 2.0 Flash',
      description: 'Most balanced multimodal model with great performance across all tasks',
      input: { all: 0.10 },
      output: { all: 0.40 },
      knowledgeCutoff: '2024-08',
    },
    'gemini-2.0-flash-lite': {
      name: 'Gemini 2.0 Flash-Lite',
      description: 'Smallest and most cost effective model for at scale usage',
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
    // Aliases (points to other models)
    'gemini-flash-latest': {
      name: 'Gemini Flash Latest',
      description: 'Points to gemini-2.5-flash-preview-09-2025',
      input: { all: 0.30 },
      output: { all: 2.50 },
      knowledgeCutoff: '2025-01',
    },
    'gemini-flash-lite-latest': {
      name: 'Gemini Flash-Lite Latest',
      description: 'Points to gemini-2.5-flash-lite-preview-09-2025',
      input: { all: 0.10 },
      output: { all: 0.40 },
      knowledgeCutoff: '2025-01',
    },
  },

  // Image Generation Models (per 1M tokens for text, per image for output)
  imageModels: {
    'gemini-3-pro-image-preview': {
      name: 'Gemini 3 Pro Image Preview',
      description: 'State-of-the-art image generation and editing model',
      textInput: 2.00,        // $2.00 per 1M tokens
      textOutput: 12.00,      // $12.00 per 1M tokens
      imageOutput: 0.134,     // $0.134 per image
    },
    'gemini-2.5-flash-image': {
      name: 'Gemini 2.5 Flash Image',
      description: 'State-of-the-art image generation and editing model',
      textInput: 0.30,        // $0.30 per 1M tokens
      textOutput: 2.50,       // $2.50 per 1M tokens
      imageOutput: 0.039,     // $0.039 per image
      knowledgeCutoff: '2025-06',
    },
  },

  // Audio Models (per 1M tokens) - Official pricing Dec 2025
  audioModels: {
    // Native Audio - Natural voice with better pacing, voice naturalness, mood
    'gemini-2.5-flash-native-audio-preview-09-2025': {
      name: 'Gemini 2.5 Flash Native Audio Preview',
      description: 'Native audio models for higher quality audio outputs with better pacing, voice naturalness, verbosity, and mood',
      textInput: 0.50,          // $0.50 per 1M text input tokens
      textOutput: 12.00,        // $12.00 per 1M text output tokens
      audioVideoInput: 3.00,    // $3.00 per 1M audio/video input tokens
      audioVideoOutput: 12.00,  // $12.00 per 1M audio/video output tokens
    },
    // Standard TTS Models
    'gemini-2.5-flash-preview-tts': {
      name: 'Gemini 2.5 Flash Preview TTS',
      description: 'Text-to-speech model optimized for price-performant, low-latency, controllable speech generation',
      input: 0.50,              // $0.50 per 1M tokens
      output: 10.00,            // $10.00 per 1M tokens
    },
    'gemini-2.5-pro-preview-tts': {
      name: 'Gemini 2.5 Pro Preview TTS',
      description: 'Text-to-speech model optimized for powerful, low-latency speech generation with natural outputs',
      input: 1.00,              // $1.00 per 1M tokens
      output: 20.00,            // $20.00 per 1M tokens
    },
  },

  // Live API Native Audio (for real-time consultations with Gemini 2.5 Flash Native Audio)
  liveApiAudio: {
    // Gemini 2.5 Flash Native Audio (Live API)
    textInput: 0.50,           // $0.50 per 1M text input tokens
    textOutput: 12.00,         // $12.00 per 1M text output tokens
    audioVideoInput: 3.00,     // $3.00 per 1M audio/video input tokens
    audioVideoOutput: 12.00,   // $12.00 per 1M audio/video output tokens
  },

  // Avatar Providers (per minute)
  avatars: {
    'beyondpresence': {
      name: 'BeyondPresence Avatar',
      perMinute: 0.176, // $0.176/min
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
// Uses the new Gemini 2.5 Flash Native Audio pricing structure
export function calculateLiveApiAudioCost(
  textInputTokens: number,
  textOutputTokens: number,
  audioVideoInputTokens: number = 0,
  audioVideoOutputTokens: number = 0
): {
  textInputCost: number;
  textOutputCost: number;
  audioInputCost: number;
  audioOutputCost: number;
  totalCost: number
} {
  const textInputCost = (textInputTokens / 1_000_000) * AI_PRICING.liveApiAudio.textInput;
  const textOutputCost = (textOutputTokens / 1_000_000) * AI_PRICING.liveApiAudio.textOutput;
  const audioInputCost = (audioVideoInputTokens / 1_000_000) * AI_PRICING.liveApiAudio.audioVideoInput;
  const audioOutputCost = (audioVideoOutputTokens / 1_000_000) * AI_PRICING.liveApiAudio.audioVideoOutput;

  return {
    textInputCost,
    textOutputCost,
    audioInputCost,
    audioOutputCost,
    totalCost: textInputCost + textOutputCost + audioInputCost + audioOutputCost,
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

  // Handle different audio model pricing structures
  if ('output' in pricing) {
    return (outputTokens / 1_000_000) * pricing.output;
  } else if ('audioVideoOutput' in pricing) {
    // Native audio model - use audio output pricing
    return (outputTokens / 1_000_000) * pricing.audioVideoOutput;
  }

  // Fallback
  return (outputTokens / 1_000_000) * 10.00;
}

// Helper function to calculate STT cost (based on audio input tokens)
// Uses Gemini 2.5 Flash Native Audio pricing: $3.00 per 1M audio/video input tokens
export function calculateSTTCost(
  audioTokens: number
): number {
  // Audio/Video input tokens: $3.00 per 1M tokens (Gemini 2.5 Flash Native Audio)
  return (audioTokens / 1_000_000) * AI_PRICING.liveApiAudio.audioVideoInput;
}

// Estimate tokens from audio duration
// UPDATED: Gemini 2.5 Flash Native Audio uses ~180 tokens per second
// Previous: 25 tokens/second (40% underestimate)
// New: 180 tokens/second (accurate based on official pricing)
export function estimateAudioTokens(durationSeconds: number): number {
  return Math.ceil(durationSeconds * 180);
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

// Default exchange rate: R$5.42 per $1 USD (can be configured via EXCHANGE_RATE env)
const DEFAULT_EXCHANGE_RATE = 5.42;

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

// Estimate tokens from text (rough estimation - DEPRECATED)
// Use countTextTokens from token-counter.ts for accurate counting
export function estimateTokens(text: string): number {
  // DEPRECATED: This is a fallback for backwards compatibility
  // For new code, use countTextTokens from 'token-counter.ts'
  // Rough estimate: 1 token ~= 4 characters for English, ~3 for Portuguese
  console.warn('[AI Pricing] estimateTokens is deprecated, use countTextTokens from token-counter.ts');
  return Math.ceil(text.length / 3.5);
}
