# MediAI - AI-Powered Healthcare Platform

## Overview
MediAI is an AI-powered healthcare platform that connects patients with medical professionals for AI-assisted diagnosis and real-time communication. It features both patient and doctor portals, utilizing Google's Gemini AI models for intelligent medical analysis, preliminary diagnoses, and personalized wellness recommendations, all presented in Brazilian Portuguese. The platform aims to provide hospital-grade preliminary diagnoses with specific medication recommendations, exact dosages, treatment protocols, monitoring guidelines, and contraindications, transforming general advice into actionable clinical guidance.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (December 6, 2025)

### AI Vision - Continuous Streaming Architecture
- **Refactored from on-demand to continuous streaming**: Removed `look_at_patient` function tool
- **New streaming methods**:
  - `start_video_streaming(participant)`: Auto-starts when patient connects with camera
  - `_video_loop(video_track)`: Processes frames with 4-second rate limiting (15 frames/min max)
  - `_send_frame_to_session(frame_bytes)`: Sends frames to active Gemini session
- **Pure Python YUV conversion**: Added `_convert_i420_to_rgb_pure()` and `_convert_nv12_to_rgb_pure()` to avoid SIGILL crashes
  - Uses pure Python math (no SIMD/AVX instructions)
  - Downsamples to 1/4 resolution for performance
- **SIGILL prevention**: Avoids `frame.convert()` which uses native libs with AVX instructions
  - Directly interprets frame data based on `frame.type`
  - Supports RGBA, RGB24, BGRA, I420, NV12 formats
- **Event listeners**: `participant_connected` and `track_subscribed` auto-trigger streaming
- **System prompt updated**: Reflects always-on vision capability
- **ENABLE_VISION_STREAMING toggle**: New environment variable to control video streaming separately
  - Default: `false` to prevent SIGILL crashes on CPUs without AVX support
  - Set to `true` only on infrastructure with AVX-capable CPUs
  - When disabled, agent works normally but without visual patient observation

## Previous Changes (December 5, 2025)

### Camera Capture & Exam Upload
- **Enhanced camera capture screen**: Full-screen camera preview (80% viewport height) on mobile for better visibility of exam documents
- **Improved image previews**: Exam photos now display at 192-224px height (increased from 128px) with click-to-enlarge modal for detailed viewing

### Subscription & Payment System
- **Plan migration enabled**: Users can now migrate between Básico and Premium plans mid-cycle
  - Uses Stripe `proration_behavior: 'create_prorations'` for automatic credit/charge calculations
  - Migration handled via `/api/stripe/checkout` with automatic plan updates
  - Special handling for local trial subscriptions → auto-create new Stripe customer
- **PIX payment support**: Added PIX as payment method alongside credit cards (via Stripe + EBANX partnership)
  - Users can choose between: Cartão (card only), PIX (instant transfer), or Ambos (both available)
  - Payment method selection modal for migration and new subscriptions
  - Implementation: `paymentMethod` parameter in checkout session with support for `['card', 'pix']` or `['pix']`
- **Admin control for PIX**: New admin dashboard toggle to enable/disable PIX payment method
  - Location: Admin Settings → Configurações de Pagamento
  - Database: `platform_settings` table stores PIX enable/disable state
  - API: `/api/admin/payment-settings` endpoint
  - When disabled, PIX option never shows to users (even if selected, forces 'card' method)
  - Users automatically fall back to card payments when PIX is disabled

### AI Vision Configuration
- **Gemini Vision enabled**: Created `livekit-agent/.env` with `ENABLE_VISION=true`
  - Allows AI Avatar to see patient via camera during consultations
  - Can describe patient appearance when asked

### Trial Subscription Fix
- **Automatic Stripe customer creation**: When patient registers, automatic customer creation in Stripe (not local)
  - Ensures all customers have valid Stripe IDs from registration
  - Trial subscriptions created directly in Stripe with 7-day auto-cancel
  - Fallback to local trial if Stripe fails (prevents broken registration)

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
- **Medical Analysis**: A multi-specialist medical analysis system with **sequential file processing**:
  - **Individual Analysis Phase**: Each uploaded exam document is analyzed separately with real-time progress tracking (pending → analyzing → completed/error status per file)
  - **Consolidation Phase**: After all files are processed, analyses are combined and sent to 15+ specialist AI agents coordinated by an orchestrator AI
  - **Wellness Plan Generation**: The wellness plan is only generated after successful consolidation
  - This provides deep domain-specific analysis with complete traceability, returning structured data including suggested medications, treatment plans, monitoring protocols, contraindications, and relevant metrics
  - The sequential approach prevents timeout issues and provides better user experience with visual feedback per file
- **Data Visualization**: Exam history visualization with interactive time-series graphs using Recharts.
- **Admin System**: Comprehensive admin panel for platform oversight, including user management, exam review, consultation monitoring, resource usage tracking, and platform settings configuration. Features include secure login, audit logging, email notifications, avatar provider selection for AI consultations, and custom patient quota management allowing admins to override default plan limits on a per-patient basis.
- **Email Verification**: System for patient and doctor email verification with unique CPF/CRM validation and secure token-based verification.
- **Subscription Management**: Integrated Stripe for handling subscription plans (Trial, Basic, Premium) with usage-based tiers, secure payment processing, and webhook integration. Includes:
  - 7-day free trial
  - Plan migration support (Básico ↔ Premium with automatic proration)
  - Dual payment methods: Cartão de Crédito (via Stripe) and PIX (via EBANX partnership)
  - User-selectable payment method during checkout
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
- EBANX (PIX payment processing in Brazil for Stripe)

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