CREATE TYPE "public"."avatar_provider" AS ENUM('tavus', 'bey');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'incomplete');--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"platform_name" text DEFAULT 'MediAI' NOT NULL,
	"platform_description" text DEFAULT 'Plataforma de saúde com IA' NOT NULL,
	"support_email" text DEFAULT 'suporte@mediai.com' NOT NULL,
	"max_file_size" integer DEFAULT 10 NOT NULL,
	"session_timeout" integer DEFAULT 7 NOT NULL,
	"avatar_provider" "avatar_provider" DEFAULT 'tavus' NOT NULL,
	"notify_new_patient" boolean DEFAULT true NOT NULL,
	"notify_new_doctor" boolean DEFAULT true NOT NULL,
	"notify_new_exam" boolean DEFAULT true NOT NULL,
	"notify_new_consultation" boolean DEFAULT false NOT NULL,
	"notify_system_alerts" boolean DEFAULT true NOT NULL,
	"notify_weekly_report" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"admin_name" text NOT NULL,
	"admin_email" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"changes" json,
	"metadata" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'brl' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"failed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'brl' NOT NULL,
	"interval" text DEFAULT 'month' NOT NULL,
	"features" json NOT NULL,
	"stripe_price_id" text,
	"stripe_product_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"stripe_subscription_id" text,
	"stripe_customer_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "usage_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"usage_type" text NOT NULL,
	"resource_name" text,
	"tokens_used" integer DEFAULT 0,
	"duration_seconds" integer DEFAULT 0,
	"cost" integer DEFAULT 0,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "crm" text NOT NULL;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_crm_unique" UNIQUE("crm");