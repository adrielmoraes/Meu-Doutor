
import { ai } from '../genkit';
import { z } from 'zod';

const AnalyzeTavusConversationInputSchema = z.object({
  transcript: z.string(),
  patientId: z.string()
});

const AnalyzeTavusConversationOutputSchema = z.object({
  summary: z.string(),
  mainConcerns: z.array(z.string()),
  aiRecommendations: z.array(z.string()),
  suggestedFollowUp: z.array(z.string()),
  sentiment: z.string(),
  qualityScore: z.number()
});

export const analyzeTavusConversation = ai.defineFlow(
  {
    name: 'analyzeTavusConversation',
    inputSchema: AnalyzeTavusConversationInputSchema,
    outputSchema: AnalyzeTavusConversationOutputSchema,
  },
  async (input) => {
    const { transcript, patientId } = input;

    const { text } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      config: {
        temperature: 0.3,
      },
      prompt: `Você é um assistente médico especializado em análise de consultas virtuais.

Analise a seguinte transcrição de uma consulta virtual entre um paciente e a assistente virtual MediAI:

TRANSCRIÇÃO:
${transcript}

PACIENTE ID: ${patientId}

Forneça uma análise detalhada no seguinte formato JSON:

{
  "summary": "Resumo conciso da consulta em 2-3 frases",
  "mainConcerns": ["Preocupação 1", "Preocupação 2", "Preocupação 3"],
  "aiRecommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"],
  "suggestedFollowUp": ["Ação de acompanhamento 1", "Ação de acompanhamento 2"],
  "sentiment": "positivo/neutro/negativo",
  "qualityScore": número de 1-10 indicando a qualidade da interação
}

IMPORTANTE:
- Seja objetivo e profissional
- Identifique os principais sintomas mencionados
- Sugira próximos passos relevantes
- Avalie a qualidade da conversa (clareza, completude, empatia)
- O sentiment deve refletir o tom geral da conversa`,
    });

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        summary: analysis.summary || 'Consulta realizada com sucesso',
        mainConcerns: analysis.mainConcerns || [],
        aiRecommendations: analysis.aiRecommendations || [],
        suggestedFollowUp: analysis.suggestedFollowUp || [],
        sentiment: analysis.sentiment || 'neutro',
        qualityScore: Math.min(10, Math.max(1, analysis.qualityScore || 7))
      };
    } catch (parseError) {
      console.error('Erro ao fazer parse da análise:', parseError);
      
      return {
        summary: 'Consulta virtual realizada. Análise automática indisponível.',
        mainConcerns: ['Informações não processadas automaticamente'],
        aiRecommendations: ['Revisar transcrição manualmente'],
        suggestedFollowUp: ['Agendar consulta de acompanhamento se necessário'],
        sentiment: 'neutro',
        qualityScore: 5
      };
    }
  }
);
