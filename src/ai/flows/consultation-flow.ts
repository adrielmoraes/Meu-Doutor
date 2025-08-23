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
  const model = ai.model('googleai/gemini-2.0-flash');

  // Build the prompt dynamically
  const promptParts = [
    'You are MediAI, a friendly and empathetic AI medical assistant. Your goal is to talk to the patient, understand their symptoms, and provide helpful, safe, and preliminary guidance.',
    'IMPORTANT: You are not a doctor. You must not provide a diagnosis or prescribe medication. Always advise the patient to consult with a human doctor for a definitive diagnosis and treatment.',
    "Use the 'patientDataAccessTool' to access the patient's medical records when they ask questions about their history, past diagnoses, or exam results. You must use the tool to get the most up-to-date information. Do not invent information.",
    'Keep your responses concise and easy to understand. Start the conversation by introducing yourself and asking how you can help, unless a conversation is already in progress.',
  ];

  if (input.history.length > 0) {
    promptParts.push(`\nHere is the conversation so far (history):`);
    input.history.forEach(msg => {
      promptParts.push(`${msg.role}: ${msg.content}`);
    });
  }

  promptParts.push(`\nNew user input:`);
  promptParts.push(`user: ${input.userInput}`);
  promptParts.push(`model: `);

  const prompt = promptParts.join('\n');


  const {output} = await ai.generate({
      prompt: prompt,
      model: model,
      tools: [patientDataAccessTool],
      toolRequest: {
          // Force the tool to be called with the patientId from the input
          // This is a powerful pattern to provide context to tools without user input.
          patientDataAccessTool: { patientId: input.patientId }
      },
      output: {
          schema: ConsultationOutputSchema,
      }
  });

  return output!;
}
