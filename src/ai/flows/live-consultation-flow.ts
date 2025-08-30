
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

import { defineAction, type Action } from 'genkit';
import { z } from 'genkit';
import { GoogleGenerativeAI } from '@google/generative-ai';

// This is a workaround to define a Genkit action without the full flow wrapper,
// allowing us to manage the streaming connection manually.
export const liveConsultationFlow: Action<typeof liveConsultationSchema, void> = defineAction(
  {
    name: 'liveConsultationFlow',
    inputSchema: z.object({
      audioData: z.string().describe("A Base64 encoded string of the user's audio chunk."),
    }),
    outputSchema: z.void(),
    // We need to provide these callbacks to the action to stream data back to the client.
    // This is not a standard Genkit pattern but is necessary for this streaming simulation.
    metadata: {
        callbacks: ['onAudioChunk', 'onTranscriptUpdate']
    }
  },
  async (input, { onAudioChunk, onTranscriptUpdate }) => {
    
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set.");
    }
    if (!onAudioChunk || !onTranscriptUpdate) {
        throw new Error("Streaming callbacks are not provided.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: `You are MediAI, a friendly and empathetic AI medical assistant. 
        Your goal is to have a natural conversation with the patient, understand their symptoms, and provide helpful, safe, and preliminary guidance.
        Keep your responses concise and conversational. Your response must always be in Brazilian Portuguese.
        IMPORTANT: You are not a doctor. Do not provide a diagnosis or prescribe medication. Always advise the patient to consult with a human doctor.`,
    });

    try {
        const chat = model.startChat();

        const audioBuffer = Buffer.from(input.audioData, 'base64');
        
        // Send the user's audio to the Gemini API
        await chat.sendMessageStream([{
            inlineData: {
                data: audioBuffer.toString('base64'),
                mimeType: 'audio/webm',
            },
        }]);

        // This is a simplified approach. A full implementation would handle concurrent
        // user and model streaming. Here, we wait for the user's turn to finish,
        // then process the model's full response.
        const result = await chat.sendMessage("Ok, I've heard that. Now, what do you think?");

        // Process and stream the response back
        for await (const chunk of result.stream) {
            if (chunk.audio) {
                 // Send audio data back to the client
                onAudioChunk(Buffer.from(chunk.audio).toString('base64'));
            }
            if (chunk.text) {
                // Send transcript update back to the client
                onTranscriptUpdate({ source: 'model', text: chunk.text, isFinal: false });
            }
        }

        // Send a final transcript update
        const response = await result.response;
        const finalText = response.text();
        if (finalText) {
             onTranscriptUpdate({ source: 'model', text: finalText, isFinal: true });
        }

    } catch (error) {
        console.error("[Live Consultation Flow] Error during Gemini API call:", error);
        // We throw the error so the client-side can handle it.
        throw new Error("Failed to process the live consultation.");
    }
  }
);


const liveConsultationSchema = z.object({
  audioData: z.string(),
});
