import {genkit, ModelReference} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins = [];

// Configura o provedor Google Gemini se a chave de API estiver definida
if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI({apiKey: process.env.GEMINI_API_KEY}));
  console.log('[Genkit] Google AI Plugin enabled.');
} else {
  console.warn("[Genkit] GEMINI_API_KEY is not set. Google AI features will be disabled.");
}

if(plugins.length === 0) {
    console.error("[Genkit] No AI providers are configured. Please set GEMINI_API_KEY in your .env file.");
}


export const ai = genkit({
  plugins,
  // Define um modelo padrão, mas pode ser sobrescrito em cada chamada.
  model: googleAI.model('gemini-1.5-flash-latest'),
});
