
'use server';
/**
 * @fileOverview A flow for handling real-time audio conversations using the Gemini API.
 * This flow acts as a server-side proxy to manage a live, bidirectional
 * conversation, receiving audio from the client and streaming audio back.
 *
 * NOTE: This is an advanced implementation simulating a real-time stream over HTTP.
 * In a production environment, WebSockets would typically be preferred for this task.
 * The Genkit framework does not currently have a native `multimodal-live` wrapper,
 * so we are using the underlying Google AI Node.js SDK directly.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    return liveConsultationFlowInternal(input);
}


const liveConsultationFlowInternal = ai.defineFlow(
  {
    name: 'liveConsultationFlow',
    inputSchema: LiveConsultationInputSchema,
    outputSchema: LiveConsultationOutputSchema,
  },
  async (input) => {
    
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set.");
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro-latest', // Correct model for multimodal capabilities
        systemInstruction: `You are MediAI, a friendly and empathetic AI medical assistant. 
        Your goal is to have a natural conversation with the patient, understand their symptoms, and provide helpful, safe, and preliminary guidance.
        Keep your responses concise and conversational. Your response must always be in Brazilian Portuguese.
        IMPORTANT: You are not a doctor. Do not provide a diagnosis or prescribe medication. Always advise the patient to consult with a human doctor.`,
    });

    try {
        const chat = model.startChat();
        
        const result = await chat.sendMessageStream([
            {
                inlineData: {
                    data: input.audioData,
                    mimeType: 'audio/webm',
                },
            },
            { text: "Transcreva o áudio e responda à pergunta de forma concisa." }
        ]);

        let transcript = "";
        for await (const chunk of result.stream) {
          if (chunk.text) {
            transcript += chunk.text();
          }
        }
        
        // Note: Audio output in this streaming context with the Node.js SDK is complex
        // and often not supported directly. We will focus on returning the transcript.
        // The `audioOutput` field is kept for future compatibility but will be empty for now.
        return {
            transcript
        };

    } catch (error) {
        console.error("[Live Consultation Flow] Error during Gemini API call:", error);
        throw new Error("Failed to process the live consultation.");
    }
  }
);

