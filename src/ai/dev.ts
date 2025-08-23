import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-patient-history.ts';
import '@/ai/flows/generate-preliminary-diagnosis.ts';
import '@/ai/flows/analyze-medical-exam.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/consultation-flow.ts';
