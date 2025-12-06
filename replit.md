# MediAI - AI-Powered Healthcare Platform

## Overview
MediAI is an AI-powered healthcare platform that connects patients with medical professionals for AI-assisted diagnosis and real-time communication. It features patient and doctor portals, utilizing Google's Gemini AI models for intelligent medical analysis, preliminary diagnoses, and personalized wellness recommendations, all presented in Brazilian Portuguese. The platform aims to provide hospital-grade preliminary diagnoses with specific medication recommendations, exact dosages, treatment protocols, monitoring guidelines, and contraindications.

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
- **UI/UX**: Futuristic dark theme, live consultation banner, minimalist consultation interfaces, and visual display for specialist findings. Includes gamification for doctors.
- **AI Enhancements**: Enhanced AI system with Gemini 2.5 Flash for medical analysis and consultations, including call recording and transcription. Server-side AI processing ensures medical data security. Implementation of an AI Nutritionist for personalized wellness plans.
- **Real-time Communication**: LiveKit for WebRTC, with automatic device detection and noise cancellation.
- **AI Consultations**: LiveKit + Avatar Providers (Tavus/BEY) + Gemini Architecture for production-grade real-time consultations with vision capabilities. This involves a Python agent orchestrating Google Gemini API for STT, LLM, and TTS, configurable avatar integration, and Gemini Vision API for visual patient analysis. A unified voice system ("Aoede" voice, female, pt-BR) is used across all audio generations. The AI can see the patient through their camera and describe their appearance when asked.
  - **AI Vision Modes**: Supports both on-demand and continuous streaming vision capabilities.
- **AI Therapist Chat**: Bidirectional voice chat with WhatsApp-style audio features and voice support.
- **Wellness Audio Persistence**: TTS audio for wellness plan sections is generated once and stored, regenerating only upon plan updates to reduce costs.
- **Medical Analysis**: A multi-specialist medical analysis system with sequential file processing:
  - **Individual Analysis Phase**: Each uploaded exam document is analyzed separately with real-time progress tracking.
  - **Consolidation Phase**: After all files are processed, analyses are combined and sent to 15+ specialist AI agents coordinated by an orchestrator AI.
  - **Wellness Plan Generation**: The wellness plan is only generated after successful consolidation.
- **Data Visualization**: Exam history visualization with interactive time-series graphs using Recharts.
- **Admin System**: Comprehensive admin panel for platform oversight, including user management, exam review, consultation monitoring, resource usage tracking, and platform settings configuration (e.g., avatar provider selection, custom patient quota, PIX payment toggle).
- **Email Verification**: System for patient and doctor email verification with unique CPF/CRM validation and secure token-based verification.
- **Subscription Management**: Integrated Stripe for handling subscription plans (Trial, Basic, Premium) with usage-based tiers, secure payment processing, and webhook integration. Includes 7-day free trial, plan migration support (Básico ↔ Premium with automatic proration), and dual payment methods (Card via Stripe and PIX via EBANX partnership).
- **Security & Monitoring**: Implemented comprehensive security headers, Sentry for error tracking, structured logging, and usage tracking.
- **Performance Optimization**: In-memory cache layer, generic pagination system, optimized image components.
- **Real-Time Notifications**: Server-Sent Events (SSE) system for real-time notifications of exam results, appointments, and alerts.
- **Data Export & LGPD**: Patient data export system supporting JSON and HTML formats for LGPD compliance. Includes a comprehensive LGPD Security Audit System with user activity logs, consent records, data access logs, and security incident management.
- **Appointment Scheduling**: Intelligent scheduling system with conflict detection, availability checking, and slot management.
- **Advanced Search**: Multi-entity search system with filters for patients, doctors, and exams, integrated with pagination.

## External Dependencies

### AI/ML Services
- Google Gemini API (Gemini 2.5 Flash)
- Google Genkit (AI orchestration framework)
- Tavus CVI (Conversational Video Interface for AI avatars)
- Beyond Presence (BEY) - Hyper-realistic virtual avatar alternative

### Cloud Services
- Cloudinary (avatar and media file storage)
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
- EBANX (PIX payment processing in Brazil for Stripe)

### Email & Notifications
- Resend (transactional email service)

### Monitoring
- Sentry (for error tracking and performance monitoring)