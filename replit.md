# MediAI - AI-Powered Healthcare Platform

## Overview
MediAI is an AI-powered healthcare platform designed to connect patients with medical professionals for AI-assisted diagnosis and real-time communication. It offers patient and doctor portals, leveraging Google's Gemini AI models for intelligent medical analysis, preliminary diagnoses, and personalized wellness recommendations, all presented in Brazilian Portuguese. The platform's goal is to innovate healthcare delivery through advanced AI integration within a robust and user-friendly interface, aiming to improve accessibility and quality of medical consultations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**Framework**: Next.js 15 with App Router, TypeScript, and React Server Components.
**UI Components**: shadcn/ui with Radix UI, Tailwind CSS, featuring a futuristic dark theme with gradients, neon accents, glow effects, semi-transparent cards, animated backgrounds, and gradient text.
**Routing Structure**: Public, protected patient, and protected doctor routes with middleware-based authentication and role-based access control.

### Backend Architecture
**AI/ML Layer**: Google Genkit framework orchestrates specialized AI agents using Gemini models (Gemini 2.5 Flash) for domain-specific analysis, including text-to-speech integration and real-time consultation flows. The system employs 15+ specialist agents (e.g., Cardiologist, Pulmonologist), an Orchestrator AI (General Practitioner), and a "Central Brain" concept for intelligent coordination. Tool integration includes `medicalKnowledgeBaseTool`, `patientDataAccessTool`, `consultationHistoryAccessTool`, `doctorsListAccessTool`, and `internetSearchTool`.
**API Layer**: Next.js API routes (App Router) with server actions for mutations, RESTful endpoints for WebRTC signaling, and Server-Sent Events for real-time communication.
**Authentication & Session Management**: JWT-based sessions with `jose` library, bcrypt password hashing, and role-based middleware.

### Data Storage
**Primary Database**: Neon PostgreSQL, managed via Drizzle ORM.
**Data Model**: Includes tables for `patients`, `doctors`, `patientAuth`, `doctorAuth`, `exams`, `appointments`, `callRooms`, `signals`, and `consultations`. A `wellnessPlan` JSONB field stores personalized wellness programs.

### System Design Choices
- Migration to Neon PostgreSQL with Drizzle ORM for data management.
- JWT-based authentication with bcrypt hashing.
- Google Cloud Storage for file storage.
- Enhanced AI system with Gemini 2.5 Flash, including a "Central Brain" system with a 3D TalkingHead avatar using TalkingHead.js and Gemini 2.5 Flash TTS for realistic interactions.
- Call recording and transcription via Gemini AI.
- Server-side AI processing for medical data security.
- Implementation of an AI Nutritionist for personalized wellness plans, including dietary, exercise, and mental wellness components, with weekly recipes and tasks stored in a JSONB field.
- Integration of Tavus Conversational Video Interface (CVI) for live AI avatar consultations using Daily.co SDK, including automatic device detection and noise cancellation.
- AI Therapist Chat with voice support, allowing patients to interact with an AI therapist in a WhatsApp-style interface, providing therapeutic support and acting as a personal health assistant with access to patient medical history.
- Exam history visualization with interactive time-series graphs using Recharts, allowing patients to track their health metrics over time.
- Gamification features for doctors (XP, levels, badges).

### Tavus CVI Optimizations (October 2025)
**Implementation Pattern**: Full control using Daily JS SDK (not @tavus/cvi-ui) for custom UI.

**Core Optimizations**:
1. **Singleton Pattern** (`cvi-provider.tsx`):
   - Global Daily call object via `window._dailyCallObject`
   - Prevents multiple WebRTC connections
   - Automatic device detection (audioSource, videoSource)

2. **Lifecycle Stability** (`conversation.tsx`):
   - `useRef` pattern for `hasJoinedRef` to prevent re-join loops
   - Stable useEffect dependencies (only `daily`, `conversationUrl`)
   - Guards prevent multiple joins, cleanup only on unmount

3. **Noise Cancellation**:
   - Automatic activation via `updateInputSettings()` post-join
   - Processor type: 'noise-cancellation'
   - Graceful fallback for incompatible browsers

4. **Robust Event Listeners**:
   - participant-joined, participant-updated, participant-left
   - Named callback functions for proper cleanup
   - Detailed logging for debugging

5. **Enhanced Error Handling**:
   - Tavus credit detection ("out of conversational credits")
   - Permission-specific error messages (NotAllowedError, NotFoundError, etc.)
   - User-friendly Portuguese messages

**Technical Decisions**:
- Avoided @daily-co/daily-react hooks for participant state to prevent re-render loops
- Removed unstable props (`meetingState`, `onLeave`) from critical effect dependencies
- Used ref-based join tracking instead of state to maintain stability across renders

### Tavus Medical Context Integration (October 2025)
**Implementation**: AI avatar with complete patient medical history access for personalized consultations.

**Data Integration**:
1. **Patient Profile** - Name, age, gender, location, status, reported symptoms
2. **Medical Exams** - Complete exam history with:
   - Type, date, results, status (validated/pending)
   - Preliminary diagnosis and AI explanations
   - Laboratory values with reference ranges
   - Doctor notes and final explanations
3. **Consultation History** - Past consultations with:
   - Transcriptions and summaries
   - Date, type (video-call/chat)
   - Doctor involved
4. **Wellness Plan** - Current personalized plan:
   - Dietary recommendations
   - Exercise program
   - Mental wellness guidance
   - Daily reminders and weekly tasks

**Context Formatting** (`create-conversation/route.ts`):
- Structured markdown format for AI comprehension
- Hierarchical organization (Patient Info → Exams → Consultations → Wellness)
- Specific laboratory values and references included
- Complete history to enable contextual recommendations

**AI Avatar Capabilities**:
- Explains exam results in detail using actual patient data
- References specific laboratory values and diagnoses
- Correlates current symptoms with medical history
- Suggests follow-up exams based on trends
- Reinforces wellness plan recommendations
- Provides personalized health guidance in Portuguese

### UI Design Updates (October 2025)
**Live Consultation Banner** (Dashboard Overview):
- Video background using looping MP4 (`/ai-assistant-video.mp4`) with autoplay
- Purple/pink gradient overlay (40% opacity) for enhanced video visibility
- Removed icon-based indicators in favor of cinematic video presentation
- Enhanced visual hierarchy: large title (4xl/5xl), smaller supporting text (base)
- Badge-styled feature indicators with backdrop blur and semi-transparent backgrounds
- Vertical layout (flex-col) with content aligned to start
- Responsive design maintaining video aspect ratio across devices

**Live Consultation Interface** (Tavus CVI Screen):
- Same video background with 30% overlay for maximum video visibility
- White semi-transparent cards (80% opacity) with backdrop blur for content legibility
- Glassmorphism design pattern for modern aesthetic
- All states (waiting, connecting, active) use consistent visual treatment
- Enhanced shadows and rounded corners for depth perception

## External Dependencies

**AI/ML Services**:
- Google Gemini API (Gemini 2.0 Flash, Gemini 2.0 Flash Vision, Gemini 1.5 Pro, Gemini 2.5 Flash TTS)
- Google Genkit (AI orchestration framework)
- Tavus CVI (Conversational Video Interface for AI avatars)

**Cloud Services**:
- Google Cloud Storage

**Database**:
- Neon PostgreSQL

**Real-Time Communication**:
- WebRTC
- Simple-peer library
- Daily.co (for live video consultations)

**Development & Build Tools**:
- TypeScript
- Tailwind CSS
- Drizzle ORM
- `jose` library
- `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`, `postgres`