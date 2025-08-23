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

const RoleSchema = z.enum(['user', 'model']);

const MessageSchema = z.object({
  role: RoleSchema,
  content: z.string(),
});

const ConsultationInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  userInput: z.string().describe('The latest input from the user.'),
  patientContext: z.string().optional().describe("A summary of the patient's medical history, recent exams, and validated diagnoses."),
});
export type ConsultationInput = z.infer<typeof ConsultationInputSchema>;

const ConsultationOutputSchema = z.object({
  response: z.string().describe('The AI assistant response.'),
});
export type ConsultationOutput = z.infer<typeof ConsultationOutputSchema>;


export async function consultationFlow(input: ConsultationInput): Promise<ConsultationOutput> {
    const prompt = `You are MediAI, a friendly and empathetic AI medical assistant. Your goal is to talk to the patient, understand their symptoms, and provide helpful, safe, and preliminary guidance.

    IMPORTANT: You are not a doctor. You must not provide a diagnosis or prescribe medication. Always advise the patient to consult with a human doctor for a definitive diagnosis and treatment.
    
    Use the provided patient context to answer their questions about their health history, exam results, or validated diagnoses. Be clear, empathetic, and explain things in simple terms.

    Keep your responses concise and easy to understand. Start the conversation by introducing yourself and asking how you can help, unless a conversation is already in progress.
    
    PATIENT CONTEXT:
    ---
    ${input.patientContext || "No additional context provided."}
    ---

    Here is the conversation so far (history):
    ${input.history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

    New user input:
    user: ${input.userInput}
    model: `;

    const {output} = await ai.generate({
        prompt: prompt,
        output: {
            schema: ConsultationOutputSchema,
        }
    });

    return output!;
}
