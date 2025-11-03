
'use server';

/**
 * @fileOverview An AI agent for analyzing medical exam documents and providing a preliminary diagnosis.
 * This version integrates a multi-specialist AI system for comprehensive analysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generatePreliminaryDiagnosis } from './generate-preliminary-diagnosis';

const DocumentInputSchema = z.object({
  examDataUri: z
    .string()
    .describe(
      "A medical exam document (PDF, JPG, PNG) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    fileName: z.string().describe("The original file name of the document.")
});

const AnalyzeMedicalExamInputSchema = z.object({
  documents: z.array(DocumentInputSchema).describe("An array of medical exam documents to be analyzed together.")
});
export type AnalyzeMedicalExamInput = z.infer<typeof AnalyzeMedicalExamInputSchema>;

const StructuredResultSchema = z.object({
    name: z.string().describe("The name of the test or measurement (e.g., 'Troponina I', 'Colesterol HDL')."),
    value: z.string().describe("The measured value (e.g., '0.8 ng/mL', '150 mg/dL')."),
    reference: z.string().describe("The reference range for the test (e.g., '< 0.4 ng/mL', '40-60 mg/dL')."),
});

const AnalyzeMedicalExamOutputSchema = z.object({
  preliminaryDiagnosis: z.string().describe('The preliminary diagnosis based on the combined analysis of all documents.'),
  explanation: z.string().describe('An empathetic and simple explanation of the exam results for the patient.'),
  suggestions: z.string().describe('A proposed initial treatment plan for the human doctor to review. This should include specific suggestions for medication (with purpose), therapies (like physiotherapy), and follow-up exams.'),
  structuredResults: z.array(StructuredResultSchema).optional().describe("A list of structured key-value results extracted from the exams, if available (e.g., blood test results)."),
  specialistFindings: z.array(z.object({
    specialist: z.string(),
    findings: z.string(),
    clinicalAssessment: z.string(),
    recommendations: z.string(),
  })).optional().describe("Detailed findings from specialist consultations, if applicable."),
});
export type AnalyzeMedicalExamOutput = z.infer<typeof AnalyzeMedicalExamOutputSchema>;

export async function analyzeMedicalExam(input: AnalyzeMedicalExamInput): Promise<AnalyzeMedicalExamOutput> {
  return analyzeMedicalExamFlow(input);
}

// Step 1: Extract exam data and create patient-friendly explanation
const documentAnalysisPrompt = ai.definePrompt({
  name: 'documentAnalysisPrompt',
  input: {schema: AnalyzeMedicalExamInputSchema},
  output: {
    schema: z.object({
      examResultsSummary: z.string().describe("A comprehensive summary of all exam results in medical terminology."),
      structuredResults: z.array(StructuredResultSchema).optional().describe("Structured lab results, if available."),
      patientExplanation: z.string().describe("A simple, empathetic explanation for the patient (Brazilian Portuguese)."),
    }),
  },
  prompt: `You are a medical AI assistant analyzing exam documents. Your task is to:

1. **Extract and Summarize**: Review all provided medical documents and create a comprehensive medical summary of the findings.
2. **Structure Lab Results**: If the documents contain lab results (blood tests, etc.), extract them into structured format.
3. **Patient Explanation**: Write a simple, empathetic explanation of the findings for a non-medical patient in Brazilian Portuguese.

**CRITICAL INSTRUCTIONS:**
- Be thorough in extracting all medical findings
- Use proper medical terminology in the summary
- Make the patient explanation warm, simple, and reassuring
- Use analogies and avoid medical jargon in the patient explanation
- All patient-facing text must be in Brazilian Portuguese

**Analyze the following documents:**
{{#each documents}}
---
Document Name: {{this.fileName}}
Document Content:
{{media url=this.examDataUri}}
---
{{/each}}

Return ONLY a bare JSON object with the exact fields specified. NO markdown fences, NO backticks.`,
});

const analyzeMedicalExamFlow = ai.defineFlow(
  {
    name: 'analyzeMedicalExamFlow',
    inputSchema: AnalyzeMedicalExamInputSchema,
    outputSchema: AnalyzeMedicalExamOutputSchema,
  },
  async input => {
    console.log('[🏥 Multi-Specialist Analysis] Starting comprehensive exam analysis...');
    
    // STEP 1: Extract exam data and create patient explanation
    console.log('[📄 Document Analysis] Extracting exam data from documents...');
    const {output: docAnalysis} = await documentAnalysisPrompt(input);
    
    if (!docAnalysis) {
      throw new Error("Failed to analyze documents");
    }
    
    console.log('[📄 Document Analysis] ✅ Extracted exam data successfully');
    
    // STEP 2: Call multi-specialist system for comprehensive diagnosis
    console.log('[🩺 Specialist Team] Activating multi-specialist diagnostic system...');
    console.log('[🩺 Specialist Team] Exam Summary:', docAnalysis.examResultsSummary.substring(0, 200) + '...');
    
    const specialistAnalysis = await generatePreliminaryDiagnosis({
      examResults: docAnalysis.examResultsSummary,
      patientHistory: "Histórico não disponível nesta análise inicial.", // Can be enhanced later with actual patient history
    });
    
    console.log('[🩺 Specialist Team] ✅ Specialist analysis complete!');
    console.log(`[🩺 Specialist Team] Consulted ${specialistAnalysis.structuredFindings.length} specialist(s)`);
    
    // Log which specialists were consulted
    if (specialistAnalysis.structuredFindings.length > 0) {
      const specialists = specialistAnalysis.structuredFindings.map(f => f.specialist).join(', ');
      console.log(`[🩺 Specialist Team] Specialists consulted: ${specialists}`);
    }
    
    // STEP 3: Combine results
    console.log('[📊 Synthesis] Combining specialist findings with patient-friendly explanation...');
    
    const finalResult = {
      preliminaryDiagnosis: specialistAnalysis.synthesis,
      explanation: docAnalysis.patientExplanation,
      suggestions: specialistAnalysis.suggestions,
      structuredResults: docAnalysis.structuredResults,
      specialistFindings: specialistAnalysis.structuredFindings,
    };
    
    console.log('[✅ Analysis Complete] Multi-specialist system activated successfully!');
    
    return finalResult;
  }
);
