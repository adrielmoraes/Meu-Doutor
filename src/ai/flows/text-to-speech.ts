
'use server';
/**
 * @fileOverview Converts text to speech using Genkit, prioritizing OpenRouter.
 *
 * - textToSpeech - A function that handles the text-to-speech conversion.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."
    ),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;


export async function textToSpeech(
  input: TextToSpeechInput
): Promise<TextToSpeechOutput | null> {
  return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: z.nullable(TextToSpeechOutputSchema),
  },
  async input => {
    // Google AI TTS (used as fallback or if OpenRouter is not configured)
    try {
      console.log("[TTS Flow] Using Google AI for TTS...");
      const {media} = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
        },
        prompt: input.text,
      });

      if (!media) {
          console.warn("Google AI TTS model did not return media.");
          return null;
      }
      
      const pcmBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      
      const writer = new wav.Writer({
          channels: 1,
          sampleRate: 24000,
          bitDepth: 16,
      });
      
      return new Promise((resolve, reject) => {
          const bufs: any[] = [];
          writer.on('data', (chunk) => bufs.push(chunk));
          writer.on('end', () => {
              const wavBase64 = Buffer.concat(bufs).toString('base64');
              resolve({
                  audioDataUri: 'data:audio/wav;base64,' + wavBase64,
              });
          });
          writer.on('error', reject);
          writer.end(pcmBuffer);
      });

    } catch (error) {
      console.error("[TTS Flow] Google AI TTS failed:", error);
      return null;
    }
  }
);
