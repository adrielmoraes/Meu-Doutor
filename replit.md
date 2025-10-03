# MediAI - AI-Powered Healthcare Platform

## Overview

MediAI is a comprehensive healthcare platform that connects patients with medical professionals through AI-assisted diagnosis and real-time communication. The platform features two distinct portals: one for patients to interact with AI assistants, upload medical exams, and track their health journey; and another for doctors to review AI-generated analyses, validate diagnoses, and manage patient care.

The system leverages Google's Gemini AI models to provide intelligent medical analysis, preliminary diagnoses through specialist agent coordination, and personalized wellness recommendations. All AI interactions are conducted in Brazilian Portuguese.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 3, 2025 - Major AI System Upgrade to Gemini 2.5 Flash with Enhanced Specialist Agents
- **AI Model Upgrade**: Migrated entire AI system from Gemini 2.0 Flash to Gemini 2.5 Flash (gemini-2.0-flash-exp)
  - Updated default model in genkit.ts configuration
  - Improved performance, accuracy, and clinical reasoning capabilities
- **Enhanced Specialist Agent Schemas**: Comprehensive structured output system
  - Added `findings`: Detailed clinical findings specific to each specialty
  - Added `clinicalAssessment`: Standardized severity classification (normal/mild/moderate/severe/critical/Not Applicable)
  - Added `recommendations`: Actionable specialty-specific recommendations
  - Added optional `relevantMetrics`: Structured clinical metrics for data analysis
- **Completely Overhauled All 15 Specialist Agent Prompts**:
  - Professional identities with full credentials (e.g., "Dra. Ana Silva, MD, PhD - Board-Certified Cardiologist")
  - Comprehensive clinical assessment frameworks specific to each specialty
  - Detailed indicator checklists for thorough analysis
  - Explicit JSON output format instructions to ensure schema compliance
  - Clear rules for handling missing data to prevent AI hallucinations
  - Specialists: Cardiologist, Pulmonologist, Radiologist, Neurologist, Gastroenterologist, Endocrinologist, Dermatologist, Orthopedist, Ophthalmologist, Otolaryngologist, Nutritionist, Pediatrician, Gynecologist, Urologist, Psychiatrist
- **Improved Orchestrator Prompts**:
  - Enhanced triage system for intelligent specialist selection
  - Better synthesis logic integrating findings from multiple specialists
  - Clinical integration principles for comprehensive diagnostic summaries
- **System Robustness**: All prompts now include absolute final instructions ensuring bare JSON output without markdown fences or extraneous text

### October 3, 2025 - Enhanced AI "Central Brain" System with Avatar Support
- **AI Tools Enhancement**:
  - Added `consultationHistoryAccessTool`: AI can now access and learn from previous consultation transcriptions and summaries
  - Added `doctorsListAccessTool`: AI can search and recommend doctors from the platform by specialty
  - Updated AI prompts to position MediAI as the "central AI brain" coordinating patient care
- **Realistic Avatar System** (In Progress):
  - Created `RealisticAvatar` component with support for 3D avatars and D-ID integration
  - UI integration in patient consultation interface with avatar type/gender controls
  - Audio playback management for TTS responses
  - **Next Steps**: Full implementation requires:
    - TalkingHead.js library integration for 3D lip-sync (open-source)
    - OR D-ID API integration for realistic photo-to-video avatars (commercial)
    - See AVATAR_IMPLEMENTATION.md for detailed instructions
- **Call Recording & Transcription**:
  - Audio recording system in VideoCall component using MediaRecorder and AudioContext
  - Automatic transcription and summarization via Gemini AI after calls end
  - Storage in Firestore (callRooms, patient consultations, doctor summaries)

### October 3, 2025 - Migration from Vercel to Replit
- **Deployment Platform**: Migrated from Vercel to Replit for development and hosting
- **Server Configuration**: Updated Next.js dev server to bind to port 5000 (0.0.0.0) for Replit proxy compatibility
- **Database Addition**: Added Neon PostgreSQL database via Replit's built-in database service
  - Environment variables automatically configured: DATABASE_URL, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, PGHOST
  - Available as optional storage layer alongside existing Firestore
- **Removed Configurations**: Removed Vercel-specific `allowedDevOrigins` from next.config.ts

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15 with App Router pattern
- Server-side rendering for optimal performance
- TypeScript for type safety across the application
- React Server Components for reduced client-side JavaScript

**UI Components**: shadcn/ui with Radix UI primitives
- Consistent design system with Tailwind CSS
- Accessible, reusable component library
- Custom theme supporting light/dark modes with medical-friendly color palette (deep blues, teals)

**Routing Structure**:
- Public routes: Landing page (`/`), login (`/login`), registration (`/register`)
- Patient portal: Protected routes under `/patient/*`
- Doctor portal: Protected routes under `/doctor/*`
- Middleware-based authentication and role-based access control

### Backend Architecture

**AI/ML Layer**: Google Genkit framework with Gemini models
- Multiple specialized AI agents (cardiologist, neurologist, radiologist, etc.) for domain-specific analysis
- Orchestration flow that coordinates specialist agents for comprehensive diagnosis
- Text-to-speech integration for accessibility
- Real-time consultation flow supporting audio/video interactions

**AI Agent System**:
- **Specialist Agents**: 15+ domain-specific agents (cardiology, pulmonology, radiology, neurology, gastroenterology, endocrinology, dermatology, orthopedics, ophthalmology, otolaryngology, nutrition, pediatrics, gynecology, urology, psychiatry)
- **Orchestrator Pattern**: General practitioner AI coordinates specialist consultations
- **Central Brain Concept**: MediAI AI acts as intelligent coordinator connecting patients with right care
- **Tool Integration**:
  - `medicalKnowledgeBaseTool`: Medical terminology and condition lookups
  - `patientDataAccessTool`: Access patient medical records and exam results
  - `consultationHistoryAccessTool`: Review previous consultation summaries/transcriptions
  - `doctorsListAccessTool`: Search and recommend doctors by specialty
  - `internetSearchTool`: Up-to-date medical information

**API Layer**: Next.js API routes (App Router)
- Server actions for secure data mutations
- RESTful endpoints for WebRTC signaling
- Server-Sent Events for real-time communication

**Authentication & Session Management**:
- JWT-based sessions with jose library
- Separate authentication collections for patients and doctors
- bcrypt password hashing (10 rounds)
- Role-based middleware protection

### Data Storage

**Primary Database**: Cloud Firestore (NoSQL)
- Document-based structure optimized for healthcare data
- Real-time synchronization capabilities
- Offline persistence enabled for client applications

**Data Model**:
- `patients` collection: Patient demographics, medical history, conversation logs
- `doctors` collection: Doctor profiles, specialties, gamification metrics (XP, levels, badges)
- `patientAuth` & `doctorAuth`: Separated authentication credentials
- Subcollections: `exams` (nested under patients), `appointments`
- `callRooms`: WebRTC session management with signal subcollections

**Firebase Admin SDK**: Server-side Firestore operations
- Service account authentication via environment variables
- Secure data access patterns with admin privileges

### External Dependencies

**AI/ML Services**:
- Google Gemini API (multiple models):
  - Gemini 2.0 Flash: Chat, analysis, summaries
  - Gemini 2.0 Flash (Vision): Medical exam image analysis
  - Gemini 1.5 Pro: Advanced reasoning for live consultations
  - Gemini 2.5 Flash TTS: Text-to-speech synthesis
- Google Genkit: AI orchestration framework

**Cloud Services**:
- Firebase/Firestore: Primary database
- Firebase Admin SDK: Backend authentication and data access
- Google Cloud Storage: File storage (configured, usage via @google-cloud/storage)

**Real-Time Communication**:
- WebRTC: Peer-to-peer video/audio calls between patients and doctors
- Simple-peer library: WebRTC abstraction
- Firebase Firestore: Signaling server for WebRTC connection establishment

**Development & Build Tools**:
- TypeScript compiler with strict mode
- Tailwind CSS for styling
- ESLint (disabled during builds for flexibility)
- dotenv for environment configuration

**Key Environment Variables Required**:
- `GEMINI_API_KEY`: Google AI API authentication
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase Admin SDK credentials (JSON)
- `JWT_SECRET`: Session token signing key
- `NEXT_PUBLIC_FIREBASE_*`: Client-side Firebase configuration

**API Integrations**:
- Medical knowledge base tool (internal)
- Internet search capability for up-to-date medical information
- Patient data access tool for contextual AI responses

**Notable Design Decisions**:
- Separation of authentication data from user profiles for security
- Multi-agent AI architecture allows specialized, accurate medical analysis
- WebRTC signaling through Firestore eliminates need for dedicated signaling server
- Server-side AI processing keeps sensitive medical data secure
- Per-exam validation workflow rather than patient-level status
- Gamification for doctors (XP, levels, badges) to encourage platform engagement