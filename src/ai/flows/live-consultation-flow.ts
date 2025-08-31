
'use server';
/**
 * @fileOverview A flow for handling real-time audio conversations using the Gemini API.
 * This flow acts as a server-side proxy to manage a live, bidirectional
 * conversation, receiving audio from the client and streaming audio back.
 *
 * NOTE: This is an advanced implementation simulating a real-time stream over HTTP.
 * This has been temporarily disabled as it relies on a direct connection to the Google API,
 * which conflicts with the goal of using OpenRouter for all AI interactions.
 * In a production environment, WebSockets would typically be preferred for this task.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LiveConsultationInputSchema = z.object({
  audioData: z.string().describe("A Base64 encoded string of the user's audio chunk."),
});
export type LiveConsultationInput = z.infer<typeof LiveConsultationInputSchema>;


const LiveConsultationOutputSchema = z.object({
    audioOutput: z.string().optional().describe("Base64 encoded string of the AI's audio response."),
    transcript: z.string().optional().describe("The final transcript of the AI's response."),
});
export type LiveConsultationOutput = z.infer<typeof LiveConsultationOutputSchema>;


export async function liveConsultationFlow(input: LiveConsultationInput): Promise<LiveConsultationOutput> {
    console.warn("Live consultation flow is temporarily disabled.");
    return {
        transcript: "Desculpe, a funcionalidade de consulta ao vivo está temporariamente desativada."
    }
}
