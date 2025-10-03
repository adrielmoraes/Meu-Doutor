
'use server';
/**
 * @fileOverview A flow for handling real-time audio and video conversations using the Gemini API.
 * This flow now contains the full implementation for a live, bidirectional
 * conversation, receiving audio/video from the client and streaming audio back.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { textToSpeech } from './text-to-speech';
import { patientDataAccessTool } from '../tools/patient-data-access';
import { consultationHistoryAccessTool } from '../tools/consultation-history-access';
import { gemini15Pro } from '@genkit-ai/googleai';

// Schemas for the live consultation flow
const LiveConsultationInputSchema = z.object({
  audioData: z.string().describe("A Base64 encoded string of the user's audio chunk (webm format)."),
  videoData: z.string().optional().describe("A Base64 encoded string of the user's video chunk (e.g., webm or mp4 format, or image frames)."),
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
This is a real-time voice and potentially video conversation. Keep your responses concise and natural.
You can also perceive visual information from the patient if it's provided.

When necessary, use these tools:
- 'patientDataAccessTool': To access the patient's medical records, exam results, and current health status.
- 'consultationHistoryAccessTool': To access previous consultation summaries and transcriptions. This is especially useful to understand the patient's medical journey, previous diagnoses, and ongoing treatments.

Your response must always be in Brazilian Portuguese.`;

/**
 * The main flow for handling a live consultation.
 * It processes user audio (and optionally video), generates a text response (using tools if needed),
 * and synthesizes the response back to audio.
 */
export async function liveConsultationFlow(input: LiveConsultationInput): Promise<LiveConsultationOutput> {
  const mediaParts: any[] = [];

  // Construct the data URI for the audio content.
  if (input.audioData) {
    const audioURI = `data:audio/webm;base64,${input.audioData}`;
    mediaParts.push({ media: { url: audioURI, contentType: 'audio/webm' } });
  }

  // Construct the data URI for the video content, if provided.
  // NOTE: The client-side implementation will need to determine the correct contentType
  // and encoding for video frames/chunks. For simplicity, we assume webm here.
  if (input.videoData) {
    const videoURI = `data:video/webm;base64,${input.videoData}`; // Or image/jpeg for image frames
    mediaParts.push({ media: { url: videoURI, contentType: 'video/webm' } }); // Adjust contentType as needed
  }

  // The user's message is the audio/video chunk.
  const userMessage = { role: 'user', content: mediaParts };

  const messages = [
    { role: 'system', content: [{ text: SYSTEM_PROMPT }] },
    ...(input.history || []),
    userMessage
  ];

  // Step 1: Call the multimodal model (Gemini 1.5 Pro) with the audio and video.
  const initialResponse = await ai.generate({
    model: gemini15Pro, // Using the specified multimodal model
    messages: messages,
    tools: [patientDataAccessTool, consultationHistoryAccessTool],
    toolRequest: 'auto'
  });

  const initialMessage = initialResponse.message;
  let textResponse = initialResponse.text || '';
  const toolRequest = initialMessage?.toolRequest;

  // Step 2: If the model requests a tool, execute it and get a follow-up response.
  if (toolRequest) {
    console.log(`[Live Consultation] AI requested tool: ${toolRequest.name}`);
    const toolResult = toolRequest.name === 'consultationHistoryAccessTool' 
      ? await consultationHistoryAccessTool(toolRequest.input)
      : await patientDataAccessTool(toolRequest.input);

    const toolFollowUpResponse = await ai.generate({
      model: gemini15Pro,
      messages: [
        ...messages,
        initialMessage, // Include the model's prior message with the tool request
        { role: 'tool', content: [{ toolResponse: { name: toolRequest.name, output: toolResult } }] }
      ],
      tools: [patientDataAccessTool, consultationHistoryAccessTool],
    });

    const followUpText = toolFollowUpResponse.text || '';
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
