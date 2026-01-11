'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';

const GenerateDocumentDraftInputSchema = z.object({
    patientId: z.string(),
    documentType: z.enum(['receita', 'atestado', 'laudo', 'outro']),
    patientContext: z.object({
        name: z.string(),
        age: z.number(),
        gender: z.string(),
        reportedSymptoms: z.string().optional(),
        examResults: z.string().optional(),
        recentConsultations: z.string().optional(),
    }),
});

const GenerateDocumentDraftOutputSchema = z.object({
    title: z.string().optional(),
    medications: z.array(z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        instructions: z.string(),
    })).optional(),
    instructions: z.string().describe("Texto principal do documento (corpo do atestado, laudo ou orientações da receita)."),
});

const generateDocumentDraftPrompt = ai.definePrompt({
    name: 'generateDocumentDraftPrompt',
    input: { schema: GenerateDocumentDraftInputSchema },
    output: { schema: GenerateDocumentDraftOutputSchema },
    prompt: `Você é um assistente médico especializado em redigir documentos clínicos. 
Sua tarefa é gerar um rascunho de {{documentType}} para o paciente {{patientContext.name}} ({{patientContext.age}} anos, {{patientContext.gender}}).

CONTEXTO DO PACIENTE:
- SINTOMAS: {{patientContext.reportedSymptoms}}
- EXAMES: {{patientContext.examResults}}
- CONSULTAS RECENTES: {{patientContext.recentConsultations}}

INSTRUÇÕES PARA O DOCUMENTO:
1. Se for RECEITA: Liste os medicamentos ideais baseados nos sintomas/exames. Inclua nome, dosagem, frequência e duração. No campo 'instructions', dê orientações de estilo de vida.
2. Se for ATESTADO: Escreva um texto formal recomendando afastamento (se necessário) ou confirmando comparecimento, baseando-se no contexto.
3. Se for LAUDO: Faça uma análise técnica simplificada dos achados mencionados no contexto.
4. Se for OUTRO: Gere um texto profissional genérico adequado ao contexto.

REGRAS CRÍTICAS:
- Use terminologia médica correta, mas clara.
- Seja conciso e profissional.
- Responda em Português Brasileiro.
- Isso é APENAS UM RASCUNHO que será revisado por um médico humano.

Gere o rascunho estruturado no formato JSON definido:`,
});

export const generateDocumentDraftFlow = ai.defineFlow(
    {
        name: 'generateDocumentDraftFlow',
        inputSchema: GenerateDocumentDraftInputSchema,
        outputSchema: GenerateDocumentDraftOutputSchema,
    },
    async (input) => {
        const inputTokens = countTextTokens(JSON.stringify(input.patientContext));

        const result = await generateDocumentDraftPrompt(input);
        const draft = result.output;

        if (!draft) throw new Error("Falha ao gerar rascunho do documento.");

        const outputTokens = countTextTokens(JSON.stringify(draft));

        await trackAIUsage({
            patientId: input.patientId,
            usageType: 'llm',
            inputTokens: inputTokens + 1000, // prompt base
            outputTokens,
            metadata: { flowName: 'generateDocumentDraftFlow', documentType: input.documentType },
        });

        return draft;
    }
);
