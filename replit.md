# MediAI - AI-Powered Healthcare Platform

## Overview
MediAI is an AI-powered healthcare platform connecting patients with medical professionals for AI-assisted diagnosis and real-time communication. It features patient and doctor portals, leveraging Google's Gemini AI models for intelligent medical analysis, preliminary diagnoses, and personalized wellness recommendations, all in Brazilian Portuguese. The platform aims to revolutionize healthcare delivery by integrating advanced AI capabilities with a robust, user-friendly interface.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**Framework**: Next.js 15 with App Router, TypeScript, and React Server Components.
**UI Components**: shadcn/ui with Radix UI primitives, Tailwind CSS. Features a futuristic dark theme with cyan/blue/purple gradients, neon accents, glow effects, semi-transparent cards, animated background orbs, and gradient text.
**Routing Structure**: Public routes (`/`, `/login`, `/register`), protected patient routes (`/patient/*`), and protected doctor routes (`/doctor/*`) with middleware-based authentication and role-based access control.

### Backend Architecture
**AI/ML Layer**: Google Genkit framework with Gemini models (Gemini 2.5 Flash) orchestrating multiple specialized AI agents for domain-specific analysis. Includes text-to-speech integration and real-time consultation flow.
**AI Agent System**:
- **Specialist Agents**: 15+ domain-specific agents (e.g., Cardiologist, Pulmonologist, Radiologist) with professional identities, comprehensive clinical assessment frameworks, and explicit JSON output instructions.
- **Orchestrator Pattern**: A General Practitioner AI coordinates specialist consultations.
- **Central Brain Concept**: MediAI acts as an intelligent coordinator for patient care.
- **Tool Integration**: Includes `medicalKnowledgeBaseTool`, `patientDataAccessTool`, `consultationHistoryAccessTool`, `doctorsListAccessTool`, and `internetSearchTool`.
**API Layer**: Next.js API routes (App Router) utilizing server actions for data mutations, RESTful endpoints for WebRTC signaling, and Server-Sent Events for real-time communication.
**Authentication & Session Management**: JWT-based sessions with `jose` library, bcrypt password hashing, and role-based middleware protection.

### Data Storage
**Primary Database**: Neon PostgreSQL, managed via Drizzle ORM.
**Data Model**: Includes tables for `patients`, `doctors`, `patientAuth`, `doctorAuth`, `exams`, `appointments`, `callRooms`, `signals`, and `consultations`.

### System Design Choices
- Complete migration from Firebase to Neon PostgreSQL with Drizzle ORM for improved type safety and infrastructure.
- Migration from Firebase Auth to bcrypt + JWT for authentication.
- File storage migrated from Firebase Storage to Google Cloud Storage.
- WebRTC signaling migrated from Firestore to PostgreSQL.
- Enhanced AI system with Gemini 2.5 Flash and improved specialist agent schemas for detailed clinical findings, assessments, and recommendations.
- **AI "Central Brain" system with 3D TalkingHead avatar** - Implemented using TalkingHead.js + Gemini 2.5 Flash TTS for realistic lip-sync and natural voice in Portuguese.
- Call recording and transcription via Gemini AI with storage in PostgreSQL.
- Server-side AI processing to secure sensitive medical data.
- Per-exam validation workflow.
- Gamification for doctors (XP, levels, badges) to encourage platform engagement.

## Recent Changes (Oct 2025)

### Avatar 3D TalkingHead Implementation
**Components Created:**
- `TalkingAvatar3D` - Main 3D avatar component with CDN loading, WebGL rendering, lip-sync via Ready Player Me
- `AvatarTestPanel` - Testing interface with speech controls
- `/api/gemini-tts` - TTS endpoint using Gemini 2.5 Flash (Portuguese, Puck voice)
- `useAvatarSpeech` hook - Control avatar speech with mood/subtitle support

**Integration Points:**
- Patient call page (`/patient/call/[doctorId]`) - Avatar during video consultations
- Doctor dashboard (`/doctor`) - "IA Central Brain" card with online status
- Uses Three.js 0.161.0 + TalkingHead.js from CDN
- Ready Player Me avatar with ARKit/Oculus Visemes morphTargets for lip-sync
- Audio: PCM 16-bit, 24kHz, mono via Gemini 2.5 Flash TTS

### AI Nutritionist Wellness Plan System (Oct 2025)
**Database Schema:**
- Added `wellnessPlan` JSONB field to `patients` table with dietary, exercise, mental wellness plans, daily reminders, weekly recipes, and weekly tasks

**AI Integration:**
- `regeneratePatientWellnessPlan` - Consolidates all patient exams and generates personalized wellness plan via AI Nutritionist agent
- Icon validation with explicit constraints: `'Droplet' | 'Clock' | 'Coffee' | 'Bed' | 'Dumbbell'`
- Category validation for weekly tasks: `'nutrition' | 'exercise' | 'mental' | 'general'`
- Meal type validation for recipes: `'cafe-da-manha' | 'almoco' | 'jantar' | 'lanche'`
- Comprehensive error logging for validation failures
- Automatic regeneration after exam analysis (fire-and-forget pattern)
- Generates 7 healthy recipes (one per day) tailored to patient's medical conditions
- Generates 7-10 categorized weekly tasks with suggested days
- **Automatic recipe-to-task conversion:** Each recipe becomes a "Preparar: [recipe name]" task in nutrition category
- **Weekly regeneration limit:** Wellness plan can only be regenerated once every 7 days to ensure stability

**UI Components:**
- `/patient/wellness` page refactored to display persistent wellness plan from database
- Futuristic cards with cyan/blue/purple gradients for each wellness section
- Regeneration button with 7-day cooldown period and visual feedback
- Last updated timestamp display
- **Weekly Recipes Section** with:
  - Grid layout with color-coded meal type cards (breakfast, lunch, dinner, snack)
  - Click-to-view recipe details in modal dialog
  - Full ingredients list with quantities
  - Step-by-step preparation instructions
  - Day-of-week suggestions
- **Weekly Tasks Section** with:
  - Interactive checkboxes to mark tasks as complete
  - Visual progress bar showing completion percentage
  - Tasks organized by category (nutrition, exercise, mental health, general)
  - Category-specific icons and color gradients
  - Optimistic UI updates for instant feedback
  - Includes auto-generated tasks for preparing weekly recipes

**Technical Details:**
- Plans persist in PostgreSQL as JSONB for efficient querying
- Zod schema validation ensures data integrity
- Pre-validation of reminder icons, task categories, and recipe meal types before database save
- Graceful error handling with detailed logging
- `toggleWeeklyTaskAction` server action for updating task completion status
- `RegenerateWellnessPlanButton` component with built-in 7-day cooldown logic
- Recipes include: id, title, mealType, ingredients array, instructions, dayOfWeek
- Tasks include: id, category, title, description, dayOfWeek (optional), completed status, completedAt timestamp

## External Dependencies

**AI/ML Services**:
- Google Gemini API (Gemini 2.0 Flash, Gemini 2.0 Flash Vision, Gemini 1.5 Pro, Gemini 2.5 Flash TTS)
- Google Genkit (AI orchestration framework)

**Cloud Services**:
- Google Cloud Storage (File storage)

**Database**:
- Neon PostgreSQL

**Real-Time Communication**:
- WebRTC (Peer-to-peer video/audio calls)
- Simple-peer library (WebRTC abstraction)

**Development & Build Tools**:
- TypeScript
- Tailwind CSS
- Drizzle ORM
- `jose` library (JWT)
- `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`, `postgres`

**API Integrations**:
- Internal medical knowledge base tool
- Internet search capability
- Patient data access tool