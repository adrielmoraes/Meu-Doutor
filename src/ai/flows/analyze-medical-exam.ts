
'use server';

/**
 * @fileOverview An AI agent for analyzing medical exam documents and providing a preliminary diagnosis.
 * This version integrates a multi-specialist AI system for comprehensive analysis.
 * Optimized for Vercel serverless environment with sequential document processing.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generatePreliminaryDiagnosis } from './generate-preliminary-diagnosis';
import { estimateImageTokens, countTextTokens } from '@/lib/token-counter';
import { trackExamDocumentAnalysis } from '@/lib/usage-tracker';

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

const SingleDocumentResultSchema = z.object({
  examResultsSummary: z.string().describe("A comprehensive summary of the exam results in medical terminology."),
  structuredResults: z.array(StructuredResultSchema).optional().describe("Structured lab results, if available."),
  patientExplanation: z.string().describe("A simple, empathetic explanation for the patient (Brazilian Portuguese)."),
});

export async function analyzeMedicalExam(input: AnalyzeMedicalExamInput): Promise<AnalyzeMedicalExamOutput> {
  return analyzeMedicalExamFlow(input);
}

// Prompt for analyzing a SINGLE document (optimized for Vercel serverless)
const singleDocumentAnalysisPrompt = ai.definePrompt({
  name: 'singleDocumentAnalysisPrompt',
  input: {schema: DocumentInputSchema},
  output: {
    schema: SingleDocumentResultSchema,
  },
  prompt: `You are a medical AI assistant analyzing a single exam document. Your task is to:

1. **Extract and Summarize**: Review the medical document and create a comprehensive medical summary of the findings.
2. **Structure Lab Results**: If the document contains lab results (blood tests, etc.), extract them into structured format.
3. **Patient Explanation**: Write a simple, empathetic explanation of the findings for a non-medical patient in Brazilian Portuguese.

**CRITICAL INSTRUCTIONS:**
- Be thorough in extracting all medical findings
- Use proper medical terminology in the summary
- Make the patient explanation warm, simple, and reassuring
- Use analogies and avoid medical jargon in the patient explanation
- All patient-facing text must be in Brazilian Portuguese

**Analyze the following document:**
Document Name: {{fileName}}
Document Content:
{{media url=examDataUri}}

Return ONLY a bare JSON object with the exact fields specified. NO markdown fences, NO backticks.`,
});

// Prompt for combining multiple document summaries into a unified analysis
const combineDocumentSummariesPrompt = ai.definePrompt({
  name: 'combineDocumentSummariesPrompt',
  input: {
    schema: z.object({
      summaries: z.array(z.object({
        fileName: z.string(),
        examResultsSummary: z.string(),
        patientExplanation: z.string(),
      })),
    }),
  },
  output: {
    schema: z.object({
      examResultsSummary: z.string().describe("A unified comprehensive summary of ALL exam results in medical terminology."),
      patientExplanation: z.string().describe("A unified simple, empathetic explanation for the patient (Brazilian Portuguese)."),
    }),
  },
  prompt: `You are a medical AI assistant. You have received summaries from multiple exam documents analyzed individually.
Your task is to create a UNIFIED, comprehensive summary that combines all findings coherently.

**CRITICAL INSTRUCTIONS:**
- Combine all medical findings into ONE cohesive summary
- Identify any correlations or patterns across different exams
- Create a single patient-friendly explanation that covers all exams
- All patient-facing text must be in Brazilian Portuguese
- Do NOT just concatenate - synthesize and integrate the information

**Individual Document Summaries:**
{{#each summaries}}
---
Document: {{this.fileName}}
Medical Summary: {{this.examResultsSummary}}
Patient Explanation: {{this.patientExplanation}}
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
    console.log(`[📄 Document Analysis] Processing ${input.documents.length} document(s)...`);
    
    let examResultsSummary: string;
    let patientExplanation: string;
    let allStructuredResults: z.infer<typeof StructuredResultSchema>[] = [];
    
    // STEP 1: Process documents - sequential for Vercel compatibility
    if (input.documents.length === 1) {
      // Single document - direct analysis
      console.log('[📄 Document Analysis] Single document mode - direct analysis...');
      const {output: docAnalysis} = await singleDocumentAnalysisPrompt(input.documents[0]);
      
      if (!docAnalysis) {
        throw new Error("Failed to analyze document");
      }
      
      examResultsSummary = docAnalysis.examResultsSummary;
      patientExplanation = docAnalysis.patientExplanation;
      allStructuredResults = docAnalysis.structuredResults || [];
      
      // TRACK TOKEN USAGE: Count image tokens
      const imageTokens = estimateImageTokens(2048, 1536, 'high'); // Avg medical image size
      const textTokens = countTextTokens(examResultsSummary + patientExplanation);
      console.log(`[📊 Token Accounting] Image: ${imageTokens} tokens, Text: ${textTokens} tokens, Total: ${imageTokens + textTokens} tokens`);
      
    } else {
      // Multiple documents - process SEQUENTIALLY to avoid Vercel timeouts
      console.log('[📄 Document Analysis] Multiple documents mode - sequential processing for production compatibility...');
      
      const documentSummaries: Array<{
        fileName: string;
        examResultsSummary: string;
        patientExplanation: string;
      }> = [];
      
      // Process each document one at a time
      for (let i = 0; i < input.documents.length; i++) {
        const doc = input.documents[i];
        console.log(`[📄 Document Analysis] Processing document ${i + 1}/${input.documents.length}: ${doc.fileName}...`);
        
        try {
          const {output: docResult} = await singleDocumentAnalysisPrompt(doc);
          
          if (docResult) {
            documentSummaries.push({
              fileName: doc.fileName,
              examResultsSummary: docResult.examResultsSummary,
              patientExplanation: docResult.patientExplanation,
            });
            
            // Collect structured results from each document
            if (docResult.structuredResults) {
              allStructuredResults = [...allStructuredResults, ...docResult.structuredResults];
            }
            
            console.log(`[📄 Document Analysis] ✅ Document ${i + 1} processed successfully`);
          } else {
            console.warn(`[📄 Document Analysis] ⚠️ Document ${i + 1} returned no output, skipping...`);
          }
        } catch (docError) {
          console.error(`[📄 Document Analysis] ❌ Error processing document ${i + 1}:`, docError);
          // Continue with other documents instead of failing completely
        }
      }
      
      if (documentSummaries.length === 0) {
        throw new Error("Failed to analyze any documents");
      }
      
      // Combine all summaries into unified analysis
      console.log('[📄 Document Analysis] Combining summaries from all documents...');
      const {output: combinedAnalysis} = await combineDocumentSummariesPrompt({
        summaries: documentSummaries,
      });
      
      if (!combinedAnalysis) {
        throw new Error("Failed to combine document analyses");
      }
      
      examResultsSummary = combinedAnalysis.examResultsSummary;
      patientExplanation = combinedAnalysis.patientExplanation;
    }
    
    console.log('[📄 Document Analysis] ✅ All documents processed successfully');
    
    // STEP 2: Call multi-specialist system for comprehensive diagnosis
    console.log('[🩺 Specialist Team] Activating multi-specialist diagnostic system...');
    console.log('[🩺 Specialist Team] Exam Summary:', examResultsSummary.substring(0, 200) + '...');
    
    const specialistAnalysis = await generatePreliminaryDiagnosis({
      examResults: examResultsSummary,
      patientHistory: "Histórico não disponível nesta análise inicial.",
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
      explanation: patientExplanation,
      suggestions: specialistAnalysis.suggestions,
      structuredResults: allStructuredResults.length > 0 ? allStructuredResults : undefined,
      specialistFindings: specialistAnalysis.structuredFindings,
    };
    
    // STEP 4: Track usage for cost accounting
    // Calculate total tokens used across document analysis
    const documentCount = input.documents.length;
    const avgImageTokensPerDoc = estimateImageTokens(2048, 1536, 'high'); // Avg medical image
    const totalImageTokens = documentCount * avgImageTokensPerDoc;
    const inputTextTokens = countTextTokens(examResultsSummary);
    const outputTextTokens = countTextTokens(
      finalResult.preliminaryDiagnosis + 
      finalResult.explanation + 
      finalResult.suggestions +
      JSON.stringify(finalResult.specialistFindings || [])
    );
    
    // Note: patientId is not available in this flow - tracking is done in the caller (patient actions)
    // Log token usage for monitoring
    console.log(`[📊 Token Accounting] Documents: ${documentCount}, Image tokens: ${totalImageTokens}, Input text: ${inputTextTokens}, Output: ${outputTextTokens}`);
    console.log(`[📊 Token Accounting] Total estimated tokens: ${totalImageTokens + inputTextTokens + outputTextTokens}`);
    
    console.log('[✅ Analysis Complete] Multi-specialist system activated successfully!');
    
    return finalResult;
  }
);
