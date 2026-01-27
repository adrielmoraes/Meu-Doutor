CREATE TYPE "public"."document_type" AS ENUM('receita', 'atestado', 'laudo', 'outro');--> statement-breakpoint
CREATE TYPE "public"."prescription_status" AS ENUM('draft', 'pending_process', 'signed', 'error');--> statement-breakpoint
CREATE TYPE "public"."signature_method" AS ENUM('a1_local', 'bry_cloud', 'birdid_cloud');--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"doctor_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"type" "document_type" DEFAULT 'receita' NOT NULL,
	"title" text,
	"ai_explanation" text,
	"ai_explanation_audio_uri" text,
	"medications" json,
	"instructions" text,
	"signed_pdf_url" text,
	"signature_method" "signature_method",
	"bry_transaction_id" text,
	"external_id" text,
	"status" "prescription_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "cpf" text;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "birth_date" text;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "reset_password_token" text;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "reset_password_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "is_approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "verification_document" text;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "health_podcasts" ADD COLUMN "status" text DEFAULT 'processing' NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "mothers_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "reset_password_token" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "reset_password_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_cpf_unique" UNIQUE("cpf");