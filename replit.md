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

### Payment & Subscription
- Stripe (payment processing and subscription management)

### Email & Notifications
- Resend (transactional email service for admin notifications)

## Admin Access

### Default Admin Credentials
- **Email**: admin@mediai.com
- **Password**: admin123
- **Access**: Navigate to `/login` and enter the credentials above
- **Admin Panel**: After login, you'll be redirected to `/admin`

### Admin Features
- **Dashboard**: Overview of platform statistics (patients, doctors, exams, consultations)
- **Patient Management**: View and manage all patient records
- **Doctor Management**: View and manage all doctor profiles
- **Exam Management**: View all submitted exams and their AI analysis results
- **Consultation Management**: Monitor all consultation sessions
- **Usage Tracking**: Real-time monitoring of resource consumption per patient (tokens, call duration, costs)
- **Global Search**: Search across all platform data
- **Settings**: Platform configuration with 4 sections:
  - Security: Password management and session info
  - Database: Real-time stats and health monitoring
  - Notifications: Email alerts configuration
  - General: Platform info and system limits

### Creating Additional Admins
Run the script: `npx tsx scripts/create-admin.ts`

## Recent Changes

### October 25, 2025 (Latest Update)
- **Enhanced Login UX** (✅ COMPLETE):
  - Added show/hide password toggle on login page with eye icon
  - Improved user experience with better password visibility control
  
- **Usage Tracking System** (✅ PRODUCTION READY):
  - **Database Schema**: 
    - Created `usage_tracking` table to monitor patient resource consumption
    - Tracks: exam analysis, STT/LLM/TTS tokens, AI call time, doctor call time, chat usage
  - **Admin Dashboard**:
    - New "Uso de Recursos" page at `/admin/usage`
    - Real-time monitoring of token usage per patient
    - Detailed breakdown of resource consumption by type
    - Cost estimation for API usage
    - Summary cards showing total tokens, call duration, exams, and costs
  - **Database Functions**:
    - `trackUsage()`: Record resource consumption events
    - `getPatientUsageStats()`: Get usage statistics for a specific patient
    - `getAllPatientsUsageStats()`: Get usage stats for all patients
  - **TypeScript Types**: `UsageTracking`, `PatientUsageStats`
  
- **Avatar Upload Fix** (✅ COMPLETE):
  - Fixed patient and doctor avatar upload functionality
  - Replaced Google Cloud Storage dependency with local file storage
  - Avatars now saved to `public/avatars/patients/` and `public/avatars/doctors/`
  - No external cloud credentials required

- **Admin Notifications & Audit System** (✅ PRODUCTION READY):
  - **Database Schema**: 
    - Created `admin_settings` table with all configuration fields (platform info, limits, notification preferences)
    - Created `audit_logs` table for complete change tracking with IP, User Agent, and detailed change history
  - **Email Integration**:
    - Resend integration fully configured and connected
    - Email notification service (`src/lib/admin-notification-service.ts`) with professional HTML templates
    - Support for 6 notification types: new patient, new doctor, new exam, new consultation, system alerts, weekly reports
    - Smart filtering based on admin notification preferences
  - **Settings Persistence**:
    - All admin settings now save to and load from database automatically
    - Real-time feedback with loading states, success/error messages
    - `getSettings()`, `updateGeneralSettings()`, and `updateNotificationSettings()` server actions
  - **Audit Logging**:
    - Automatic tracking of all configuration changes
    - Logs include: admin info, action type, entity affected, before/after values, IP address, User Agent
    - Database adapter functions: `createAuditLog()`, `getAuditLogs()`, `getAuditLogsByAdmin()`, `getAuditLogsByAction()`
  - **Documentation**: Complete guide created in `ADMIN_NOTIFICATIONS_GUIDE.md`
  - **Security**: All changes tracked with IP and User Agent for accountability

### October 24, 2025
- **Admin System** (✅ PRODUCTION READY):
  - Created default admin user with credentials (admin@mediai.com / admin123)
  - Enhanced login system to support admin authentication
  - Admin panel fully functional with complete platform oversight
  - Database tables: `admins` and `adminAuth` with JWT-based session management
  - Admin layout with sidebar navigation and role-based access control
  - Script available: `scripts/create-admin.ts` for creating additional admins
  - Fixed trial period display from "5 dias" to "7 dias" on homepage and subscription page
  - Optimized subscription page layout to display all 4 plans (Trial, Básico, Premium, Familiar)
  - **Admin Settings Page** (✅ COMPLETE):
    - **Security Settings**: Change admin password, view session info (7-day timeout)
    - **Database Settings**: Live statistics dashboard with patient/doctor/exam/consultation counts, table health monitoring
    - **Notification Settings**: Configure email notifications for new patients, doctors, exams, consultations, system alerts, and weekly reports
    - **General Settings**: Platform info (name, description, support email), system limits (max file size, session timeout), theme configuration
    - Server actions: `changeAdminPassword` for secure password updates with bcrypt validation
    - All settings pages use responsive cards with futuristic dark theme (cyan/purple/green/orange gradients)

### October 21, 2025
- **Email Verification System** (✅ PRODUCTION READY):
  - Unique CPF validation for patients (prevents duplicate registrations)
  - Unique CRM validation for doctors (prevents duplicate registrations)
  - Email verification flow with 24-hour token expiration
  - Beautiful email template with gradient design matching platform theme
  - Support for Resend and SendGrid email providers
  - Fallback logging when no email service is configured
  - Database fields: `emailVerified`, `verificationToken`, `tokenExpiry` for both patients and doctors
  - Verification endpoint: `/api/verify-email`
  - Verification page: `/verify-email?token=<token>&type=<patient|doctor>`
  - CRM field added to doctors table with unique constraint
  - Email service: `src/lib/email-service.ts` with token generation and email sending
  - Note: Email service requires `RESEND_API_KEY` or `SENDGRID_API_KEY` to send emails

### October 20, 2025
- **Stripe Subscription System** (✅ PRODUCTION READY):
  - Complete subscription infrastructure with trial period and three usage-based pricing tiers:
    * **Teste Grátis (7 dias)**: Chat terapeuta ilimitado, 5 análises de exames, 5 min consulta IA, sem cartão de crédito
    * **Básico R$97,90/mês**: Chat terapeuta ilimitado, 20 análises de exames/mês, 5 min consulta IA/mês, sem consulta médico real
    * **Premium R$197,90/mês**: Chat terapeuta ilimitado, análise exames ilimitada, 30 min consulta IA/mês, 30 min consulta médico/mês
    * **Família R$297,90/mês**: Tudo do Premium para até 4 membros da família (economia de R$49,16/mês)
  - Secure payment processing with Stripe Checkout and webhook integration
  - Database schema: `subscription_plans`, `subscriptions`, `payments` tables with proper enums and relations
  - API routes: `/api/stripe/checkout`, `/api/stripe/webhook`, `/api/stripe/cancel-subscription`, `/api/stripe/resume-subscription`, `/api/subscription/status`
  - Patient-facing pages: subscription management with usage limits display, success/canceled flows
  - Security features:
    * Server-side plan mapping (`plan-mapping.ts`) prevents privilege escalation
    * Price ID validation against allowlist
    * Idempotent webhook handlers with upsert semantics
    * Stripe signature verification with required STRIPE_WEBHOOK_SECRET
  - User experience: subscription status display with usage tracking, cancellation/reactivation, automatic renewal management
  - Dashboard integration: "Assinatura" card in patient navigation for easy access
  - Seed script for plan updates (`scripts/seed-subscription-plans.ts`)
  - Environment variables: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_TRIAL_PRICE_ID, NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID, NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID, NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID
  - Usage enforcement: Each plan includes specific limits for exam analysis, AI consultations, and doctor consultations
  - Trial period: 7-day free trial without credit card, automatically converts or expires after trial period
  - Trial protection: Users can only activate trial once to prevent abuse