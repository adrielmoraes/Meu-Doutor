
'use server';

/**
 * @fileOverview An AI agent for handling a patient consultation with integrated text-to-speech.
 *
 * - consultationFlow - A function that handles the conversation during a consultation.
 * - ConsultationInput - The input type for the consultationFlow function.
 * - ConsultationOutput - The return type for the consultationFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { patientDataAccessTool } from '../tools/patient-data-access';
import { consultationHistoryAccessTool } from '../tools/consultation-history-access';
import { doctorsListAccessTool } from '../tools/doctors-list-access';
import { textToSpeech } from './text-to-speech';


const RoleSchema = z.enum(['user', 'model']);

const MessageSchema = z.object({
  role: RoleSchema,
  content: z.array(z.object({ text: z.string() })),
});

const ConsultationInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient.'),
  history: z.array(MessageSchema).describe('The conversation history.'),
});
export type ConsultationInput = z.infer<typeof ConsultationInputSchema>;

const ConsultationOutputSchema = z.object({
  response: z.string().describe('The AI assistant text response.'),
  audioDataUri: z.string().optional().describe('The AI assistant audio response as a data URI.'),
});
export type ConsultationOutput = z.infer<typeof ConsultationOutputSchema>;


const SYSTEM_PROMPT = `You are MediAI, the central AI brain of the MediAI healthcare platform - a friendly, empathetic, and highly intelligent medical assistant.

Your role is to be the patient's first point of contact, providing:
- Preliminary health guidance and symptom analysis
- Access to their complete medical history and exam results
- Recommendations for which specialist doctors to consult
- Continuity of care by remembering all previous interactions

IMPORTANT LIMITATIONS:
- You are NOT a doctor and cannot provide definitive diagnoses or prescribe medications
- Always advise patients to consult with a human doctor for diagnosis and treatment
- You serve as a bridge between patients and human doctors

AVAILABLE TOOLS - Use them proactively:
1. 'patientDataAccessTool': Access the patient's medical records, exam results, and current health data
2. 'consultationHistoryAccessTool': Review previous consultation summaries and transcriptions
3. 'doctorsListAccessTool': Search and recommend specific doctors from our platform based on specialty or patient needs

Keep your responses concise, direct, and easy to understand. Start conversations by introducing yourself warmly.
Your response must always be in Brazilian Portuguese.`;


export async function consultationFlow(input: ConsultationInput): Promise<ConsultationOutput> {
  
    const messages = [
        { role: 'system', content: [{ text: SYSTEM_PROMPT }] },
        ...input.history
    ];

    console.log('[Consultation Flow] Messages sent to AI:', JSON.stringify(messages, null, 2));

    // Step 1: Make the initial call to the model to see if it wants to use a tool or respond directly.
    const initialResponse = await ai.generate({
        messages,
        tools: [patientDataAccessTool, consultationHistoryAccessTool, doctorsListAccessTool],
        toolRequest: 'auto'
    });
    
    console.log('[Consultation Flow] Initial AI response:', JSON.stringify(initialResponse, null, 2));

    const initialMessage = initialResponse.message;
    // Correctly extract the text from the initial response using the modern Genkit 1.x syntax
    let textResponse = initialResponse.text || '';
    const toolRequests = initialMessage?.toolRequests;
    const toolRequest = toolRequests?.[0];

    // Step 2: If the model wants to use a tool, execute it and get a follow-up response.
    if (toolRequest) {
        console.log(`[Consultation Flow] AI requested tool: ${toolRequest.name} with input:`, JSON.stringify(toolRequest.input, null, 2));
        
        let toolResult;
        if (toolRequest.name === 'consultationHistoryAccessTool') {
            toolResult = await consultationHistoryAccessTool(toolRequest.input);
        } else if (toolRequest.name === 'doctorsListAccessTool') {
            toolResult = await doctorsListAccessTool(toolRequest.input);
        } else {
            toolResult = await patientDataAccessTool(toolRequest.input);
        }
        
        console.log(`[Consultation Flow] Tool ${toolRequest.name} result:`, JSON.stringify(toolResult, null, 2));

        // Send the tool's result back to the model.
        const toolFollowUpResponse = await ai.generate({
            messages: [
                ...messages,
                initialMessage, // Corrected: Use the full initialMessage here
                { role: 'tool', content: [{ toolResponse: { name: toolRequest.name, output: toolResult } }] }
            ],
            tools: [patientDataAccessTool, consultationHistoryAccessTool, doctorsListAccessTool], // Still provide tools in case it needs another one.
            toolRequest: 'auto'
        });
        
        console.log('[Consultation Flow] Tool follow-up AI response:', JSON.stringify(toolFollowUpResponse, null, 2));

        // Correctly extract the text from the follow-up response
        const followUpText = toolFollowUpResponse.text || '';
        
        // Append the follow-up text to any initial text we might have received.
        textResponse = (textResponse + ' ' + followUpText).trim();
    }

  if (!textResponse) {
    console.error("[Consultation Flow] AI did not return a text response. Final textResponse was empty.");
    const errorMessage = "Desculpe, tive um problema para processar sua solicitação. Poderia tentar de novo?";
    const audioError = await textToSpeech({ text: errorMessage });
    return {
      response: errorMessage,
      audioDataUri: audioError?.audioDataUri || '', 
    };
  }
  
  // Step 3: Generate the audio from the final text response.
  const audioResult = await textToSpeech({ text: textResponse });

  // Make the flow resilient. If audio fails, we can still return the text.
  const audioDataUri = audioResult?.audioDataUri || "";

  return {
    response: textResponse,
    audioDataUri: audioDataUri,
  };
}
