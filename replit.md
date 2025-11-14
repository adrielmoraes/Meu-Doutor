# MediAI - AI-Powered Healthcare Platform

## Overview
MediAI is an AI-powered healthcare platform designed to connect patients with medical professionals for AI-assisted diagnosis and real-time communication. It offers both patient and doctor portals, leveraging Google's Gemini AI models for intelligent medical analysis, preliminary diagnoses, and personalized wellness recommendations, all presented in Brazilian Portuguese. The platform aims to innovate healthcare delivery by integrating advanced AI within a robust, user-friendly interface, enhancing the accessibility and quality of medical consultations. The business vision is to provide hospital-grade preliminary diagnoses with specific medication recommendations, exact dosages, treatment protocols, monitoring guidelines, and contraindications, transforming general advice into actionable clinical guidance.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### November 14, 2025 - Gemini Model Migration to Stable Version
- **Migrated all Gemini models to gemini-2.5-flash** - Replaced experimental gemini-2.0-flash-exp and deprecated gemini-1.5-flash with stable gemini-2.5-flash
- **Updated 15+ files across frontend and backend** - Systematically updated all Gemini API calls throughout the codebase
- **Fixed quota issues** - Resolved free tier quota limitations by switching from experimental model (limit: 0 RPM) to stable version (10 RPM, 250K TPM)
- **Tested model compatibility** - Verified gemini-2.5-flash and gemini-2.0-flash work with current API key
- **Updated LiveKit agent** - Migrated Python agent to use gemini-2.5-flash for Realtime API (STT, LLM, TTS, Vision)
- **All systems updated** - Chat therapist, speech-to-text, text-to-speech, medical analysis, and consultation flows now use stable model

### November 12, 2025 - LiveKit Connection Performance Optimization Complete
- **Implemented LiveKit warmup system** - Pre-fetches connection token in background when patient enters dashboard, enabling instant consultation start
- **Thread-safe token caching** - 5-minute cache with proactive 1-minute pre-expiration refresh and concurrent request protection
- **Visual feedback system** - Dashboard displays "Conexão preparada – início instantâneo garantido" when warmup completes
- **Optimized connection settings** - Enabled adaptive stream, dynacast, and optimized reconnect policies for faster connection
- **Removed artificial delays** - Eliminated unnecessary waits and streamlined connection flow
- **Performance verified** - Logs confirm single token fetch, successful caching, and instant connection on consultation entry

### November 12, 2025 - Avatar Upload Fixed & Email Verification System Complete
- **Fixed avatar upload system** - Migrated from local filesystem to Cloudinary cloud storage to support Vercel serverless environment
- **Fixed email verification** - Corrected token persistence issue by standardizing function signatures between patient and doctor registration
- **Fixed contact data persistence** - Resolved bug where phone, city, and state weren't being saved during patient registration
- **Removed database transactions** - Adapted code to work with neon-http driver limitations using sequential operations with manual rollback
- **Aligned TypeScript types** - Expanded schema icon unions and added weeklyTasks to eliminate all LSP errors
- **All systems tested and working** - Comprehensive test suite validates registration, verification, and avatar upload flows

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
- **AI Enhancements**: Enhanced AI system with Gemini 2.5 Flash for medical analysis and consultations, including call recording and transcription via Gemini AI. Server-side AI processing ensures medical data security. Implementation of an AI Nutritionist for personalized wellness plans.
- **Real-time Communication**: LiveKit for WebRTC, Daily.co SDK for Tavus CVI integration, with automatic device detection and noise cancellation.
- **AI Consultations**: LiveKit + Avatar Providers (Tavus/BEY) + Gemini Architecture for production-grade real-time consultations with vision capabilities. This involves a Python agent orchestrating Google Gemini API for STT, LLM, and TTS, configurable avatar integration (Tavus or Beyond Presence selected via admin panel), and Gemini Vision API for visual patient analysis. A unified voice system ("Aoede" voice, female, pt-BR) is used across all audio generations. The AI can see the patient through their camera and describe their appearance when asked. **Avatar Provider Configuration**: Admins can select between Tavus and Beyond Presence (BEY) avatar providers through the admin panel settings, with the choice stored in the database and automatically applied to all new consultations.
- **AI Therapist Chat**: Bidirectional voice chat with WhatsApp-style audio features and voice support.
- **Medical Analysis**: A multi-specialist medical analysis system where exam uploads trigger parallel consultation with up to 15 specialist AI agents, coordinated by an orchestrator AI. This provides deep domain-specific analysis with complete traceability, returning structured data including suggested medications, treatment plans, monitoring protocols, contraindications, and relevant metrics. The orchestrator synthesizes this into an integrated medication plan and detailed recommendations.
- **Data Visualization**: Exam history visualization with interactive time-series graphs using Recharts.
- **Admin System**: Comprehensive admin panel for platform oversight, including user management, exam review, consultation monitoring, resource usage tracking, and platform settings configuration. Features include secure login, audit logging, email notifications for key events, and **avatar provider selection** (Tavus vs Beyond Presence) for AI consultations.
- **Email Verification**: System for patient and doctor email verification with unique CPF/CRM validation and secure token-based verification.
- **Subscription Management**: Integrated Stripe for handling subscription plans (Trial, Basic, Premium, Family) with usage-based tiers, secure payment processing, and webhook integration. Includes a 7-day free trial.
- **Security & Monitoring**: Implemented comprehensive security headers (CSP, X-Frame-Options, etc.), Sentry for error tracking, structured logging, and usage tracking for resource consumption per patient.
- **Performance Optimization**: In-memory cache layer with TTL/LRU eviction, generic pagination system with offset and cursor support, optimized image components with lazy loading.
- **Real-Time Notifications**: Server-Sent Events (SSE) system for real-time notifications of exam results, appointments, and alerts.
- **Data Export & LGPD**: Patient data export system supporting JSON and HTML formats for LGPD compliance (data portability rights).
- **Appointment Scheduling**: Intelligent scheduling system with conflict detection, availability checking, and slot management to prevent double-bookings.
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
- SendGrid (optional, as an alternative email provider)

### Monitoring
- Sentry (for error tracking and performance monitoring)