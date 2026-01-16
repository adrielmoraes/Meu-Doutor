import { pgTable, text, integer, boolean, timestamp, json, serial, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const patientStatusEnum = pgEnum('patient_status', ['Requer Validação', 'Validado']);
export const examStatusEnum = pgEnum('exam_status', ['Requer Validação', 'Validado']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['Agendada', 'Concluída', 'Cancelada']);
export const callStatusEnum = pgEnum('call_status', ['waiting', 'active', 'ended']);
export const userRoleEnum = pgEnum('user_role', ['doctor', 'patient', 'admin']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'trialing', 'incomplete']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded']);
export const avatarProviderEnum = pgEnum('avatar_provider', ['tavus', 'bey']);
export const prescriptionStatusEnum = pgEnum('prescription_status', ['draft', 'pending_process', 'signed', 'error']);
export const documentTypeEnum = pgEnum('document_type', ['receita', 'atestado', 'laudo', 'outro']);
export const signatureMethodEnum = pgEnum('signature_method', ['a1_local', 'bry_cloud']);

export const patients = pgTable('patients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  birthDate: text('birth_date').notNull(),
  cpf: text('cpf').notNull().unique(),
  phone: text('phone').notNull(),
  mothersName: text('mothers_name').notNull().default(''),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  tokenExpiry: timestamp('token_expiry'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpiry: timestamp('reset_password_expiry'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  lastVisit: text('last_visit'),
  status: patientStatusEnum('status').notNull().default('Requer Validação'),
  priority: text('priority'),
  avatar: text('avatar').notNull(),
  avatarHint: text('avatar_hint'),
  gender: text('gender').notNull(),
  conversationHistory: text('conversation_history').default(''),
  reportedSymptoms: text('reported_symptoms').default(''),
  examResults: text('exam_results').default(''),
  doctorNotes: text('doctor_notes'),
  preventiveAlerts: json('preventive_alerts').$type<string[]>(),
  healthGoals: json('health_goals').$type<{ title: string; description: string; progress: number }[]>(),
  finalExplanation: text('final_explanation'),
  finalExplanationAudioUri: text('final_explanation_audio_uri'),
  wellnessPlan: json('wellness_plan').$type<{
    dietaryPlan: string;
    exercisePlan: string;
    mentalWellnessPlan: string;
    dietaryPlanAudioUri?: string;
    exercisePlanAudioUri?: string;
    mentalWellnessPlanAudioUri?: string;
    weeklyMealPlan?: Array<{
      day: string;
      breakfast: string;
      breakfastRecipe?: {
        title: string;
        ingredients: string[];
        instructions: string;
        prepTime: string;
      };
      lunch: string;
      lunchRecipe?: {
        title: string;
        ingredients: string[];
        instructions: string;
        prepTime: string;
      };
      dinner: string;
      dinnerRecipe?: {
        title: string;
        ingredients: string[];
        instructions: string;
        prepTime: string;
      };
      snacks?: string;
    }>;
    hydrationPlan?: string;
    sleepPlan?: string;
    goals?: {
      shortTerm: string[];
      mediumTerm: string[];
      longTerm: string[];
    };
    dailyReminders: Array<{
      icon: 'Droplet' | 'Clock' | 'Coffee' | 'Bed' | 'Dumbbell' | 'Apple' | 'Heart' | 'Sun' | 'Moon' | 'Activity' | 'Utensils' | 'Brain' | 'Smile' | 'Wind' | 'Leaf';
      title: string;
      description: string;
    }>;
    weeklyTasks: Array<{
      id: string;
      category: 'nutrition' | 'exercise' | 'mental' | 'general';
      title: string;
      description: string;
      dayOfWeek?: string;
      completed: boolean;
      completedAt?: string;
    }>;
    coachComment?: string;
    healthGoals?: Array<{
      title: string;
      description: string;
      category: 'exercise' | 'nutrition' | 'mindfulness' | 'medical' | 'lifestyle';
      progress: number;
      targetDate: string;
    }>;
    preventiveAlerts?: Array<{
      alert: string;
      severity: 'high' | 'medium' | 'low';
      category: 'cardiovascular' | 'metabolic' | 'respiratory' | 'general';
    }>;
    lastUpdated: string;
  }>(),
  customQuotas: json('custom_quotas').$type<{
    examAnalysis?: number;
    aiConsultationMinutes?: number;
    doctorConsultationMinutes?: number;
    therapistChatDays?: number;
    podcastMinutes?: number;
    trialDurationDays?: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const patientAuth = pgTable('patient_auth', {
  id: text('id').primaryKey().references(() => patients.id, { onDelete: 'cascade' }),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const doctors = pgTable('doctors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  crm: text('crm').notNull().unique(),
  cpf: text('cpf').unique(), // Opcional no início para não quebrar cadastros existentes, mas necessário para Memed
  birthDate: text('birth_date'),
  phone: text('phone'),
  specialty: text('specialty').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  online: boolean('online').default(false).notNull(),
  avatar: text('avatar').notNull(),
  avatarHint: text('avatar_hint'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  tokenExpiry: timestamp('token_expiry'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpiry: timestamp('reset_password_expiry'),
  isApproved: boolean('is_approved').default(false).notNull(),
  verificationDocument: text('verification_document'),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  xpToNextLevel: integer('xp_to_next_level').default(100).notNull(),
  validations: integer('validations').default(0).notNull(),
  badges: json('badges').$type<{ name: string; icon: string; description: string }[]>().default([]),
  availability: json('availability').$type<{ date: string; time: string; available: boolean }[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const doctorAuth = pgTable('doctor_auth', {
  id: text('id').primaryKey().references(() => doctors.id, { onDelete: 'cascade' }),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const admins = pgTable('admins', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatar: text('avatar').notNull(),
  role: text('role').default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const adminAuth = pgTable('admin_auth', {
  id: text('id').primaryKey().references(() => admins.id, { onDelete: 'cascade' }),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Replit Auth user mapping
export const replitUsers = pgTable('replit_users', {
  replitUserId: text('replit_user_id').primaryKey(), // X-Replit-User-Id
  replitUserName: text('replit_user_name').notNull(), // X-Replit-User-Name
  role: userRoleEnum('role').notNull(),
  profileId: text('profile_id').notNull(), // references doctors.id or patients.id
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const exams = pgTable('exams', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  date: text('date').notNull(),
  result: text('result').notNull(),
  icon: text('icon').notNull(),
  preliminaryDiagnosis: text('preliminary_diagnosis').notNull(),
  explanation: text('explanation').notNull(),
  suggestions: text('suggestions').notNull(),
  results: json('results').$type<{ name: string; value: string; reference: string }[]>(),
  specialistFindings: json('specialist_findings').$type<Array<{
    specialist: string;
    findings: string;
    clinicalAssessment: string;
    recommendations: string;
  }>>(),
  status: examStatusEnum('status').notNull().default('Requer Validação'),
  doctorNotes: text('doctor_notes'),
  finalExplanation: text('final_explanation'),
  finalExplanationAudioUri: text('final_explanation_audio_uri'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const prescriptions = pgTable('prescriptions', {
  id: text('id').primaryKey(),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  type: documentTypeEnum('type').default('receita').notNull(),
  title: text('title'),
  aiExplanation: text('ai_explanation'),
  aiExplanationAudioUri: text('ai_explanation_audio_uri'),
  medications: json('medications').$type<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[]>(),
  instructions: text('instructions'),
  signedPdfUrl: text('signed_pdf_url'),
  signatureMethod: signatureMethodEnum('signature_method'),
  bryTransactionId: text('bry_transaction_id'),
  externalId: text('external_id'), // Memed Prescription ID
  status: prescriptionStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appointments = pgTable('appointments', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  patientName: text('patient_name').notNull(),
  patientAvatar: text('patient_avatar'),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  time: text('time').notNull(),
  type: text('type').notNull(),
  status: appointmentStatusEnum('status').notNull().default('Agendada'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const callRooms = pgTable('call_rooms', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  status: callStatusEnum('status').notNull().default('waiting'),
  createdAt: timestamp('created_at').notNull(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const signals = pgTable('signals', {
  id: serial('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => callRooms.id, { onDelete: 'cascade' }),
  from: text('from').notNull(),
  to: text('to').notNull(),
  type: text('type').notNull(),
  data: json('data').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const consultations = pgTable('consultations', {
  id: text('id').primaryKey(),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  roomId: text('room_id').references(() => callRooms.id, { onDelete: 'set null' }),
  transcription: text('transcription').notNull(),
  summary: text('summary').notNull(),
  date: text('date').notNull(),
  type: text('type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const patientsRelations = relations(patients, ({ many }) => ({
  exams: many(exams),
  appointments: many(appointments),
  consultations: many(consultations),
  callRooms: many(callRooms),
  auth: many(patientAuth),
  prescriptions: many(prescriptions),
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
  appointments: many(appointments),
  consultations: many(consultations),
  callRooms: many(callRooms),
  auth: many(doctorAuth),
  prescriptions: many(prescriptions),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [prescriptions.doctorId],
    references: [doctors.id],
  }),
}));

export const examsRelations = relations(exams, ({ one }) => ({
  patient: one(patients, {
    fields: [exams.patientId],
    references: [patients.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
}));

export const callRoomsRelations = relations(callRooms, ({ one, many }) => ({
  patient: one(patients, {
    fields: [callRooms.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [callRooms.doctorId],
    references: [doctors.id],
  }),
  signals: many(signals),
}));

export const signalsRelations = relations(signals, ({ one }) => ({
  callRoom: one(callRooms, {
    fields: [signals.roomId],
    references: [callRooms.id],
  }),
}));

export const consultationsRelations = relations(consultations, ({ one }) => ({
  patient: one(patients, {
    fields: [consultations.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [consultations.doctorId],
    references: [doctors.id],
  }),
  callRoom: one(callRooms, {
    fields: [consultations.roomId],
    references: [callRooms.id],
  }),
}));

export const tavusConversations = pgTable('tavus_conversations', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  conversationId: text('conversation_id').notNull().unique(),
  transcript: text('transcript').default(''),
  summary: text('summary'),
  mainConcerns: json('main_concerns').$type<string[]>(),
  aiRecommendations: json('ai_recommendations').$type<string[]>(),
  suggestedFollowUp: json('suggested_follow_up').$type<string[]>(),
  sentiment: text('sentiment'),
  qualityScore: integer('quality_score'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tavusConversationsRelations = relations(tavusConversations, ({ one }) => ({
  patient: one(patients, {
    fields: [tavusConversations.patientId],
    references: [patients.id],
  }),
}));

export const subscriptionPlans = pgTable('subscription_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  currency: text('currency').notNull().default('brl'),
  interval: text('interval').notNull().default('month'),
  features: json('features').$type<string[]>().notNull(),
  stripePriceId: text('stripe_price_id'),
  stripeProductId: text('stripe_product_id'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull().references(() => subscriptionPlans.id),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  subscriptionId: text('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('brl'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  paidAt: timestamp('paid_at'),
  failedAt: timestamp('failed_at'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Admin Settings
export const adminSettings = pgTable('admin_settings', {
  id: text('id').primaryKey(),
  platformName: text('platform_name').notNull().default('MediAI'),
  platformDescription: text('platform_description').notNull().default('Plataforma de saúde com IA'),
  supportEmail: text('support_email').notNull().default('suporte@mediai.com'),
  maxFileSize: integer('max_file_size').notNull().default(10), // MB
  sessionTimeout: integer('session_timeout').notNull().default(7), // dias
  avatarProvider: avatarProviderEnum('avatar_provider').notNull().default('tavus'), // Avatar provider: Tavus or BEY
  notifyNewPatient: boolean('notify_new_patient').notNull().default(true),
  notifyNewDoctor: boolean('notify_new_doctor').notNull().default(true),
  notifyNewExam: boolean('notify_new_exam').notNull().default(true),
  notifyNewConsultation: boolean('notify_new_consultation').notNull().default(false),
  notifySystemAlerts: boolean('notify_system_alerts').notNull().default(true),
  notifyWeeklyReport: boolean('notify_weekly_report').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull().references(() => admins.id, { onDelete: 'cascade' }),
  adminName: text('admin_name').notNull(),
  adminEmail: text('admin_email').notNull(),
  action: text('action').notNull(), // 'update_settings', 'change_password', 'create_admin', etc
  entityType: text('entity_type').notNull(), // 'admin_settings', 'admin_auth', 'admin', etc
  entityId: text('entity_id'), // ID do registro afetado, se aplicável
  changes: json('changes').$type<{
    field: string;
    oldValue: string | number | boolean | null;
    newValue: string | number | boolean | null;
  }[]>(),
  metadata: json('metadata').$type<Record<string, any>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Usage Tracking - Rastreamento de uso de recursos por paciente
export const usageTracking = pgTable('usage_tracking', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  usageType: text('usage_type').notNull(), // 'exam_analysis', 'stt', 'llm', 'tts', 'ai_call', 'doctor_call', 'chat'
  resourceName: text('resource_name'), // Nome específico do recurso (ex: 'Gemini 2.5 Flash', 'Tavus Avatar')
  tokensUsed: integer('tokens_used').default(0), // Tokens de AI usados
  durationSeconds: integer('duration_seconds').default(0), // Duração em segundos (para chamadas)
  cost: integer('cost').default(0), // Custo estimado em centavos
  metadata: json('metadata').$type<{
    examId?: string;
    consultationId?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    audioSeconds?: number;
    [key: string]: any;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').default('new').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  patient: one(patients, {
    fields: [subscriptions.patientId],
    references: [patients.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  patient: one(patients, {
    fields: [payments.patientId],
    references: [patients.id],
  }),
}));

// LGPD User Activity Logs - Rastreamento de atividades do usuário
export const userActivityLogs = pgTable('user_activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userType: text('user_type').notNull(), // 'patient', 'doctor', 'admin'
  userEmail: text('user_email'),
  action: text('action').notNull(), // 'login', 'logout', 'view_data', 'update_profile', 'export_data', 'delete_request', etc
  resource: text('resource'), // Recurso acessado (ex: 'patient_profile', 'exam_results', 'medical_records')
  resourceId: text('resource_id'), // ID do recurso acessado
  details: json('details').$type<{
    description?: string;
    changedFields?: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    reason?: string;
    [key: string]: any;
  }>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  sessionId: text('session_id'),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// LGPD Consent Records - Registro de consentimentos
export const consentRecords = pgTable('consent_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userType: text('user_type').notNull(), // 'patient', 'doctor'
  userEmail: text('user_email').notNull(),
  consentType: text('consent_type').notNull(), // 'privacy_policy', 'terms_of_service', 'data_processing', 'marketing', 'health_data_sharing'
  consentVersion: text('consent_version').notNull(), // Versão do documento consentido
  granted: boolean('granted').notNull(), // true = consentido, false = revogado
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  grantedAt: timestamp('granted_at'),
  revokedAt: timestamp('revoked_at'),
  metadata: json('metadata').$type<{
    documentUrl?: string;
    documentHash?: string;
    reason?: string;
    [key: string]: any;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// LGPD Data Access Logs - Acesso a dados sensíveis
export const dataAccessLogs = pgTable('data_access_logs', {
  id: text('id').primaryKey(),
  accessorId: text('accessor_id').notNull(), // Quem acessou
  accessorType: text('accessor_type').notNull(), // 'patient', 'doctor', 'admin', 'system'
  accessorEmail: text('accessor_email'),
  dataOwnerId: text('data_owner_id').notNull(), // Dono dos dados acessados
  dataOwnerType: text('data_owner_type').notNull(), // 'patient'
  dataType: text('data_type').notNull(), // 'personal_info', 'medical_records', 'exam_results', 'prescriptions', 'wellness_plan'
  dataId: text('data_id'), // ID específico do registro acessado
  accessType: text('access_type').notNull(), // 'view', 'download', 'export', 'print', 'share'
  purpose: text('purpose'), // Motivo do acesso
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// LGPD Data Breach Incidents - Incidentes de segurança
export const securityIncidents = pgTable('security_incidents', {
  id: text('id').primaryKey(),
  incidentType: text('incident_type').notNull(), // 'data_breach', 'unauthorized_access', 'suspicious_activity', 'failed_login_attempts'
  severity: text('severity').notNull(), // 'low', 'medium', 'high', 'critical'
  affectedUsers: json('affected_users').$type<string[]>(),
  affectedDataTypes: json('affected_data_types').$type<string[]>(),
  description: text('description').notNull(),
  detectedAt: timestamp('detected_at').notNull(),
  reportedToANPD: boolean('reported_to_anpd').default(false),
  reportedAt: timestamp('reported_at'),
  resolvedAt: timestamp('resolved_at'),
  resolution: text('resolution'),
  preventiveMeasures: text('preventive_measures'),
  reportedBy: text('reported_by'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Platform Settings - Configurações da plataforma
export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(), // 'pix_enabled', etc
  value: text('value').notNull(), // JSON serializado ou valor simples
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Health Podcasts - Podcasts de saúde gerados por IA
export const healthPodcasts = pgTable('health_podcasts', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  audioUrl: text('audio_url').notNull(), // Base64 data URI ou URL do áudio
  transcript: text('transcript'), // Transcrição interna (não exibida ao paciente)
  lastExamId: text('last_exam_id'), // ID do último exame considerado na geração
  lastExamDate: text('last_exam_date'), // Data do último exame considerado
  status: text('status', { enum: ['processing', 'completed', 'failed'] }).default('processing').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const healthPodcastsRelations = relations(healthPodcasts, ({ one }) => ({
  patient: one(patients, {
    fields: [healthPodcasts.patientId],
    references: [patients.id],
  }),
}));
