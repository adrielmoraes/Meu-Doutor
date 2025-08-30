
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


const consultationPrompt = ai.definePrompt({
    name: 'consultationPrompt',
    system: `You are MediAI, a friendly and empathetic AI medical assistant. Your goal is to talk to the patient, understand their symptoms, and provide helpful, safe, and preliminary guidance.
IMPORTANT: You are not a doctor. You must not provide a diagnosis or prescribe medication. Always advise the patient to consult with a human doctor for a definitive diagnosis and treatment.

This is the most important instruction: You MUST use the 'patientDataAccessTool' to access the patient's medical records when they ask questions about their history, past diagnoses, or exam results. You must use the tool to get the most up-to-date information. Do not invent information.

Keep your responses concise, direct, and easy to understand to facilitate a real-time conversation. Start the conversation by introducing yourself and asking how you can help, unless a conversation is already in progress.
Your response must always be in Brazilian Portuguese.`,
    tools: [patientDataAccessTool],
});


export async function consultationFlow(input: ConsultationInput): Promise<ConsultationOutput> {
  
  // Step 1: Generate the text response using a model that supports tools.
  const { output } = await ai.generate({
      prompt: consultationPrompt,
      history: input.history,
      toolRequest: {
          patientDataAccessTool: { patientId: input.patientId }
      },
  });

  const textResponse = output?.candidates[0].message.text;

  if (!textResponse) {
    throw new Error("AI did not return a text response.");
  }
  
  // Step 2: Generate the audio from the text response.
  const audioResult = await textToSpeech({ text: textResponse });

  // Make the flow resilient. If audio fails, we can still return the text.
  const audioDataUri = audioResult?.audioDataUri || "";

  return {
    response: textResponse,
    audioDataUri: audioDataUri,
  };
}
