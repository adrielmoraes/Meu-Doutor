import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from '@genkit-ai/openai';

// Lista de provedores de modelos a serem usados.
const plugins = [];
const availableModels: string[] = [];

// Configura o provedor Google Gemini se a chave de API estiver definida.
// É necessário para o serviço de Text-to-Speech (TTS).
if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI({apiKey: process.env.GEMINI_API_KEY}));
  console.log('[Genkit] Google AI Plugin (for TTS) enabled.');
}

// Configura o provedor OpenRouter se a chave de API estiver definida.
if (process.env.OPENROUTER_API_KEY) {
  plugins.push(
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  );
  // Adiciona os modelos definidos na variável de ambiente.
  const models = (process.env.OPENROUTER_MODELS || '').split(',').map(m => m.trim()).filter(m => m);
  if(models.length > 0) {
    availableModels.push(...models);
    console.log(`[Genkit] OpenRouter Plugin enabled with models: ${models.join(', ')}.`);
  } else {
    console.warn("[Genkit] OpenRouter API key is set, but no models are defined in OPENROUTER_MODELS.");
  }
} else {
    console.warn("[Genkit] OPENROUTER_API_KEY is not set. Most AI features will be disabled.");
}

// Define o primeiro modelo da lista como o padrão.
const defaultModel = availableModels[0];

export const ai = genkit({
  plugins,
  model: defaultModel || undefined,
  enableTracing: true
});
