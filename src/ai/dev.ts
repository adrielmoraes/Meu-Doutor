
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-patient-history.ts';
import '@/ai/flows/generate-preliminary-diagnosis.ts';
import '@/ai/flows/analyze-medical-exam.ts';
import '@/ai/flows/text-to-speech.ts';
// import '@/ai/flows/consultation-flow.ts'; // Legacy, replaced by live-consultation-flow
import '@/ai/flows/cardiologist-agent.ts';
import '@/ai/flows/pulmonologist-agent.ts';
import '@/ai/flows/radiologist-agent.ts';
import '@/ai/flows/neurologist-agent.ts';
import '@/ai/flows/gastroenterologist-agent.ts';
import '@/ai/flows/endocrinologist-agent.ts';
import '@/ai/flows/dermatologist-agent.ts';
import '@/ai/flows/orthopedist-agent.ts';
import '@/ai/flows/ophthalmologist-agent.ts';
import '@/ai/flows/otolaryngologist-agent.ts';
import '@/ai/flows/nutritionist-agent.ts';
import '@/ai/flows/pediatrician-agent.ts';
import '@/ai/flows/gynecologist-agent.ts';
import '@/ai/flows/urologist-agent.ts';
import '@/ai/flows/psychiatrist-agent.ts';
import '@/ai/flows/explain-diagnosis-flow.ts';
import '@/ai/flows/generate-wellness-plan.ts';
import '@/ai/flows/generate-health-insights.ts';
import '@/ai/flows/triage-urgency-flow.ts';
import '@/ai/flows/live-consultation-flow.ts'; // Re-enabled for proper live consultation
import '@/ai/flows/summarize-vitals-flow.ts';
import '@/ai/tools/medical-knowledge-base.ts';
import '@/ai/tools/patient-data-access.ts';
import '@/ai/tools/internet-search.ts';
