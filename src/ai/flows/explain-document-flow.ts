'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { textToSpeech } from './text-to-speech';
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';

const ExplainDocumentInputSchema = z.object({
    patientId: z.string().optional(),
    documentType: z.enum(['receita', 'atestado', 'laudo', 'outro']),
    documentTitle: z.string().optional(),
    content: z.string().describe("O conteúdo do documento (instruções, medicamentos ou texto do laudo)."),
});

const ExplainDocumentOutputSchema = z.object({
    explanation: z.string().describe('Explicação simples e empática.'),
    audioDataUri: z.string().optional(),
});

const explainDocumentPrompt = ai.definePrompt({
    name: 'explainDocumentPrompt',
    input: { schema: ExplainDocumentInputSchema },
    output: { schema: z.object({ explanation: z.string() }) },
    prompt: `Você é um assistente médico de IA focado em humanizar a comunicação entre médicos e pacientes.
Sua tarefa é explicar um documento médico ({{documentType}}) de forma clara, simples e acolhedora.

O documento é um {{documentType}} {{#if documentTitle}}intitulado "{{documentTitle}}"{{/if}}.
Conteúdo original:
{{{content}}}

INSTRUÇÕES:
- Explique o propósito do documento em termos leigos.
- Se houver medicamentos, explique para que servem de forma simples (ex: "para desinflamar", "para tirar a dor").
- Use um tom encorajador e calmo.
- Não substitua as ordens do médico, apenas as explique melhor.
- Se for um atestado ou laudo, resuma os pontos principais.
- Responda sempre em Português Brasileiro.

Forneça a explicação detalhada abaixo:`,
});

export const explainDocumentFlow = ai.defineFlow(
    {
        name: 'explainDocumentFlow',
        inputSchema: ExplainDocumentInputSchema,
        outputSchema: ExplainDocumentOutputSchema,
    },
    async (input) => {
        const promptTokens = countTextTokens(input.content);

        const result = await explainDocumentPrompt(input);
        const explanation = result.output?.explanation;

        if (!explanation) throw new Error("Falha ao gerar explicação.");

        const outputTokens = countTextTokens(explanation);

        if (input.patientId) {
            await trackAIUsage({
                patientId: input.patientId,
                usageType: 'diagnosis', // Reusing diagnosis type for documents
                inputTokens: promptTokens + 500, // prompt base
                outputTokens,
                metadata: { flowName: 'explainDocumentFlow' },
            });
        }

        const audioResult = await textToSpeech({ text: explanation });

        return {
            explanation,
            audioDataUri: audioResult?.audioDataUri || "",
        };
    }
);
