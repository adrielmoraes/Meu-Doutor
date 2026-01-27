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

INSTRUÇÕES OBRIGATÓRIAS PARA O DOCUMENTO:

## RECEITA (documentType = "receita"):
É OBRIGATÓRIO preencher TODOS os campos abaixo:
- **title**: Título descritivo (ex: "Receita para Tratamento de Hipertensão")
- **medications**: Lista de medicamentos com TODOS os campos preenchidos:
  - name: Nome comercial ou genérico do medicamento (ex: "Losartana 50mg")
  - dosage: Dosagem por administração (ex: "1 comprimido", "10ml", "2 cápsulas")
  - frequency: Frequência de uso (ex: "1x ao dia", "8/8 horas", "de manhã e à noite")
  - duration: Duração do tratamento (ex: "30 dias", "uso contínuo", "7 dias")
  - instructions: Instruções específicas (ex: "Tomar em jejum", "Após as refeições", "Evitar álcool")
- **instructions**: Observações gerais em formato Markdown com orientações de estilo de vida e cuidados

## ATESTADO (documentType = "atestado"):
É OBRIGATÓRIO preencher:
- **title**: Título do atestado (ex: "Atestado Médico de Comparecimento")
- **instructions**: Texto formal em Markdown com:
  - Identificação do paciente
  - Motivo do atestado (afastamento, comparecimento, aptidão)
  - Período quando aplicável
  - CID se necessário

## LAUDO (documentType = "laudo"):
É OBRIGATÓRIO preencher:
- **title**: Título do laudo (ex: "Laudo de Avaliação Cardiológica")
- **instructions**: Análise técnica em Markdown com:
  - Histórico clínico resumido
  - Exames analisados
  - Achados e diagnóstico
  - Conclusão e recomendações

## OUTRO (documentType = "outro"):
Preencha title e instructions conforme o contexto.

REGRAS CRÍTICAS:
- TODOS os campos devem ser preenchidos - nunca deixe campos vazios
- Para receitas, SEMPRE inclua pelo menos 1 medicamento com TODOS os 5 campos
- Use terminologia médica correta, mas clara
- O campo 'instructions' DEVE estar em formato Markdown para melhor legibilidade
- Seja conciso e profissional
- Responda em Português Brasileiro
- Isso é APENAS UM RASCUNHO que será revisado por um médico humano

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
