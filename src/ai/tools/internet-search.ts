'use server';
/**
 * @fileOverview A tool for searching the internet for general health and nutrition information.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Mock database for internet search results.
// In a real-world production system, this would be replaced with calls to a search API 
// like Google Custom Search, Bing, or a specialized health information API.
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
      console.log(`[Internet Search] Searching for query: ${input.query}`);

      // START - REAL-WORLD IMPLEMENTATION
      // In a real-world scenario, you would replace this mock search with a `fetch` call to a search API.
      //
      // Example (pseudo-code for Google Custom Search API):
      // const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
      // const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;
      // const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(input.query)}`);
      // const data = await response.json();
      // return data.items?.map(item => item.snippet).join('\n') || `Nenhuma informação encontrada para "${input.query}".`;
      // END - REAL-WORLD IMPLEMENTATION
      

      // MOCK IMPLEMENTATION FOR PROTOTYPE
      const searchQuery = input.query.toLowerCase();
      // Find the key that is most relevant to the search query.
      const foundKey = Object.keys(internetData).find(key => searchQuery.includes(key));

      if (foundKey) {
        return internetData[foundKey];
      }

      return `Nenhuma informação encontrada na internet para "${input.query}".`;
    }
  );
