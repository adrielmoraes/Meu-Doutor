# MediAI - AI-Powered Healthcare Platform

## Overview
MediAI is an AI-powered healthcare platform that connects patients with medical professionals for AI-assisted diagnosis and real-time communication. It offers patient and doctor portals, leveraging Google's Gemini AI models for intelligent medical analysis, preliminary diagnoses, and personalized wellness recommendations, all presented in Brazilian Portuguese. The platform aims to innovate healthcare delivery by integrating advanced AI within a robust, user-friendly interface to improve accessibility and quality of medical consultations. The business vision is to provide hospital-grade preliminary diagnoses with specific medication recommendations, exact dosages, treatment protocols, monitoring guidelines, and contraindications, transforming general advice into actionable clinical guidance.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: Next.js 15 with App Router, TypeScript, and React Server Components.
- **UI Components**: shadcn/ui with Radix UI, Tailwind CSS, featuring a futuristic dark theme with gradients, neon accents, glow effects, semi-transparent cards, animated backgrounds, and gradient text.
- **Routing**: Public, protected patient, and protected doctor routes with middleware-based authentication and role-based access control.

### Backend
- **AI/ML Layer**: Google Genkit orchestrates specialized AI agents using Gemini models (Gemini 2.5 Flash) for domain-specific analysis, text-to-speech, and real-time consultation flows. It includes 15+ specialist agents, an Orchestrator AI (General Practitioner - Dr. Márcio Silva), and a "Central Brain" for intelligent coordination, employing a 3-stage analysis pipeline (Triage → Parallel Specialist Analysis → Synthesis).
- **API Layer**: Next.js API routes with server actions, RESTful endpoints for WebRTC signaling, and Server-Sent Events for real-time communication.
- **Authentication**: JWT-based sessions with `jose` library, bcrypt password hashing, and role-based middleware.

### Data Storage
- **Primary Database**: Neon PostgreSQL, managed via Drizzle ORM.
- **Data Model**: Includes tables for `patients`, `doctors`, `patientAuth`, `doctorAuth`, `exams`, `appointments`, `callRooms`, `signals`, `consultations`, and `wellnessPlan` (JSONB).

### System Design Choices
- **UI/UX**: Futuristic dark theme, live consultation banner with video backgrounds, minimalist consultation interfaces, and visual display for specialist findings. Gamification features for doctors.
- **AI Enhancements**: Enhanced AI system with Gemini 2.5 Flash for medical analysis and consultations. Call recording and transcription via Gemini AI. Server-side AI processing for medical data security. Implementation of an AI Nutritionist for personalized wellness plans.
- **Real-time Communication**: LiveKit for WebRTC, Daily.co SDK for Tavus CVI integration, with automatic device detection and noise cancellation.
- **AI Consultations**: LiveKit + Tavus + Gemini Architecture for production-grade real-time consultations. This includes a Python agent orchestrating 100% Google Gemini API for STT, LLM, and TTS, and Tavus for avatar integration. The system uses a unified voice system ("Aoede" voice, female, pt-BR) across all audio generations. The Tavus avatar has complete access to patient medical history.
- **AI Therapist Chat**: Bidirectional voice chat with WhatsApp-style audio features and voice support.
- **Medical Analysis**: A multi-specialist medical analysis system where exam uploads trigger parallel consultation with up to 15 specialist AI agents, coordinated by an orchestrator AI, providing deep domain-specific analysis with complete traceability. Specialists return structured data including suggested medications, treatment plans, monitoring protocols, contraindications, and relevant metrics. The orchestrator synthesizes this into an integrated medication plan and detailed recommendations.
- **Data Visualization**: Exam history visualization with interactive time-series graphs using Recharts.

## External Dependencies

### AI/ML Services
- Google Gemini API (Gemini 2.0 Flash, Gemini 2.0 Flash Vision, Gemini 1.5 Pro, Gemini 2.5 Flash TTS)
- Google Genkit (AI orchestration framework)
- Tavus CVI (Conversational Video Interface for AI avatars)

### Cloud Services
- Google Cloud Storage
- LiveKit Cloud

### Database
- Neon PostgreSQL

### Real-Time Communication
- WebRTC (LiveKit infrastructure)
- LiveKit Python Agents (1.2.15)
- LiveKit Plugins: google (STT/LLM/TTS), tavus (avatar), silero (VAD)

### Development & Build Tools
- TypeScript
- Tailwind CSS
- Drizzle ORM
- `jose` library