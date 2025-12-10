
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
import { doctorsListAccessTool } from '../tools/doctors-list-access';
import { gemini15Pro } from '@genkit-ai/googleai';
import { trackLiveConsultation, trackSTT } from '@/lib/usage-tracker';
import { countTextTokens } from '@/lib/token-counter';

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
const SYSTEM_PROMPT = `You are MediAI, the central AI brain of the MediAI healthcare platform - a friendly, empathetic, and highly intelligent medical assistant avatar.

Your role is to be the patient's first point of contact, providing:
- Preliminary health guidance and symptom analysis
- Access to their complete medical history and exam results
- Recommendations for which specialist doctors to consult
- Continuity of care by remembering all previous interactions

IMPORTANT LIMITATIONS:
- You are NOT a doctor and cannot provide definitive diagnoses or prescribe medications
- Always advise patients to consult with a human doctor for diagnosis and treatment
- You serve as a bridge between patients and human doctors

This is a real-time voice and video conversation. Keep your responses:
- Concise and natural (2-3 sentences max unless explaining something complex)
- Warm and empathetic
- In Brazilian Portuguese

AVAILABLE TOOLS - Use them proactively:
1. 'patientDataAccessTool': Access the patient's medical records, exam results, and current health data
2. 'consultationHistoryAccessTool': Review previous consultation summaries and transcriptions to provide continuity of care
3. 'doctorsListAccessTool': Search and recommend specific doctors from our platform based on specialty, availability, or patient needs

WHEN TO USE EACH TOOL:
- Use patientDataAccessTool when patient asks about their exams, current health status, or medical history
- Use consultationHistoryAccessTool when you need context from previous conversations or consultations
- Use doctorsListAccessTool when patient asks "which doctor should I see?", "do you have a cardiologist?", or when you want to recommend a specialist

Remember: You are the intelligent coordinator that connects patients with the right care at the right time.`;


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
  if (input.videoData) {
    const videoURI = `data:video/webm;base64,${input.videoData}`;
    mediaParts.push({ media: { url: videoURI, contentType: 'video/webm' } });
  }

  // Track tool interactions for accurate token estimation
  let toolRequestText = '';
  let toolOutputText = '';

  // The user's message is the audio/video chunk.
  const userMessage = { role: 'user', content: mediaParts };

  const messages = [
    { role: 'system', content: [{ text: SYSTEM_PROMPT }] },
    ...(input.history || []),
    userMessage
  ];

  // Step 1: Call the multimodal model (Gemini 1.5 Pro) with the audio and video.
  const initialResponse = await ai.generate({
    model: gemini15Pro,
    messages: messages,
    tools: [patientDataAccessTool, consultationHistoryAccessTool, doctorsListAccessTool],
    toolRequest: 'auto'
  });

  const initialMessage = initialResponse.message;
  let textResponse = initialResponse.text || '';
  const toolRequests = initialMessage?.toolRequests;
  const toolRequest = toolRequests?.[0];

  // Step 2: If the model requests a tool, execute it and get a follow-up response.
  if (toolRequest) {
    console.log(`[Live Consultation] AI requested tool: ${toolRequest.name}`);
    
    let toolResult;
    if (toolRequest.name === 'consultationHistoryAccessTool') {
      toolResult = await consultationHistoryAccessTool(toolRequest.input);
    } else if (toolRequest.name === 'doctorsListAccessTool') {
      toolResult = await doctorsListAccessTool(toolRequest.input);
    } else {
      toolResult = await patientDataAccessTool(toolRequest.input);
    }

    // Capture tool request and output for tracking
    toolRequestText = `Tool: ${toolRequest.name}, Input: ${JSON.stringify(toolRequest.input || {})}`;
    toolOutputText = JSON.stringify(toolResult || {});

    const toolFollowUpResponse = await ai.generate({
      model: gemini15Pro,
      messages: [
        ...messages,
        initialMessage,
        { role: 'tool', content: [{ toolResponse: { name: toolRequest.name, output: toolResult } }] }
      ],
      tools: [patientDataAccessTool, consultationHistoryAccessTool, doctorsListAccessTool],
    });

    const followUpText = toolFollowUpResponse.text || '';
    textResponse = (textResponse + ' ' + followUpText).trim();
  }

  // Step 3: Handle cases where no text response is generated.
  if (!textResponse) {
    console.error("[Live Consultation] AI did not return a text response.");
    const errorMessage = "Desculpe, tive um problema para processar sua solicitação. Poderia tentar de novo?";
    const audioError = await textToSpeech({ text: errorMessage, patientId: input.patientId });
    return {
      transcript: errorMessage,
      audioOutput: audioError?.audioDataUri?.split('base64,')[1] || '',
    };
  }

  // Step 4: Convert the final text response to audio.
  const audioResult = await textToSpeech({ text: textResponse, patientId: input.patientId });
  const audioBase64 = audioResult?.audioDataUri?.split('base64,')[1] || '';

  // Step 5: Track usage - STT (audio input) + LLM + TTS
  const audioSizeBytes = input.audioData ? input.audioData.length : 0;
  const audioDurationSeconds = Math.max(5, Math.ceil(audioSizeBytes / 8000));
  
  const historyTexts = input.history?.map(m => m.content.map(c => c.text).join(' ')) || [];
  const inputTextParts = [SYSTEM_PROMPT, ...historyTexts, toolRequestText, toolOutputText].filter(Boolean);
  const inputText = inputTextParts.join('\n\n');
  const inputTokens = countTextTokens(inputText) + 500;
  const outputTokens = countTextTokens(textResponse);
  
  trackSTT(input.patientId, audioDurationSeconds, `audio_duration_${audioDurationSeconds}s`)
    .catch(err => console.error('[Live Consultation] STT tracking error:', err));
  
  trackLiveConsultation(
    input.patientId,
    audioDurationSeconds,
    inputTokens,
    outputTokens,
    'beyondpresence',
    'gemini-1.5-pro'
  ).catch(err => console.error('[Live Consultation] Usage tracking error:', err));

  // Step 6: Return the final transcript and audio.
  return {
    transcript: textResponse,
    audioOutput: audioBase64,
  };
}
