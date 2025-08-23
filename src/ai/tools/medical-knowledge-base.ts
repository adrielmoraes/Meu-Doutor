'use server';
/**
 * @fileOverview A medical knowledge base tool for AI agents.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Mock database of medical knowledge.
// In a real-world production system, this would be replaced with calls to a trusted medical API,
// such as the NIH's MedlinePlus API, PubMed, or another comprehensive medical database.
const medicalData: Record<string, string> = {
    'hypertension': 'A condition in which the force of the blood against the artery walls is too high. Usually defined as blood pressure above 140/90, and is considered severe if the pressure is above 180/120. Often called high blood pressure.',
    'troponin': 'A type of protein found in the muscles of your heart. Troponin isn\'t normally found in the blood. When heart muscles become damaged, troponin is sent into the bloodstream. As heart damage increases, greater amounts of troponin are released into the blood.',
    'pleural effusion': 'A buildup of fluid between the thin layers of tissue (pleura) that line the lungs and the chest cavity. It can be caused by many different medical conditions, such as pneumonia, heart failure, or cancer.',
    'atelectasis': 'A complete or partial collapse of the entire lung or an area (lobe) of the lung. It occurs when the tiny air sacs (alveoli) within the lung become deflated or possibly filled with alveolar fluid.',
    'cardiomegaly': 'An enlarged heart, which is a sign of another condition, not a disease itself. It can be caused by various factors, including high blood pressure and coronary artery disease. The term is most often used when it is seen on a chest X-ray.',
    'anemia': 'A condition in which you lack enough healthy red blood cells to carry adequate oxygen to your body\'s tissues. Common symptoms include fatigue, weakness, pale skin, and shortness of breath.',
    'type 2 diabetes': 'A chronic condition that affects the way your body metabolizes sugar (glucose). Your body either resists the effects of insulin — a hormone that regulates the movement of sugar into your cells — or doesn\'t produce enough insulin to maintain normal glucose levels.',
    'GERD': 'Gastroesophageal reflux disease (GERD) occurs when stomach acid frequently flows back into the tube connecting your mouth and stomach (esophagus). This backwash (acid reflux) can irritate the lining of your esophagus. Symptoms include heartburn and acid regurgitation.',
    'migraine': 'A type of headache that can cause severe throbbing pain or a pulsing sensation, usually on one side of the head. It\'s often accompanied by nausea, vomiting, and extreme sensitivity to light and sound.',
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

      // START - REAL-WORLD IMPLEMENTATION
      // In a real-world scenario, you would replace the mock search with a `fetch` call to a medical API.
      //
      // Example (pseudo-code for MedlinePlus API):
      // const response = await fetch(`https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encodeURIComponent(input.term)}&rettype=snippet`);
      // const xmlText = await response.text();
      // // You would need an XML parser to extract the content from the response.
      // // For example:
      // // const content = parseXml(xmlText).find('content').text();
      // // return content || `No information found for "${input.term}".`;
      // END - REAL-WORLD IMPLEMENTATION
      

      // MOCK IMPLEMENTATION FOR PROTOTYPE
      const searchTerm = input.term.toLowerCase();
      // Find the key that is most relevant to the search query.
      const foundKey = Object.keys(medicalData).find(key => searchTerm.includes(key));

      if (foundKey) {
        return medicalData[foundKey];
      }

      return `No information found for "${input.term}".`;
    }
  );
