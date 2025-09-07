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
import { gemini15Pro } from '@genkit-ai/googleai';

// Schemas for the live consultation flow
const LiveConsultationInputSchema = z.object({
  audioData: z.string().describe("A Base64 encoded string of the user's audio chunk (webm format)."),
  videoData: z.string().optional().describe("A Base64 encoded string of the user's video chunk (e.g., webm or mp4 format, or image frames)."),
  patientId: z.string().describe("The ID of the patient for contextual data access."),
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

When necessary, use the 'patientDataAccessTool' to access the patient's medical records for questions about their history, past diagnoses, or exam results.
Your response must always be in Brazilian Portuguese.`;

/**
 * The main flow for handling a live consultation.
 * It processes user audio (and optionally video), generates a text response (using tools if needed),
 * and synthesizes the response back to audio.
 */
export async function liveConsultationFlow(input: LiveConsultationInput): Promise<LiveConsultationOutput> {
  const mediaParts: any[] = [];

  if (input.audioData) {
    const audioURI = `data:audio/webm;base64,${input.audioData}`;
    mediaParts.push({ media: { url: audioURI, contentType: 'audio/webm' } });
  }

  if (input.videoData) {
    const videoURI = `data:video/webm;base64,${input.videoData}`;
    mediaParts.push({ media: { url: videoURI, contentType: 'video/webm' } });
  }

  const userMessage = { role: 'user' as const, content: mediaParts };

  const messages = [
    { role: 'system' as const, content: [{ text: SYSTEM_PROMPT }] },
    ...(input.history || []),
    userMessage
  ];

  const initialResponse = await ai.generate({
    model: gemini15Pro,
    messages: messages,
    tools: [patientDataAccessTool],
    toolRequest: 'auto'
  });

  // Extração direta do texto da resposta
  let textResponse = '';
  
  // Baseado no log, o texto está em initialResponse.message.content[0].text
  if (initialResponse.message?.content?.[0]?.text) {
    textResponse = initialResponse.message.content[0].text;
  } else if (Array.isArray(initialResponse.message?.content)) {
    // Fallback: concatena todos os textos do array
    textResponse = initialResponse.message.content
      .filter(item => item.text)
      .map(item => item.text)
      .join(' ');
  }
  
  console.log('[Live Consultation] Texto extraído:', textResponse);
  const toolRequest = initialResponse.message?.toolRequest;
  
  let toolFollowUpResponse: any = null;

  if (toolRequest) {
    console.log(`[Live Consultation] AI requested tool: ${toolRequest.name}`);
    const toolResult = await patientDataAccessTool(toolRequest.input);

    const toolMessages = [
      ...messages,
      initialResponse.message, // Adiciona a resposta do modelo que pediu a ferramenta
      { role: 'tool' as const, content: [{ toolResponse: { name: toolRequest.name, output: toolResult } }] }
    ];

    toolFollowUpResponse = await ai.generate({
      model: gemini15Pro,
      messages: toolMessages,
      tools: [patientDataAccessTool],
    });

    // DEBUG COMPLETO: Inspeciona resposta de follow-up
    console.log('[Live Consultation] Resposta RAW do follow-up:', JSON.stringify(toolFollowUpResponse, null, 2));
    
    let toolFollowUpText = '';
    
    console.log('[Live Consultation] Verificando caminhos de extração do follow-up:');
    console.log('[Live Consultation] toolFollowUpResponse.message:', toolFollowUpResponse.message);
    console.log('[Live Consultation] toolFollowUpResponse.message?.content:', toolFollowUpResponse.message?.content);
    console.log('[Live Consultation] toolFollowUpResponse.message?.content?.[0]:', toolFollowUpResponse.message?.content?.[0]);
    console.log('[Live Consultation] toolFollowUpResponse.custom?.candidates:', toolFollowUpResponse.custom?.candidates);
    
    if (toolFollowUpResponse.message?.content?.[0]?.text) {
      toolFollowUpText = toolFollowUpResponse.message.content[0].text;
      console.log('[Live Consultation] Texto extraído de follow-up.message.content[0].text:', toolFollowUpText);
    }
    else if (toolFollowUpResponse.custom?.candidates?.[0]?.content?.parts?.[0]?.text) {
      toolFollowUpText = toolFollowUpResponse.custom.candidates[0].content.parts[0].text;
      console.log('[Live Consultation] Texto extraído de follow-up.custom.candidates:', toolFollowUpText);
    }
    else if (Array.isArray(toolFollowUpResponse.message?.content)) {
      const texts = toolFollowUpResponse.message.content
        .filter(item => item.text)
        .map(item => item.text);
      toolFollowUpText = texts.join(' ');
      console.log('[Live Consultation] Texto concatenado do array de follow-up:', toolFollowUpText);
    }
    
    textResponse = toolFollowUpText;
    console.log('[Live Consultation] Texto final de follow-up extraído:', textResponse);
  }

  if (!textResponse || textResponse.trim() === '') {
    if (toolFollowUpResponse) {
      console.error("[Live Consultation] AI did not return a text response AFTER a tool call. Raw tool follow-up response:", JSON.stringify(toolFollowUpResponse, null, 2));
    } else {
      console.error("[Live Consultation] AI did not return a text response on initial call. Raw initial response:", JSON.stringify(initialResponse, null, 2));
    }
    
    const errorMessage = "Desculpe, tive um problema para processar sua solicitação. Poderia tentar de novo?";
    const audioError = await textToSpeech({ text: errorMessage });
    return {
      transcript: errorMessage,
      audioOutput: audioError?.audioDataUri?.split('base64,')[1] || '',
    };
  }

  console.log("[Live Consultation] AI response received:", textResponse.substring(0, 100) + (textResponse.length > 100 ? '...' : ''));

  let audioBase64 = '';
  try {
    console.log("[Live Consultation] Converting text to speech, length:", textResponse.length);
    const audioResult = await textToSpeech({ text: textResponse });
    audioBase64 = audioResult?.audioDataUri?.split('base64,')[1] || '';
    if (!audioBase64) {
      console.warn("[Live Consultation] Audio conversion returned empty result - continuing with text only");
    } else {
      console.log("[Live Consultation] Audio conversion successful, audio length:", audioBase64.length);
    }
  } catch (error) {
    console.error("[Live Consultation] Error converting text to speech:", error);
    console.warn("[Live Consultation] Continuing with text response only (no audio)");
  }

  return {
    transcript: textResponse,
    audioOutput: audioBase64,
  };
}