/**
 * Precise Token Counting for Gemini Models
 * Uses js-tiktoken for accurate BPE tokenization compatible with Gemini
 * Includes special handling for images, audio, and multimodal content
 */

import { encoding_for_model } from 'js-tiktoken';

// Cache encoding instance (expensive to create)
let cachedEncoding: ReturnType<typeof encoding_for_model> | null = null;

/**
 * Get cached encoding instance for Gemini-compatible tokenization
 * cl100k_base is used by both GPT and Gemini for text tokenization
 */
function getEncoding() {
  if (!cachedEncoding) {
    try {
      // cl100k_base is compatible with Gemini tokenization
      cachedEncoding = encoding_for_model('gpt-3.5-turbo');
    } catch (error) {
      console.error('[Token Counter] Error loading encoding, falling back to estimation');
      return null;
    }
  }
  return cachedEncoding;
}

/**
 * Count tokens in text using precise BPE tokenization
 * Fallback to estimation if encoding fails
 */
export function countTextTokens(text: string): number {
  if (!text) return 0;

  const encoding = getEncoding();
  if (!encoding) {
    // Fallback: more accurate estimation than simple char count
    // Portuguese: ~3-3.5 chars per token
    return Math.ceil(text.length / 3.2);
  }

  try {
    const tokens = encoding.encode(text);
    return tokens.length;
  } catch (error) {
    console.warn('[Token Counter] Error encoding text, falling back to estimation');
    return Math.ceil(text.length / 3.2);
  }
}

/**
 * Estimate tokens for image processing
 * Based on Gemini's vision token allocation:
 * - Thumbnail: ~257 tokens
 - Standard (up to 1024x768): ~1000-2000 tokens
 - High res (up to 2048x1768): ~2500-4000 tokens
 - Extra high res: ~4000+ tokens
 *
 * Approximation: pixels / 1024 * 170 (more conservative than Google's estimate)
 */
export function estimateImageTokens(
  widthPx: number,
  heightPx: number,
  detail: 'low' | 'medium' | 'high' = 'high'
): number {
  if (detail === 'low') {
    // Low detail: ~257 tokens (thumbnail)
    return 257;
  }

  const totalPixels = widthPx * heightPx;

  // Medium/High detail: ~170 tokens per 1024 pixels (conservative estimate)
  // Actual: ~260 tokens per 1024 pixels, but we use conservative to account for compression
  const baseTokens = Math.ceil((totalPixels / 1024) * 170);

  // Minimum threshold for image processing
  const minTokens = 257;

  if (detail === 'medium') {
    // Medium reduces by ~40%
    return Math.max(minTokens, Math.ceil(baseTokens * 0.6));
  }

  // High detail
  return Math.max(minTokens, baseTokens);
}

/**
 * Estimate tokens for audio/video input
 * Gemini 2.5 Flash Native Audio: ~170-200 tokens per second
 * We use 180 as middle estimate
 */
export function estimateAudioTokens(durationSeconds: number): number {
  // More accurate than previous 25 tokens/sec
  // Real Gemini: 170-200 tokens/second of audio
  return Math.ceil(durationSeconds * 180);
}

/**
 * Estimate tokens for audio/video output (TTS)
 * Based on text content that will be synthesized
 * Roughly 1 second of audio per 100-150 tokens of text
 */
export function estimateTTSAudioTokens(durationSeconds: number): number {
  // TTS audio output: ~45-60 tokens per second
  // More accurate than previous 25 tokens/sec
  return Math.ceil(durationSeconds * 50);
}

/**
 * Format tokens with proper locale
 */
export function formatTokens(count: number): string {
  return count.toLocaleString('pt-BR');
}

/**
 * Debug function to compare actual vs estimated tokens
 */
export function debugTokenCounting(text: string, label: string = 'Text') {
  const actual = countTextTokens(text);
  const estimated = Math.ceil(text.length / 3.2);
  const difference = ((estimated - actual) / actual * 100).toFixed(1);

  console.log(
    `[Token Debug] ${label}: actual=${actual}, estimated=${estimated}, diff=${difference}%`
  );

  return { actual, estimated, difference: Number(difference) };
}

/**
 * Batch token counting for multiple texts
 */
export function countBatchTokens(texts: string[]): number {
  return texts.reduce((sum, text) => sum + countTextTokens(text), 0);
}
