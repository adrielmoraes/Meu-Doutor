'use server';
/**
 * @fileOverview A flow for handling real-time audio conversations using the Gemini API.
 * This flow now contains the full implementation for a live, bidirectional
 * conversation, receiving audio from the client and streaming audio back.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { textToSpeech } from './text-to-speech';
import { patientDataAccessTool } from '../tools/patient-data-access';
import { gemini15Pro } from '@genkit-ai/googleai';

// Schemas for the live consultation flow
const LiveConsultationInputSchema = z.object({
  audioData: z.string().describe("A Base64 encoded string of the user's audio chunk (webm format)."),
  patientId: z.string().describe("The ID of the patient for contextual data access."),
  // History is crucial for maintaining conversation context.
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).optional().describe('The conversation history.'),
});
export type LiveConsultationInput = z.infer<typeof LiveConsultationInputSchema>;

const LiveConsultationOutputSchema = z.object({
  audioOutput: z.string().optional().describe("Base64 encoded string of the AI's audio response."),
  transcript: z.string().optional().describe("The final transcript of the AI's response."),
});
export type LiveConsultationOutput = z.infer<typeof LiveConsultationOutputSchema>;

// The system prompt to guide the AI assistant.
const SYSTEM_PROMPT = `You are MediAI, a friendly and empathetic AI medical assistant. Your goal is to talk to the patient, understand their symptoms, and provide helpful, safe, and preliminary guidance.
IMPORTANT: You are not a doctor. You must not provide a diagnosis or prescribe medication. Always advise the patient to consult with a human doctor for a definitive diagnosis and treatment.
This is a real-time voice conversation. Keep your responses concise and natural.

When necessary, use the 'patientDataAccessTool' to access the patient's medical records for questions about their history, past diagnoses, or exam results.
Your response must always be in Brazilian Portuguese.`;

/**
 * The main flow for handling a live consultation.
 * It processes user audio, generates a text response (using tools if needed),
 * and synthesizes the response back to audio.
 */
export async function liveConsultationFlow(input: LiveConsultationInput): Promise<LiveConsultationOutput> {
  // Construct the data URI for the audio content.
  const audioURI = `data:audio/webm;base64,${input.audioData}`;

  // The user's message is the audio chunk.
  const userMessage = { role: 'user', content: [{ media: { url: audioURI, contentType: 'audio/webm' } }] };

  const messages = [
    { role: 'system', content: [{ text: SYSTEM_PROMPT }] },
    ...(input.history || []),
    userMessage
  ];

  // Step 1: Call the multimodal model (Gemini 1.5 Pro) with the audio.
  const initialResponse = await ai.generate({
    model: gemini15Pro, // Using the specified multimodal model
    messages: messages,
    tools: [patientDataAccessTool],
    toolRequest: 'auto'
  });

  const initialMessage = initialResponse.candidates?.[0]?.message;
  let textResponse = initialMessage?.text || '';
  const toolRequest = initialMessage?.toolRequest;

  // Step 2: If the model requests a tool, execute it and get a follow-up response.
  if (toolRequest) {
    console.log(`[Live Consultation] AI requested tool: ${toolRequest.name}`);
    const toolResult = await patientDataAccessTool(toolRequest.input);

    const toolFollowUpResponse = await ai.generate({
      model: gemini15Pro,
      messages: [
        ...messages,
        initialMessage, // Include the model's prior message with the tool request
        { role: 'tool', content: [{ toolResponse: { name: toolRequest.name, output: toolResult } }] }
      ],
      tools: [patientDataAccessTool],
    });

    const followUpText = toolFollowUpResponse.candidates?.[0]?.message.text || '';
    textResponse = (textResponse + ' ' + followUpText).trim();
  }

  // Step 3: Handle cases where no text response is generated.
  if (!textResponse) {
    console.error("[Live Consultation] AI did not return a text response.");
    const errorMessage = "Desculpe, tive um problema para processar sua solicitação. Poderia tentar de novo?";
    const audioError = await textToSpeech({ text: errorMessage });
    return {
      transcript: errorMessage,
      audioOutput: audioError.audioDataUri?.split('base64,')[1], // Return raw base64
    };
  }

  // Step 4: Convert the final text response to audio.
  const audioResult = await textToSpeech({ text: textResponse });
  const audioBase64 = audioResult.audioDataUri?.split('base64,')[1] || '';

  // Step 5: Return the final transcript and audio.
  return {
    transcript: textResponse,
    audioOutput: audioBase64,
  };
}
