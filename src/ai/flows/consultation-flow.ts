
'use server';

/**
 * @fileOverview An AI agent for handling a patient consultation.
 *
 * - consultationFlow - A function that handles the conversation during a consultation.
 * - ConsultationInput - The input type for the consultationFlow function.
 * - ConsultationOutput - The return type for the consultationFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { patientDataAccessTool } from '../tools/patient-data-access';

const RoleSchema = z.enum(['user', 'model']);

const MessageSchema = z.object({
  role: RoleSchema,
  content: z.string(),
});

const ConsultationInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient.'),
  history: z.array(MessageSchema).describe('The conversation history.'),
  userInput: z.string().describe('The latest input from the user.'),
});
export type ConsultationInput = z.infer<typeof ConsultationInputSchema>;

const ConsultationOutputSchema = z.object({
  response: z.string().describe('The AI assistant response.'),
});
export type ConsultationOutput = z.infer<typeof ConsultationOutputSchema>;


export async function consultationFlow(input: ConsultationInput): Promise<ConsultationOutput> {
  const {output} = await ai.generate({
      system: `You are MediAI, a friendly and empathetic AI medical assistant. Your goal is to talk to the patient, understand their symptoms, and provide helpful, safe, and preliminary guidance.
IMPORTANT: You are not a doctor. You must not provide a diagnosis or prescribe medication. Always advise the patient to consult with a human doctor for a definitive diagnosis and treatment.

This is the most important instruction: You MUST use the 'patientDataAccessTool' to access the patient's medical records when they ask questions about their history, past diagnoses, or exam results. You must use the tool to get the most up-to-date information. Do not invent information.

Keep your responses concise, direct, and easy to understand to facilitate a real-time conversation. Start the conversation by introducing yourself and asking how you can help, unless a conversation is already in progress.
Your response must always be in Brazilian Portuguese.`,
      prompt: input.userInput,
      history: input.history,
      model: 'googleai/gemini-2.0-flash',
      tools: [patientDataAccessTool],
      toolRequest: {
          // This is a powerful pattern to provide context to tools without user input.
          // We are forcing the patientId to be available to the tool whenever it's called.
          // This means the AI doesn't need to ask "What is your ID?", it already knows.
          patientDataAccessTool: { patientId: input.patientId }
      },
      output: {
          schema: ConsultationOutputSchema,
      }
  });

  return output!;
}
