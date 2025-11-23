"use server";
/**
 * @fileOverview Converts text to speech using Google Cloud Text-to-Speech API.
 * Specialized service for high-quality audio generation in Portuguese (Brazil).
 *
 * - textToSpeech - A function that handles the text-to-speech conversion.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import { z } from "genkit";
import fetch from "node-fetch";

const TextToSpeechInputSchema = z.object({
  text: z.string().describe("The text to be converted to speech."),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The generated audio as a data URI. Expected format: 'data:audio/mp3;base64,<encoded_data>'.",
    ),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(
  input: TextToSpeechInput,
): Promise<TextToSpeechOutput | null> {
  try {
    if (!input.text) {
      throw new Error("Input text cannot be empty.");
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    // Use Google Cloud Text-to-Speech API via REST
    const apiUrl = "https://texttospeech.googleapis.com/v1/text:synthesize";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          text: input.text,
        },
        voice: {
          languageCode: "pt-BR",
          name: "pt-BR-Neural2-C", // Female voice, neural quality
        },
        audioConfig: {
          audioEncoding: "MP3",
          pitch: 0,
          speakingRate: 1,
        },
      }),
      // @ts-ignore
      query: {
        key: process.env.GEMINI_API_KEY,
      },
    });

    // Add API key as query parameter
    const urlWithKey = `${apiUrl}?key=${process.env.GEMINI_API_KEY}`;
    
    const ttsResponse = await fetch(urlWithKey, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          text: input.text,
        },
        voice: {
          languageCode: "pt-BR",
          name: "pt-BR-Neural2-C", // Female voice, neural quality
        },
        audioConfig: {
          audioEncoding: "MP3",
          pitch: 0,
          speakingRate: 1,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.text();
      console.error("[TTS Flow] API Error:", errorData);
      throw new Error(`TTS API error: ${ttsResponse.status} ${ttsResponse.statusText}`);
    }

    const data = await ttsResponse.json() as any;

    if (!data.audioContent) {
      throw new Error("TTS API did not return audio content.");
    }

    // Audio content is already base64 encoded from the API
    return {
      audioDataUri: `data:audio/mp3;base64,${data.audioContent}`,
    };
  } catch (error) {
    console.error("[TTS Flow] TTS generation failed:", error);

    if (error instanceof Error) {
      if (error.message.includes("403")) {
        throw new Error(
          `A API Text-to-Speech não está habilitada. Ative-a no Google Cloud Console.`,
        );
      }
      if (error.message.includes("404")) {
        throw new Error(
          `Voz PT-BR não encontrada. Verifique a configuração da voz.`,
        );
      }
      if (error.message.includes("UNAUTHENTICATED")) {
        throw new Error(
          `Erro de autenticação. Verifique a GEMINI_API_KEY.`,
        );
      }
      throw new Error(`Falha na geração de áudio: ${error.message}`);
    }
    throw new Error("Ocorreu um erro desconhecido durante a geração de áudio.");
  }
}
