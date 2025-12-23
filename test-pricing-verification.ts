
import { calculateTTSCost, AI_PRICING } from './src/lib/ai-pricing';
import { calculateLLMCost } from './src/lib/ai-pricing';

// Test 1: TTS Cost (Input + Output)
const modelTTS = 'gemini-2.5-flash-preview-tts';
const inputChars = 1000;
const inputTokens = Math.ceil(inputChars / 3.5); // ~286 tokens
const durationSeconds = 60;
const outputTokens = Math.ceil(durationSeconds * 180); // 10800 tokens

const costTTS = calculateTTSCost(modelTTS, outputTokens, inputTokens);
console.log(`TTS Cost Test:`);
console.log(`Input Tokens: ${inputTokens}`);
console.log(`Output Tokens: ${outputTokens}`);
console.log(`Cost: $${costTTS.toFixed(6)}`);

// Expected TTS Cost:
// Input: (286 / 1M) * $0.50 = $0.000143
// Output: (10800 / 1M) * $10.00 = $0.108000
// Total: $0.108143

// Test 2: Podcast Script Cost (Prompt + Data + Output)
const modelLLM = 'gemini-2.5-flash-lite';
const promptTemplateTokens = 500;
const patientDataTokens = 1000;
const totalInputTokens = promptTemplateTokens + patientDataTokens;
const scriptOutputTokens = 800;

const costScript = calculateLLMCost(modelLLM, totalInputTokens, scriptOutputTokens);
console.log(`\nScript Cost Test:`);
console.log(`Input Tokens: ${totalInputTokens}`);
console.log(`Output Tokens: ${scriptOutputTokens}`);
console.log(`Cost: $${costScript.totalCost.toFixed(6)}`);

// Expected Script Cost (Flash-Lite):
// Input: (1500 / 1M) * $0.10 = $0.000150
// Output: (800 / 1M) * $0.40 = $0.000320
// Total: $0.000470
