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