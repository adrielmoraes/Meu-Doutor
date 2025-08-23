'use server';
/**
 * @fileOverview A tool for searching the internet for general health and nutrition information.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Mock database for internet search results.
// Used as a fallback if no API key is provided.
const internetData: Record<string, string> = {
    'dieta mediterrânea': 'A dieta mediterrânea é um padrão alimentar inspirado nos hábitos alimentares da Grécia, Itália e Espanha. É rica em frutas, vegetais, nozes, grãos integrais, azeite de oliva e peixe, e baixa em carnes vermelhas e doces. Estudos mostram que pode reduzir o risco de doenças cardíacas.',
    'dieta dash': 'A dieta DASH (Dietary Approaches to Stop Hypertension) é projetada para ajudar a tratar ou prevenir a pressão alta. Enfatiza frutas, vegetais, grãos integrais e laticínios com baixo teor de gordura.',
    'benefícios do abacate': 'O abacate é rico em gorduras monoinsaturadas saudáveis para o coração, fibras, potássio e vitaminas K, C e E. Ajuda na saciedade, na saúde do coração e na absorção de outros nutrientes.',
    'jejum intermitente': 'O jejum intermitente envolve a alternância de ciclos de alimentação e jejum. Métodos comuns incluem o método 16/8 (jejuar por 16 horas) e o Eat-Stop-Eat (jejum de 24 horas uma ou duas vezes por semana). Pode levar à perda de peso e a outros benefícios para a saúde, mas não é adequado para todos.',
    'alimentos ricos em ferro': 'Alimentos ricos em ferro incluem carne vermelha, aves, peixes, feijão, lentilhas, espinafre, couve e cereais fortificados. A vitamina C ajuda na absorção de ferro de fontes vegetais.',
    'importância da hidratação': 'A hidratação adequada é vital para a saúde geral. Ajuda a regular a temperatura corporal, a manter as articulações lubrificadas, a prevenir infecções e a fornecer nutrientes às células. A recomendação geral é de cerca de 8 copos (2 litros) de água por dia.',
    'exercícios de baixo impacto': 'Exercícios de baixo impacto são mais suaves para as articulações. Exemplos incluem caminhada, natação, ciclismo, ioga e pilates. Eles são ótimos para iniciantes, pessoas com problemas nas articulações ou em recuperação de lesões.',
};


export const internetSearchTool = ai.defineTool(
    {
      name: 'internetSearchTool',
      description: 'Busca na internet informações gerais sobre tópicos de nutrição, dieta, bem-estar e estilo de vida. Use para pesquisar alimentos, planos de dieta e conselhos de saúde.',
      inputSchema: z.object({
        query: z.string().describe('O termo de busca a ser pesquisado.'),
      }),
      outputSchema: z.string(),
    },
    async (input) => {
      const apiKey = process.env.GOOGLE_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      if (apiKey && searchEngineId) {
        // PRODUCTION IMPLEMENTATION: Uses Google Custom Search API
        console.log(`[Internet Search] Using real API to search for: ${input.query}`);
        try {
            const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(input.query)}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }
            const data = await response.json();
            const snippets = data.items?.map((item: any) => item.snippet).join('\n');
            return snippets || `Nenhuma informação encontrada na internet para "${input.query}".`;
        } catch (error) {
            console.error('[Internet Search] API call failed:', error);
            return 'Ocorreu um erro ao buscar informações na internet.';
        }
      } else {
        // MOCK IMPLEMENTATION FOR PROTOTYPE (fallback)
        console.log(`[Internet Search] Using mock data to search for: ${input.query}`);
        const searchQuery = input.query.toLowerCase();
        // Find the key that is most relevant to the search query.
        const foundKey = Object.keys(internetData).find(key => searchQuery.includes(key));

        if (foundKey) {
            return internetData[foundKey];
        }

        return `Nenhuma informação encontrada na internet para "${input.query}".`;
      }
    }
  );
