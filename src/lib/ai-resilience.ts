
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const FALLBACK_MODELS = [
    'googleai/gemini-2.5-flash',
    'googleai/gemini-3.1-pro-preview',
    'googleai/gemini-3-pro-preview',
    'googleai/gemini-3-flash-preview',
    'googleai/gemini-2.5-pro'
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
            // Attach the exact model used so callers can log it in the database
            return Object.assign(result, { fallbackModel: model });
        } catch (error: any) {
            console.warn(`[AI Resilience] ⚠️ Failed with ${model}:`, error.message);
            lastError = error;

            // Check if it's a Rate Limit (429) error
            const isRateLimit = error.message?.includes('429') || error.status === 429;

            if (isRateLimit) {
                let waitTimeMs = 15000; // Default fallback delay is now 15s instead of 5s

                // Try to extract exact retryDelay from Google Generative AI Error Details
                if (error.errorDetails && Array.isArray(error.errorDetails)) {
                    const retryInfo = error.errorDetails.find((d: any) =>
                        d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' || d.retryDelay
                    );

                    if (retryInfo && typeof retryInfo.retryDelay === 'string') {
                        // retryDelay usually comes in format "44s"
                        const seconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10);
                        if (!isNaN(seconds) && seconds > 0) {
                            waitTimeMs = (seconds * 1000) + 1000; // Add 1 extra safe second
                            console.log(`[AI Resilience] ⏳ Google API explicitly requested a retry delay of ${seconds}s`);
                        }
                    }
                }

                console.log(`[AI Resilience] ⏳ Rate Limit (429) detected. Waiting ${waitTimeMs / 1000}s before trying next fallback...`);
                await new Promise(resolve => setTimeout(resolve, waitTimeMs));
            } else {
                // For other errors (500, 400), immediate quick delay
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    console.error('[AI Resilience] ❌ All models failed.');
    throw lastError;
}
