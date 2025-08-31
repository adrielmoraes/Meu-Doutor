import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Lista de provedores de modelos a serem usados.
const plugins = [];

// Configura o provedor Google Gemini se a chave de API estiver definida.
if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI({apiKey: process.env.GEMINI_API_KEY}));
  console.log('[Genkit] Google AI Plugin enabled.');
} else {
    console.warn("[Genkit] GEMINI_API_KEY is not set. AI features may be disabled.");
}

export const ai = genkit({
  plugins,
  enableTracing: true
});
