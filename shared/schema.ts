import { pgTable, text, integer, boolean, timestamp, json, serial, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const patientStatusEnum = pgEnum('patient_status', ['Requer Validação', 'Validado']);
export const examStatusEnum = pgEnum('exam_status', ['Requer Validação', 'Validado']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['Agendada', 'Concluída', 'Cancelada']);
export const callStatusEnum = pgEnum('call_status', ['waiting', 'active', 'ended']);
export const userRoleEnum = pgEnum('user_role', ['doctor', 'patient']);

export const patients = pgTable('patients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  birthDate: text('birth_date').notNull(),
  cpf: text('cpf').notNull().unique(),
  phone: text('phone').notNull(),
  email: text('email').notNull().unique(),
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
    dailyReminders: Array<{
      icon: 'Droplet' | 'Clock' | 'Coffee' | 'Bed' | 'Dumbbell';
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
    lastUpdated: string;
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
  specialty: text('specialty').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  online: boolean('online').default(false).notNull(),
  avatar: text('avatar').notNull(),
  avatarHint: text('avatar_hint'),
  email: text('email').notNull().unique(),
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(),
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
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
  appointments: many(appointments),
  consultations: many(consultations),
  callRooms: many(callRooms),
  auth: many(doctorAuth),
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
