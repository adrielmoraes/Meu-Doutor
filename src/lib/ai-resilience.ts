
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const FALLBACK_MODELS = [
    'googleai/gemini-2.5-flash-lite', // 1st choice: Fast, cheap
    'googleai/gemini-2.5-flash',      // 2nd choice: Standard
    'googleai/gemini-1.5-flash',      // 3rd choice: High availability fallback
] as const;

type FallbackOptions<I, O> = {
    prompt: any; // Genkit PromptAction
    input: I;
    retryCount?: number; // per model
};

/**
 * Executes a Genkit prompt with a multi-model fallback strategy.
 * Tries models in order: Flash-Lite -> Flash 2.5 -> Flash 1.5.
 */
export async function generateWithFallback<I, O>({ prompt, input }: FallbackOptions<I, O>) {
    let lastError: any;

    for (const model of FALLBACK_MODELS) {
        try {
            console.log(`[AI Resilience] Attempting generation with model: ${model}`);

            // We use ai.generate to explicitly override the model defined in the prompt
            // Execute the prompt directly with model override options
            const result = await prompt(input, {
                model: model
            });

            console.log(`[AI Resilience] ✅ Success with ${model}`);
            return result;
        } catch (error: any) {
            console.warn(`[AI Resilience] ⚠️ Failed with ${model}:`, error.message);
            lastError = error;

            // If it's a 429 (Quota) or 5xx (Server), we continue to next model.
            // If it's a 400 (Bad Request), it might be the input, but we try anyway just in case it's model-specific.

            // Small delay before next attempt to be nice
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.error('[AI Resilience] ❌ All models failed.');
    throw lastError;
}
