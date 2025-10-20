# MediAI - AI-Powered Healthcare Platform

## Overview
MediAI is an AI-powered healthcare platform that connects patients with medical professionals for AI-assisted diagnosis and real-time communication. It offers patient and doctor portals, leveraging Google's Gemini AI models for intelligent medical analysis, preliminary diagnoses, and personalized wellness recommendations, all presented in Brazilian Portuguese. The platform aims to innovate healthcare delivery by integrating advanced AI within a robust, user-friendly interface to improve accessibility and quality of medical consultations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**Framework**: Next.js 15 with App Router, TypeScript, and React Server Components.
**UI Components**: shadcn/ui with Radix UI, Tailwind CSS, featuring a futuristic dark theme with gradients, neon accents, glow effects, semi-transparent cards, animated backgrounds, and gradient text.
**Routing Structure**: Public, protected patient, and protected doctor routes with middleware-based authentication and role-based access control.

### Backend Architecture
**AI/ML Layer**: Google Genkit orchestrates specialized AI agents using Gemini models (Gemini 2.5 Flash) for domain-specific analysis, including text-to-speech and real-time consultation flows. The system employs 15+ specialist agents, an Orchestrator AI (General Practitioner - Dr. Márcio Silva), and a "Central Brain" for intelligent coordination. This includes a 3-stage analysis pipeline (Triage → Parallel Specialist Analysis → Synthesis) for multi-specialist diagnostic capabilities, where specialists have access to various medical tools.
**API Layer**: Next.js API routes with server actions for mutations, RESTful endpoints for WebRTC signaling, and Server-Sent Events for real-time communication.
**Authentication & Session Management**: JWT-based sessions with `jose` library, bcrypt password hashing, and role-based middleware.

### Data Storage
**Primary Database**: Neon PostgreSQL, managed via Drizzle ORM.
**Data Model**: Includes tables for `patients`, `doctors`, `patientAuth`, `doctorAuth`, `exams`, `appointments`, `callRooms`, `signals`, and `consultations`. A `wellnessPlan` JSONB field stores personalized wellness programs.

### System Design Choices
- Migration to Neon PostgreSQL with Drizzle ORM.
- JWT-based authentication with bcrypt hashing.
- Google Cloud Storage for file storage.
- Enhanced AI system with Gemini 2.5 Flash for medical analysis and consultations.
- Call recording and transcription via Gemini AI.
- Server-side AI processing for medical data security.
- Implementation of an AI Nutritionist for personalized wellness plans, including dietary, exercise, and mental wellness components.
- Integration of Tavus Conversational Video Interface (CVI) for live AI avatar consultations using Daily.co SDK, with automatic device detection and noise cancellation.
- AI Therapist Chat with voice support, providing therapeutic support and acting as a personal health assistant.
- Exam history visualization with interactive time-series graphs using Recharts.
- Gamification features for doctors (XP, levels, badges).
- A multi-specialist medical analysis system where exam uploads trigger parallel consultation with up to 15 specialist AI agents, coordinated by an orchestrator AI (Dr. Márcio Silva), providing deep domain-specific analysis with complete traceability.
- **LiveKit + Tavus + Gemini Architecture** (✅ PRODUCTION READY - October 19, 2025): A production-grade architecture leveraging LiveKit for WebRTC, a Python agent orchestrating **100% Google Gemini API** for STT, LLM, and TTS, and Tavus for avatar integration. The route `/patient/live-consultation` uses a Python Agent (`livekit-agent/agent.py`) that follows the official LiveKit example structure with medical context integration. Key features:
  - **100% Gemini Powered**: Google Speech-to-Text (pt-BR), Gemini 2.0 Flash LLM, Google Text-to-Speech (pt-BR)
  - **Unified Voice System**: ALL audio generation uses "Aoede" voice (female, pt-BR) for consistency across therapist chat, LiveKit consultations, and TalkingHead avatar
  - **Tavus Avatar**: Real-time lip-synced video avatar (replica_id: r3a47ce45e68, persona_id: pd18f02bdb67)
  - **Room Metadata**: Patient ID passed via LiveKit room metadata for context loading
  - **Medical Context**: Agent loads complete patient history (exams, wellness plan, symptoms) from PostgreSQL before consultation
  - **Cost Efficient**: ~$0.01/min (35x cheaper than Tavus Direct API)
  - **Low Latency**: WebRTC direct connection (~200ms vs ~500ms)
  - **Worker Architecture**: Python Agent runs as LiveKit worker, automatically joins rooms when patients connect
- **Tavus Medical Context Integration**: The AI avatar has complete access to patient medical history (profile, exams, consultations, wellness plan) for personalized and context-aware consultations in Portuguese. Context is loaded via database query when agent detects new room participant.
- **AI Therapist Chat with WhatsApp-Style Audio**: Bidirectional voice chat with waveform visualization, play/pause controls, duration display, and recording indicators. User audio messages are saved for playback. Text→text and audio→audio response modes.
- **UI Design Updates**: Includes a live consultation banner with video backgrounds and gradient overlays, minimalist live consultation interfaces, and a visual display for specialist findings with color-coded icons, severity indicators, and expandable content.

## External Dependencies

**AI/ML Services**:
- Google Gemini API (Gemini 2.0 Flash, Gemini 2.0 Flash Vision, Gemini 1.5 Pro, Gemini 2.5 Flash TTS)
- Google Genkit (AI orchestration framework)
- Tavus CVI (Conversational Video Interface for AI avatars)

**Cloud Services**:
- Google Cloud Storage
- LiveKit Cloud

**Database**:
- Neon PostgreSQL

**Real-Time Communication**:
- WebRTC (LiveKit infrastructure)
- LiveKit Cloud (primary video/audio platform)
- LiveKit Python Agents (1.2.15)
- LiveKit Plugins: google (STT/LLM/TTS), tavus (avatar), silero (VAD)

**Development & Build Tools**:
- TypeScript
- Tailwind CSS
- Drizzle ORM
- `jose` library

## Recent Changes

### October 20, 2025
- **UI Cleanup**: Removed non-functional "IA Central Brain" card from doctor dashboard to streamline interface
  - Removed TalkingAvatar3D component from dashboard (still available for patient consultations)
  - Simplified navigation card layout to full-width 3-column grid

### October 19, 2025
- **React 19 Migration**: Updated login page from deprecated `useFormState` (React-DOM) to `useActionState` (React) following React 19 API changes
- **UI Restoration**: Restored the highlighted "Consulta ao Vivo com a IA" banner in the Overview tab of patient dashboard with video background, badges, and call-to-action button
- **Doctor-Patient Video Calls**: Implemented complete real-time video call system using LiveKit for doctor-to-patient consultations:
  - Created `DoctorLiveKitCall` component for doctor video interface with patient video in full screen and doctor preview in picture-in-picture
  - Added `/doctor/video-call` route for conducting video consultations
  - Integrated "Start Video Call" button in doctor's schedule page for appointments marked as video consultations
  - Added "Chamadas de Vídeo" link to doctor sidebar for quick access to video call functionality
  - Server actions for creating unique consultation rooms with format `consultation-{appointmentId}-{timestamp}`
  - Full microphone and camera controls with mute/unmute toggles during calls
  - Automatic redirect to schedule page after ending calls
- **Ultra-Detailed AI Medical Analysis System** (✅ MAJOR ENHANCEMENT):
  - **Enhanced Specialist Output Schema**: All 15+ specialist AI agents now return structured data including:
    * `suggestedMedications`: Array of medications with specific dosages, frequencies, duration, route of administration, and clinical justification
    * `treatmentPlan`: Comprehensive treatment plan with primary treatment, supportive care, lifestyle modifications, and expected outcomes
    * `monitoringProtocol`: Detailed monitoring parameters, frequency, and warning signals
    * `contraindications`: List of important contraindications for suggested treatments
    * `relevantMetrics`: Enhanced metrics with detailed clinical interpretation for each value
  - **Ultra-Detailed Specialist Prompts**: Completely rewrote key specialist agents with pharmaceutical-grade precision:
    * **Cardiologist Agent (Dra. Ana Silva)**: 
      - Deep analysis of all cardiovascular parameters (ECG intervals, biomarkers, echocardiogram measurements)
      - Specific medication protocols for hypertension (Losartana, Anlodipino, HCTZ with exact mg dosages)
      - Dyslipidemia treatment (Atorvastatina 20-40mg, Rosuvastatina 20-40mg with LDL targets)
      - Heart failure management (Carvedilol titration, Enalapril, Espironolactona, Furosemida)
      - Atrial fibrillation protocols (rate control, anticoagulation with NOACs)
      - Acute coronary syndrome DAPT (AAS + Clopidogrel/Ticagrelor)
    * **Endocrinologist Agent (Dra. Beatriz Almeida)**:
      - Granular diabetes management with HbA1c-based treatment escalation
      - Metformin dosing (500mg→1000mg 2x/dia titration)
      - iSGLT2 inhibitors (Empagliflozina 10-25mg) and GLP-1 agonists (Liraglutida, Semaglutida)
      - Insulin protocols (basal-bolus regimens with Glargina, NPH, rapid-acting)
      - Thyroid management (Levotiroxina dosing by TSH level, Metimazol for hyperthyroidism)
      - Osteoporosis treatment (Alendronato 70mg weekly, Denosumabe, Ácido Zoledrônico)
      - Vitamin D reposition protocols (7,000-14,000 UI loading doses)
      - PCOS management (Metformina, anticonceptionals, Espironolactona)
      - Male hypogonadism (Testosterone replacement protocols)
  - **Enhanced Orchestrator Synthesis (Dr. Márcio Silva)**: 
    - Integrates ALL specialist medications into unified prescription plan
    - Medication interaction checking and deduplication
    - Structured output with sections: Executive Summary, Findings by System, Differential Diagnoses, Therapeutic Priorities
    - Ultra-detailed recommendations including:
      * Integrated Medication Plan (organized by class with targets)
      * Prioritized Diagnostic Tests (immediate/urgent/elective)
      * Lifestyle Modifications (diet, exercise, weight targets)
      * Monitoring Protocol (parameters, frequency, warning signals)
      * Treatment Timeline (week-by-week progression)
      * Prognosis with expected outcomes
  - **Enhanced Patient History Summarization (Dra. Sofia Mendes)**:
    - Comprehensive 9-section structure: Chief Complaint, History of Present Illness, Past Medical History, Family History, Social History, Review of Systems, Clinical Timeline, Red Flags, Psychosocial Factors
    - Organizes symptoms by organ system
    - Identifies warning signs requiring immediate attention
    - Creates chronological clinical journey timeline
  - **Result**: The AI system now provides hospital-grade preliminary diagnoses with specific medication recommendations, exact dosages, treatment protocols, monitoring guidelines, and contraindications—transforming from general advice to actionable clinical guidance that physicians can immediately implement.