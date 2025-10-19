
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeTavusConversationInputSchema = z.object({
  transcript: z.string().describe('A transcrição completa da conversa Tavus'),
  patientId: z.string().describe('ID do paciente'),
});
export type AnalyzeTavusConversationInput = z.infer<typeof AnalyzeTavusConversationInputSchema>;

const AnalyzeTavusConversationOutputSchema = z.object({
  summary: z.string().describe('Resumo estruturado da consulta'),
  mainConcerns: z.array(z.string()).describe('Principais preocupações do paciente'),
  aiRecommendations: z.array(z.string()).describe('Recomendações dadas pela IA'),
  suggestedFollowUp: z.array(z.string()).describe('Ações de acompanhamento sugeridas'),
  sentiment: z.enum(['positive', 'neutral', 'concerned', 'urgent']).describe('Tom geral da consulta'),
  qualityScore: z.number().min(1).max(10).describe('Pontuação de qualidade da consulta (1-10)'),
});
export type AnalyzeTavusConversationOutput = z.infer<typeof AnalyzeTavusConversationOutputSchema>;

const ANALYSIS_PROMPT = `Você é um assistente médico especializado em análise de consultas.

Analise a seguinte transcrição de uma consulta médica virtual realizada com o avatar AI da MediAI:

{{{transcript}}}

Forneça uma análise estruturada que inclua:

1. **Resumo**: Um resumo conciso e profissional da consulta (2-3 parágrafos)
2. **Principais Preocupações**: Lista das principais queixas e preocupações do paciente
3. **Recomendações da IA**: O que a assistente virtual recomendou
4. **Acompanhamento Sugerido**: Próximos passos recomendados (exames, consultas com especialistas, etc.)
5. **Sentimento**: Avalie o tom geral (positive, neutral, concerned, urgent)
6. **Pontuação de Qualidade**: De 1 a 10, avalie a qualidade e completude da consulta

Seja objetivo, profissional e focado nos aspectos médicos relevantes.
Sua resposta deve estar sempre em Português Brasileiro.`;

const prompt = ai.definePrompt({
  name: 'analyzeTavusConversationPrompt',
  input: { schema: AnalyzeTavusConversationInputSchema },
  output: { schema: AnalyzeTavusConversationOutputSchema },
  prompt: ANALYSIS_PROMPT,
});

const analyzeTavusConversationFlow = ai.defineFlow(
  {
    name: 'analyzeTavusConversationFlow',
    inputSchema: AnalyzeTavusConversationInputSchema,
    outputSchema: AnalyzeTavusConversationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function analyzeTavusConversation(
  input: AnalyzeTavusConversationInput
): Promise<AnalyzeTavusConversationOutput> {
  return analyzeTavusConversationFlow(input);
}
