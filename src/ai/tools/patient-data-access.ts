
'use server';
/**
 * @fileOverview A tool for accessing a patient's medical data from the database.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getPatientById, getExamsByPatientId } from '@/lib/db-adapter';

export const patientDataAccessTool = ai.defineTool(
    {
      name: 'patientDataAccessTool',
      description: "Use this tool to fetch a patient's medical records, including their history, recent exam results, and validated diagnoses, using their unique patient ID.",
      inputSchema: z.object({
        patientId: z.string().describe('The unique identifier for the patient.'),
      }),
      outputSchema: z.string(),
    },
    async (input) => {
        if (!input.patientId) {
            return "Error: Patient ID is required to access data.";
        }

        console.log(`[Data Access Tool] Fetching data for patient: ${input.patientId}`);

        try {
            const patient = await getPatientById(input.patientId);
            if (!patient) {
                return `No patient found with ID: ${input.patientId}`;
            }

            const exams = await getExamsByPatientId(input.patientId);

            let response = `Patient: ${patient.name}, ${patient.age} years old.\n`;

            if (patient.status === 'Validado' && patient.doctorNotes) {
                response += `\n- Last Validated Diagnosis (by a doctor):\n${patient.doctorNotes}\n`;
            } else {
                response += "\n- No validated diagnosis from a doctor is available yet.\n"
            }

            if (exams.length > 0) {
                response += "\n- Recent Exam Summaries:\n";
                exams.forEach(exam => {
                    response += `  - ${exam.type} on ${new Date(exam.date).toLocaleDateString()}: ${exam.result}\n`;
                });
            } else {
                response += "\n- No exams found for this patient.\n";
            }

            if (patient.conversationHistory) {
                response += `\n- Summary from last AI conversation:\n${patient.conversationHistory.substring(0, 300)}...\n`;
            }
            
            return response;

        } catch (error) {
            console.error('[Data Access Tool] Error fetching patient data:', error);
            return "An error occurred while trying to retrieve the patient's data.";
        }
    }
);
