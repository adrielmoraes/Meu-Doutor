# MediAI - AI-Powered Healthcare Platform

## Overview
MediAI is an AI-powered healthcare platform that connects patients with medical professionals for AI-assisted diagnosis and real-time communication. It features both patient and doctor portals, utilizing Google's Gemini AI models for intelligent medical analysis, preliminary diagnoses, and personalized wellness recommendations, all presented in Brazilian Portuguese. The platform aims to provide hospital-grade preliminary diagnoses with specific medication recommendations, exact dosages, treatment protocols, monitoring guidelines, and contraindications, transforming general advice into actionable clinical guidance.

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
- **UI/UX**: Futuristic dark theme, live consultation banner with video backgrounds, minimalist consultation interfaces, and visual display for specialist findings. Includes gamification features for doctors.
- **AI Enhancements**: Enhanced AI system with Gemini 2.5 Flash for medical analysis and consultations, including call recording and transcription. Server-side AI processing ensures medical data security. Implementation of an AI Nutritionist for personalized wellness plans.
- **Real-time Communication**: LiveKit for WebRTC, with automatic device detection and noise cancellation.
- **AI Consultations**: LiveKit + Avatar Providers (Tavus/BEY) + Gemini Architecture for production-grade real-time consultations with vision capabilities. This involves a Python agent orchestrating Google Gemini API for STT, LLM, and TTS, configurable avatar integration (Tavus or Beyond Presence selected via admin panel), and Gemini Vision API for visual patient analysis. A unified voice system ("Aoede" voice, female, pt-BR) is used across all audio generations. The AI can see the patient through their camera and describe their appearance when asked.
- **AI Therapist Chat**: Bidirectional voice chat with WhatsApp-style audio features and voice support.
- **Wellness Audio Persistence**: TTS audio for wellness plan sections (dietary, exercise, mental) is generated once and stored in the database. Audio is only regenerated when the wellness plan is updated from new exam submissions, reducing TTS costs.
- **Medical Analysis**: A multi-specialist medical analysis system where exam uploads trigger parallel consultation with up to 15 specialist AI agents, coordinated by an orchestrator AI. This provides deep domain-specific analysis with complete traceability, returning structured data including suggested medications, treatment plans, monitoring protocols, contraindications, and relevant metrics.
- **Data Visualization**: Exam history visualization with interactive time-series graphs using Recharts.
- **Admin System**: Comprehensive admin panel for platform oversight, including user management, exam review, consultation monitoring, resource usage tracking, and platform settings configuration. Features include secure login, audit logging, email notifications, avatar provider selection for AI consultations, and custom patient quota management allowing admins to override default plan limits on a per-patient basis.
- **Email Verification**: System for patient and doctor email verification with unique CPF/CRM validation and secure token-based verification.
- **Subscription Management**: Integrated Stripe for handling subscription plans (Trial, Basic, Premium, Family) with usage-based tiers, secure payment processing, and webhook integration. Includes a 7-day free trial.
- **Security & Monitoring**: Implemented comprehensive security headers, Sentry for error tracking, structured logging, and usage tracking for resource consumption per patient.
- **Performance Optimization**: In-memory cache layer, generic pagination system, optimized image components.
- **Real-Time Notifications**: Server-Sent Events (SSE) system for real-time notifications of exam results, appointments, and alerts.
- **Data Export & LGPD**: Patient data export system supporting JSON and HTML formats for LGPD compliance.
- **LGPD Security Audit System**: Comprehensive security audit system compliant with LGPD (Articles 46 & 48) including:
  - **User Activity Logs** (`user_activity_logs`): Tracks login, logout, profile updates, data access, and other critical actions
  - **Consent Records** (`consent_records`): Records user consent for privacy policy, terms of service, data processing, and marketing
  - **Data Access Logs** (`data_access_logs`): Tracks who accessed patient data, what data was accessed, and for what purpose
  - **Security Incidents** (`security_incidents`): Records and manages security incidents with ANPD reporting support
  - **Admin API** (`/api/admin/security-audit`): Provides statistics, logs, and incident management for administrators
- **Appointment Scheduling**: Intelligent scheduling system with conflict detection, availability checking, and slot management.
- **Advanced Search**: Multi-entity search system with filters for patients, doctors, and exams, integrated with pagination.

## External Dependencies

### AI/ML Services
- Google Gemini API (Gemini 2.5 Flash - stable model used throughout platform)
- Google Genkit (AI orchestration framework)
- Tavus CVI (Conversational Video Interface for AI avatars)
- Beyond Presence (BEY) - Hyper-realistic virtual avatar alternative

### Cloud Services
- Cloudinary (avatar and media file storage for patients and doctors)
- LiveKit Cloud

### Database
- Neon PostgreSQL

### Real-Time Communication
- WebRTC (LiveKit infrastructure)
- LiveKit Python Agents
- LiveKit Plugins: google (STT/LLM/TTS), tavus (avatar), silero (VAD)

### Development & Build Tools
- TypeScript
- Tailwind CSS
- Drizzle ORM
- `jose` library

### Payment & Subscription
- Stripe (payment processing and subscription management)

### Email & Notifications
- Resend (transactional email service for admin notifications and email verification)

### Monitoring
- Sentry (for error tracking and performance monitoring)

## AI Pricing Configuration (December 2025 - Updated)

### Gemini Models - LLM (per 1M tokens)
Official pricing from Google AI Studio

| Model | Input | Output |
|-------|-------|--------|
| Gemini 3 Pro Preview | $2.00 (≤200K) / $4.00 (>200K) | $12.00 (≤200K) / $18.00 (>200K) |
| Gemini 2.5 Pro | $1.25 (≤200K) / $2.50 (>200K) | $10.00 (≤200K) / $15.00 (>200K) |
| Gemini 2.5 Flash | $0.30 | $2.50 |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 |
| Gemini 2.0 Flash | $0.10 | $0.40 |
| Gemini 2.0 Flash-Lite | $0.075 | $0.30 |

### Gemini 2.5 Flash Native Audio (Live API)
For real-time voice consultations with natural voice
- **Text Input**: $0.50 per 1M tokens
- **Text Output**: $12.00 per 1M tokens
- **Audio/Video Input (STT)**: $3.00 per 1M tokens
- **Audio/Video Output (TTS)**: $2.00 per 1M tokens

### TTS Models (per 1M tokens)
| Model | Input | Output |
|-------|-------|--------|
| Gemini 2.5 Pro Preview TTS | $1.00 | $20.00 |
| Gemini 2.5 Flash Preview TTS | $0.50 | $10.00 |

### Image Generation Models
| Model | Text Input | Text Output | Image Output |
|-------|------------|-------------|--------------|
| Gemini 3 Pro Image Preview | $2.00/1M | $12.00/1M | $0.134/image |
| Gemini 2.5 Flash Image | $0.30/1M | $2.50/1M | $0.039/image |

### Avatar Providers (per minute)
- **BeyondPresence**: $0.175
- **Tavus CVI**: $0.10 (estimated)

### LiveKit (estimated per participant)
- **Video**: $0.004 per minute
- **Audio**: $0.001 per minute

### Cost Display
- AI costs are visible only in the Admin Dashboard
- Patients see usage limits (minutes/exams) without cost details