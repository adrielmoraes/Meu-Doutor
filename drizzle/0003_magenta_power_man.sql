CREATE TABLE "consent_records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_type" text NOT NULL,
	"user_email" text NOT NULL,
	"consent_type" text NOT NULL,
	"consent_version" text NOT NULL,
	"granted" boolean NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"granted_at" timestamp,
	"revoked_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_access_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"accessor_id" text NOT NULL,
	"accessor_type" text NOT NULL,
	"accessor_email" text,
	"data_owner_id" text NOT NULL,
	"data_owner_type" text NOT NULL,
	"data_type" text NOT NULL,
	"data_id" text,
	"access_type" text NOT NULL,
	"purpose" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_podcasts" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"audio_url" text NOT NULL,
	"transcript" text,
	"last_exam_id" text,
	"last_exam_date" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "security_incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_type" text NOT NULL,
	"severity" text NOT NULL,
	"affected_users" json,
	"affected_data_types" json,
	"description" text NOT NULL,
	"detected_at" timestamp NOT NULL,
	"reported_to_anpd" boolean DEFAULT false,
	"reported_at" timestamp,
	"resolved_at" timestamp,
	"resolution" text,
	"preventive_measures" text,
	"reported_by" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_type" text NOT NULL,
	"user_email" text,
	"action" text NOT NULL,
	"resource" text,
	"resource_id" text,
	"details" json,
	"ip_address" text,
	"user_agent" text,
	"session_id" text,
	"success" boolean DEFAULT true,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "custom_quotas" json;--> statement-breakpoint
ALTER TABLE "health_podcasts" ADD CONSTRAINT "health_podcasts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;