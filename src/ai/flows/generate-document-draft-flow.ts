'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { countTextTokens } from '@/lib/token-counter';
import { trackAIUsage } from '@/lib/usage-tracker';

const GenerateDocumentDraftInputSchema = z.object({
    patientId: z.string(),
    documentType: z.enum(['receita', 'atestado', 'laudo', 'outro']),
    doctor: z.object({
        name: z.string(),
        crm: z.string(),
    }),
    patientContext: z.object({
        name: z.string(),
        age: z.number(),
        gender: z.string(),
        reportedSymptoms: z.string().optional(),
        examResults: z.string().optional(),
        recentConsultations: z.string().optional(),
    }),
    currentDate: z.string().optional(),
    currentTime: z.string().optional(),
    signedDocuments: z.string().optional().describe('Resumo de documentos médicos assinados anteriores (receitas, laudos, atestados)'),
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
    prompt: `Você é um assistente médico de alto nível, especializado em suporte à decisão clínica e redação de documentos. 
Sua tarefa é gerar um rascunho de {{documentType}} para o paciente {{patientContext.name}} ({{patientContext.age}} anos, {{patientContext.gender}}), integrando de forma inteligente os dados clínicos fornecidos.

CONTEXTO CLÍNICO DO PACIENTE:
- SINTOMAS RELATADOS: {{patientContext.reportedSymptoms}}
- HISTÓRICO DE EXAMES (Incluindo Pendentes): 
{{patientContext.examResults}}
- CONSULTAS RECENTES: {{patientContext.recentConsultations}}

DIRETRIZES DE ANÁLISE (CRÍTICO):
1. PRIORIZE EXAMES [PENDENTE DE VALIDAÇÃO MÉDICA]: Use as "Sugestões Iniciais" desses exames para basear suas recomendações de medicamentos e condutas.
2. CORRELAÇÃO CLÍNICA: Formule o documento correlacionando os sintomas relatados com os achados dos exames.
3. SEGURANÇA: Seja preciso nas dosagens e frequências usuais.
4. CRUZAMENTO DE DADOS: Se houver documentos médicos anteriores, verifique consistência e evite prescrições conflitantes.

{{#if signedDocuments}}
DOCUMENTOS MÉDICOS ANTERIORES (para referência e cruzamento):
{{signedDocuments}}
{{/if}}

CABEÇALHO OBRIGATÓRIO (TODOS OS DOCUMENTOS):
O campo 'instructions' **DEVE** começar rigorosamente com este cabeçalho formatado em Markdown:
========================================
**PLATAFORMA MEDI.AI** — {{documentType}} (ESCREVA O TIPO EM MAIÚSCULAS)
**Emissão**: {{currentDate}} às {{currentTime}} (Horário de Brasília)
**Médico Responsável**: {{doctor.name}} | **CRM**: {{doctor.crm}}
**Paciente**: {{patientContext.name}} | **Idade**: {{patientContext.age}} anos | **Sexo**: {{patientContext.gender}}
========================================

INSTRUÇÕES ESPECÍFICAS POR TIPO DE DOCUMENTO:

## RECEITA (documentType = "receita"):
- **title**: Título focado na condição tratada (ex: "Protocolo Terapêutico para Rinite Alérgica").
- **medications**: Preencha a lista estruturada com TODOS os campos.
- **instructions (CORPO DA RECEITA)**: Após o cabeçalho obrigatório, inclua:
  1. Cabeçalho breve confirmando o objetivo (ex: "Uso Interno/Oral").
  2. **LISTA DE MEDICAMENTOS**: Escreva cada medicamento da lista 'medications' com sua respectiva posologia e modo de uso detalhado.
  3. Orientações não farmacológicas (higiene, dieta, repouso).
  4. Orientações gerais e sinais de alerta.

## ATESTADO (documentType = "atestado"):
- **title**: Título formal (ex: "Atestado Médico de Afastamento").
- **instructions**: Após o cabeçalho obrigatório, redija o texto padrão profissional incluindo o motivo (afastamento/comparecimento), período sugerido e CID se aplicável.

## LAUDO (documentType = "laudo"):
- **title**: Nome do Laudo (ex: "Laudo de Avaliação Clínica").
- **instructions**: Após o cabeçalho obrigatório, sintetize achados, diagnóstico e plano de conduta.

REGRAS DE FORMATAÇÃO E ESTILO:
- Linguagem: Português Brasileiro, técnica e profissional.
- Markdown: Use negrito para nomes de medicamentos e listas para posologias.
- **IMPORTANTE**: No caso de RECEITA, o campo 'instructions' DEVE conter os medicamentos e como tomá-los, para que apareçam visualmente no editor para o médico.

Gere o rascunho em JSON rigorosamente estruturado:`,
});

export const generateDocumentDraftFlow = ai.defineFlow(
    {
        name: 'generateDocumentDraftFlow',
        inputSchema: GenerateDocumentDraftInputSchema,
        outputSchema: GenerateDocumentDraftOutputSchema,
    },
    async (input) => {
        const inputTokens = countTextTokens(JSON.stringify(input.patientContext));

        const enhancedInput = {
            ...input,
            currentDate: input.currentDate || new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            currentTime: input.currentTime || new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }),
            signedDocuments: input.signedDocuments || (input.patientContext as any)?.signedDocuments || '',
        };

        const result = await generateDocumentDraftPrompt(enhancedInput as any);
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
