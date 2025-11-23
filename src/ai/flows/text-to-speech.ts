"use server";
/**
 * @fileOverview Converts text to speech using Google Gemini TTS API.
 * Uses the Google GenAI API with gemini-2.5-flash-preview-tts model.
 *
 * - textToSpeech - A function that handles the text-to-speech conversion.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "genkit";
import wav from "wav";

const TextToSpeechInputSchema = z.object({
  text: z.string().describe("The text to be converted to speech."),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'.",
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

    // Use Google GenAI API with gemini-2.5-flash-preview-tts model
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY
    });

    // Generate content with audio modality using TTS model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ 
        parts: [{ text: `Fale em português brasileiro de forma natural e clara: ${input.text}` }] 
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Erinome'
            }
          }
        }
      }
    });

    // Extract audio data from response
    const audioPart = response.candidates?.[0]?.content?.parts?.[0];

    if (!audioPart || !audioPart.inlineData?.data) {
      console.error(
        "[TTS Flow] No audio in response:",
        JSON.stringify(response, null, 2),
      );
      throw new Error(
        "TTS model did not return audio. The text might be too long or contain unsupported characters.",
      );
    }

    // Convert PCM audio to WAV format
    const audioBuffer = Buffer.from(audioPart.inlineData.data, "base64");

    const wavBase64 = await new Promise<string>((resolve, reject) => {
      const writer = new wav.Writer({
        channels: 1,
        sampleRate: 24000,
        bitDepth: 16,
      });
      const bufs: any[] = [];
      writer.on("data", (chunk) => bufs.push(chunk));
      writer.on("end", () => resolve(Buffer.concat(bufs).toString("base64")));
      writer.on("error", reject);
      writer.end(audioBuffer);
    });

    return {
      audioDataUri: "data:audio/wav;base64," + wavBase64,
    };
  } catch (error) {
    console.error("[TTS Flow] TTS generation failed:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("403") &&
        (error.message.includes("API_KEY_SERVICE_BLOCKED") ||
          error.message.includes(
            "generativelanguage.googleapis.com are blocked",
          ))
      ) {
        throw new Error(
          `A API Generative Language não está habilitada no seu projeto do Google Cloud. Por favor, ative-a e tente novamente.`,
        );
      }
      if (error.message.includes("404 Not Found")) {
        throw new Error(
          `Falha na geração de áudio: O modelo de TTS especificado não foi encontrado. Verifique o nome do modelo.`,
        );
      }
      throw new Error(`Falha na geração de áudio: ${error.message}`);
    }
    throw new Error("Ocorreu um erro desconhecido durante a geração de áudio.");
  }
}
