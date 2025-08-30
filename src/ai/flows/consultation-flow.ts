
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
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';

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
  response: z.string().describe('The AI assistant text response.'),
  audioDataUri: z.string().optional().describe('The AI assistant audio response as a data URI.'),
});
export type ConsultationOutput = z.infer<typeof ConsultationOutputSchema>;


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function consultationFlow(input: ConsultationInput): Promise<ConsultationOutput> {

  const systemInstruction = `You are MediAI, a friendly and empathetic AI medical assistant. Your goal is to talk to the patient, understand their symptoms, and provide helpful, safe, and preliminary guidance.
IMPORTANT: You are not a doctor. You must not provide a diagnosis or prescribe medication. Always advise the patient to consult with a human doctor for a definitive diagnosis and treatment.

This is the most important instruction: You MUST use the 'patientDataAccessTool' to access the patient's medical records when they ask questions about their history, past diagnoses, or exam results. You must use the tool to get the most up-to-date information. Do not invent information.

Keep your responses concise, direct, and easy to understand to facilitate a real-time conversation. Start the conversation by introducing yourself and asking how you can help, unless a conversation is already in progress.
Your response must always be in Brazilian Portuguese.`;

  // We are calling the model directly to get both text and audio in one go.
  // This is more efficient than calling a text model then a separate TTS model.
  const { output } = await ai.generate({
      system: systemInstruction,
      prompt: input.userInput,
      history: input.history,
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      tools: [patientDataAccessTool],
      toolRequest: {
          patientDataAccessTool: { patientId: input.patientId }
      },
      config: {
        responseModalities: ['TEXT', 'AUDIO'], // Request both text and audio
        speechConfig: {
          voiceConfig: {
              prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
  });
  
  if (!output) {
    throw new Error("AI did not return an output.");
  }
  
  const textResponse = output.candidates[0].message.text;
  const audioResponse = output.candidates[0].message.audio;

  if (!textResponse) {
    throw new Error("AI did not return a text response.");
  }

  let audioDataUri: string | undefined = undefined;
  if (audioResponse) {
      const audioBuffer = Buffer.from(
        audioResponse.url.substring(audioResponse.url.indexOf(',') + 1),
        'base64'
      );
      const wavBase64 = await toWav(audioBuffer);
      audioDataUri = `data:audio/wav;base64,${wavBase64}`;
  }

  return {
    response: textResponse,
    audioDataUri: audioDataUri,
  };
}
