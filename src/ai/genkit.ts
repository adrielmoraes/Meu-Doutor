import { genkit, ModelReference } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

const plugins = [];

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

// Configura o provedor Google Gemini se a chave de API estiver definida
if (apiKey) {
  if (!apiKey.startsWith("AIzaSy")) {
    console.warn(
      "[Genkit ⚠️ AVISO] A chave em GEMINI_API_KEY não começa com 'AIzaSy'. O Google AI Studio requer uma API Key iniciada por 'AIzaSy' (https://aistudio.google.com/app/apikey).",
    );
  }
  plugins.push(googleAI({ apiKey }));
  console.log("[Genkit] Google AI Plugin enabled.");
} else {
  console.warn(
    "[Genkit] GEMINI_API_KEY is not set. Google AI features will be disabled.",
  );
}

if (plugins.length === 0) {
  console.error(
    "[Genkit] No AI providers are configured. Please set GEMINI_API_KEY in your .env file.",
  );
}

export const ai = genkit({
  plugins,
  // Gemini 3.5 Flash - Modelo estável, rápido e de alta capacidade
  model: "googleai/gemini-3.5-flash",
});
