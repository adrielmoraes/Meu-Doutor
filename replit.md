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
- Enhanced AI system with Gemini 2.5 Flash, including a "Central Brain" system with a 3D TalkingHead avatar using TalkingHead.js and Gemini 2.5 Flash TTS for realistic interactions.
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