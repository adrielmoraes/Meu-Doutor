'use server';
/**
 * @fileOverview A medical knowledge base tool for AI agents.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Mock database of medical knowledge.
const medicalData: Record<string, string> = {
    'hypertension': 'A condition in which the force of the blood against the artery walls is too high. Usually defined as blood pressure above 140/90, and is considered severe if the pressure is above 180/120.',
    'troponin': 'A type of protein found in the muscles of your heart. Troponin isn\'t normally found in the blood. When heart muscles become damaged, troponin is sent into the bloodstream. As heart damage increases, greater amounts of troponin are released into the blood.',
    'pleural effusion': 'A buildup of fluid between the thin layers of tissue (pleura) that line the lungs and the chest cavity. It can be caused by many different medical conditions.',
    'atelectasis': 'A complete or partial collapse of the entire lung or an area (lobe) of the lung. It occurs when the tiny air sacs (alveoli) within the lung become deflated or possibly filled with alveolar fluid.',
    'cardiomegaly': 'An enlarged heart. It is not a disease, but rather a sign of another condition. The term is most often used when it is seen on a chest X-ray.',
};


export const medicalKnowledgeBaseTool = ai.defineTool(
    {
      name: 'medicalKnowledgeBaseTool',
      description: 'Provides information about medical terms, conditions, and lab results. Use it to clarify any medical terminology you are not familiar with.',
      inputSchema: z.object({
        term: z.string().describe('The medical term to look up.'),
      }),
      outputSchema: z.string(),
    },
    async (input) => {
      console.log(`[Knowledge Base] Searching for term: ${input.term}`);
      const searchTerm = input.term.toLowerCase();
      
      // Find a matching key in the mock database
      const foundKey = Object.keys(medicalData).find(key => searchTerm.includes(key));

      if (foundKey) {
        return medicalData[foundKey];
      }

      return `No information found for "${input.term}".`;
    }
  );
