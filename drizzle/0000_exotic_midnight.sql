CREATE TYPE "public"."appointment_status" AS ENUM('Agendada', 'Concluída', 'Cancelada');--> statement-breakpoint
CREATE TYPE "public"."call_status" AS ENUM('waiting', 'active', 'ended');--> statement-breakpoint
CREATE TYPE "public"."exam_status" AS ENUM('Requer Validação', 'Validado');--> statement-breakpoint
CREATE TYPE "public"."patient_status" AS ENUM('Requer Validação', 'Validado');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('doctor', 'patient');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"patient_name" text NOT NULL,
	"patient_avatar" text,
	"doctor_id" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"type" text NOT NULL,
	"status" "appointment_status" DEFAULT 'Agendada' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"doctor_id" text NOT NULL,
	"type" text NOT NULL,
	"status" "call_status" DEFAULT 'waiting' NOT NULL,
	"created_at" timestamp NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" text PRIMARY KEY NOT NULL,
	"doctor_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"room_id" text,
	"transcription" text NOT NULL,
	"summary" text NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_auth" (
	"id" text PRIMARY KEY NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"specialty" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"online" boolean DEFAULT false NOT NULL,
	"avatar" text NOT NULL,
	"avatar_hint" text,
	"email" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"xp_to_next_level" integer DEFAULT 100 NOT NULL,
	"validations" integer DEFAULT 0 NOT NULL,
	"badges" json DEFAULT '[]'::json,
	"availability" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doctors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"type" text NOT NULL,
	"date" text NOT NULL,
	"result" text NOT NULL,
	"icon" text NOT NULL,
	"preliminary_diagnosis" text NOT NULL,
	"explanation" text NOT NULL,
	"suggestions" text NOT NULL,
	"results" json,
	"specialist_findings" json,
	"status" "exam_status" DEFAULT 'Requer Validação' NOT NULL,
	"doctor_notes" text,
	"final_explanation" text,
	"final_explanation_audio_uri" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_auth" (
	"id" text PRIMARY KEY NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"birth_date" text NOT NULL,
	"cpf" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"last_visit" text,
	"status" "patient_status" DEFAULT 'Requer Validação' NOT NULL,
	"priority" text,
	"avatar" text NOT NULL,
	"avatar_hint" text,
	"gender" text NOT NULL,
	"conversation_history" text DEFAULT '',
	"reported_symptoms" text DEFAULT '',
	"exam_results" text DEFAULT '',
	"doctor_notes" text,
	"preventive_alerts" json,
	"health_goals" json,
	"final_explanation" text,
	"final_explanation_audio_uri" text,
	"wellness_plan" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patients_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "patients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "replit_users" (
	"replit_user_id" text PRIMARY KEY NOT NULL,
	"replit_user_name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"profile_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"type" text NOT NULL,
	"data" json NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tavus_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"conversation_id" text NOT NULL,
	"transcript" text DEFAULT '',
	"summary" text,
	"main_concerns" json,
	"ai_recommendations" json,
	"suggested_follow_up" json,
	"sentiment" text,
	"quality_score" integer,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tavus_conversations_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_rooms" ADD CONSTRAINT "call_rooms_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_rooms" ADD CONSTRAINT "call_rooms_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_room_id_call_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."call_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_auth" ADD CONSTRAINT "doctor_auth_id_doctors_id_fk" FOREIGN KEY ("id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_auth" ADD CONSTRAINT "patient_auth_id_patients_id_fk" FOREIGN KEY ("id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_room_id_call_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."call_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tavus_conversations" ADD CONSTRAINT "tavus_conversations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;