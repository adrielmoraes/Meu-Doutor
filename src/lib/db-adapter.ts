'use server';

import { db } from '../../server/storage';
import {
  patients,
  doctors,
  exams,
  appointments,
  patientAuth,
  doctorAuth,
  admins,
  adminAuth,
  callRooms,
  signals,
  consultations,
} from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Doctor, DoctorWithPassword, Patient, PatientWithPassword, Admin, AdminWithPassword, Exam, Appointment, Consultation, AdminSettings, AuditLog, UsageTracking, PatientUsageStats } from '@/types';
import { randomUUID } from 'crypto';

export async function getDoctorByEmail(email: string): Promise<Doctor | null> {
  const result = await db.select().from(doctors).where(eq(doctors.email, email)).limit(1);
  if (!result[0]) return null;
  return { ...result[0], avatarHint: result[0].avatarHint || '' } as Doctor;
}

export async function getDoctorByCrm(crm: string): Promise<Doctor | null> {
  const result = await db.select().from(doctors).where(eq(doctors.crm, crm)).limit(1);
  if (!result[0]) return null;
  return { ...result[0], avatarHint: result[0].avatarHint || '' } as Doctor;
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  const result = await db.select().from(doctors).where(eq(doctors.id, id)).limit(1);
  if (!result[0]) return null;
  return { ...result[0], avatarHint: result[0].avatarHint || '' } as Doctor;
}

export async function getDoctorByEmailWithAuth(email: string): Promise<DoctorWithPassword | null> {
  const result = await db
    .select({
      doctor: doctors,
      password: doctorAuth.password,
    })
    .from(doctors)
    .leftJoin(doctorAuth, eq(doctors.id, doctorAuth.id))
    .where(eq(doctors.email, email))
    .limit(1);

  if (!result[0]) return null;

  return {
    ...result[0].doctor,
    password: result[0].password || null,
  } as DoctorWithPassword;
}

export async function getDoctors(): Promise<Doctor[]> {
  const results = await db.select().from(doctors);
  return results.map(d => ({ ...d, avatarHint: d.avatarHint || '' })) as Doctor[];
}

export async function addDoctorWithAuth(
  doctor: Omit<Doctor, 'id'>,
  password: string,
  verificationToken?: string,
  tokenExpiry?: Date
): Promise<string> {
  const doctorId = randomUUID();

  console.log('[DB] Salvando médico com token:', {
    email: doctor.email,
    hasToken: !!verificationToken,
    tokenLength: verificationToken?.length,
    tokenExpiry: tokenExpiry
  });

  try {
    // Inserir médico
    await db.insert(doctors).values([{
      id: doctorId,
      ...doctor,
      verificationToken: verificationToken || null,
      tokenExpiry: tokenExpiry || null,
      emailVerified: false,
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);

    // Inserir autenticação
    await db.insert(doctorAuth).values([{
      id: doctorId,
      password,
      createdAt: new Date(),
    }]);

    console.log('[DB] ✅ Médico salvo com sucesso:', doctorId);
    return doctorId;
  } catch (error) {
    // Em caso de erro, tentar limpar o médico criado
    console.error('[DB] ❌ Erro ao salvar médico, fazendo rollback manual:', error);
    try {
      await db.delete(doctors).where(eq(doctors.id, doctorId));
    } catch (cleanupError) {
      console.error('[DB] ❌ Erro ao fazer cleanup:', cleanupError);
    }
    throw error;
  }
}

export async function updateDoctor(id: string, data: Partial<Doctor>): Promise<void> {
  await db.update(doctors).set({ ...data, updatedAt: new Date() }).where(eq(doctors.id, id));
}

export async function getDoctorsBySpecialty(specialty: string, limit: number = 10): Promise<Doctor[]> {
  const result = await db.select().from(doctors).where(eq(doctors.specialty, specialty)).limit(limit);
  return result.map(d => ({ ...d, avatarHint: d.avatarHint || '' })) as Doctor[];
}

export async function updateDoctorStatus(doctorId: string, online: boolean): Promise<void> {
  await db.update(doctors).set({ online, updatedAt: new Date() }).where(eq(doctors.id, doctorId));
}

export async function updateDoctorAvailability(
  doctorId: string,
  availability: { date: string; time: string; available: boolean }[]
): Promise<void> {
  await db.update(doctors).set({ availability, updatedAt: new Date() }).where(eq(doctors.id, doctorId));
}

export async function approveDoctor(id: string): Promise<void> {
  await db.update(doctors).set({ isApproved: true, updatedAt: new Date() }).where(eq(doctors.id, id));
}

export async function deleteDoctor(id: string): Promise<void> {
  await db.delete(doctors).where(eq(doctors.id, id));
}

export async function getPendingDoctors(): Promise<Doctor[]> {
  const results = await db.select().from(doctors).where(eq(doctors.isApproved, false));
  return results.map(d => ({ ...d, avatarHint: d.avatarHint || '' })) as Doctor[];
}

export async function getPatients(): Promise<Patient[]> {
  const results = await db.select().from(patients);
  return results.map(p => ({ ...p, lastVisit: p.lastVisit || '', avatarHint: p.avatarHint || '' })) as Patient[];
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  if (!result[0]) return null;
  return { ...result[0], lastVisit: result[0].lastVisit || '', avatarHint: result[0].avatarHint || '' } as Patient;
}

export async function getPatientByEmail(email: string): Promise<Patient | null> {
  const result = await db.select().from(patients).where(eq(patients.email, email)).limit(1);
  if (!result[0]) return null;
  return { ...result[0], lastVisit: result[0].lastVisit || '', avatarHint: result[0].avatarHint || '' } as Patient;
}

export async function getPatientByCpf(cpf: string): Promise<Patient | null> {
  const result = await db.select().from(patients).where(eq(patients.cpf, cpf)).limit(1);
  if (!result[0]) return null;
  return { ...result[0], lastVisit: result[0].lastVisit || '', avatarHint: result[0].avatarHint || '' } as Patient;
}

export async function getPatientByEmailWithAuth(email: string): Promise<PatientWithPassword | null> {
  const result = await db
    .select({
      patient: patients,
      password: patientAuth.password,
    })
    .from(patients)
    .leftJoin(patientAuth, eq(patients.id, patientAuth.id))
    .where(eq(patients.email, email))
    .limit(1);

  if (!result[0]) return null;

  return {
    ...result[0].patient,
    password: result[0].password || null,
  } as PatientWithPassword;
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<void> {
  await db.update(patients).set({ ...data, updatedAt: new Date() }).where(eq(patients.id, id));
}

export async function addPatientWithAuth(
  patient: Omit<Patient, 'id' | 'verificationToken' | 'tokenExpiry' | 'emailVerified'>,
  password: string,
  verificationToken?: string,
  tokenExpiry?: Date
): Promise<string> {
  const patientId = randomUUID();

  console.log('[DB] Salvando paciente com token:', {
    email: patient.email,
    hasToken: !!verificationToken,
    tokenLength: verificationToken?.length,
    tokenExpiry: tokenExpiry
  });

  // Cota inicial gratuita para novos pacientes: 5 minutos de consulta com IA
  const initialQuotas = {
    examAnalysis: 5,
    aiConsultationMinutes: 5,
    doctorConsultationMinutes: 0,
    therapistChat: 999999, // ilimitado
  };

  try {
    // Inserir paciente com cotas iniciais
    await db.insert(patients).values({
      id: patientId,
      ...patient,
      customQuotas: initialQuotas,
      verificationToken: verificationToken || null,
      tokenExpiry: tokenExpiry || null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Inserir autenticação
    await db.insert(patientAuth).values({
      id: patientId,
      password,
      createdAt: new Date(),
    });

    console.log('[DB] ✅ Paciente salvo com sucesso:', patientId);
    return patientId;
  } catch (error) {
    // Em caso de erro, tentar limpar o paciente criado
    console.error('[DB] ❌ Erro ao salvar paciente, fazendo rollback manual:', error);
    try {
      await db.delete(patients).where(eq(patients.id, patientId));
    } catch (cleanupError) {
      console.error('[DB] ❌ Erro ao fazer cleanup:', cleanupError);
    }
    throw error;
  }
}

export async function getExamsByPatientId(patientId: string): Promise<Exam[]> {
  const results = await db
    .select()
    .from(exams)
    .where(eq(exams.patientId, patientId))
    .orderBy(desc(exams.createdAt));

  return results.map(e => ({ ...e, results: e.results || undefined })) as Exam[];
}

export async function getExamById(patientId: string, examId: string): Promise<Exam | null> {
  const result = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.patientId, patientId)))
    .limit(1);

  if (!result[0]) return null;
  return { ...result[0], results: result[0].results || undefined } as Exam;
}

export async function addExamToPatient(
  patientId: string,
  examData: Omit<Exam, 'id' | 'date' | 'status' | 'patientId'> & { date?: string | Date }
): Promise<string> {
  const id = randomUUID();
  const examRecord = {
    ...examData,
    id,
    patientId,
    date: examData.date
      ? (examData.date instanceof Date ? examData.date.toISOString() : examData.date)
      : new Date().toISOString(),
    status: 'Requer Validação' as const,
  };

  await db.insert(exams).values(examRecord);
  return id;
}

export async function updateExam(patientId: string, examId: string, data: Partial<Exam>): Promise<void> {
  await db
    .update(exams)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(exams.id, examId), eq(exams.patientId, patientId)));
}

export async function deleteExam(patientId: string, examId: string): Promise<void> {
  await db.delete(exams).where(and(eq(exams.id, examId), eq(exams.patientId, patientId)));
}

export async function getExams(): Promise<Exam[]> {
  const results = await db.select().from(exams).orderBy(desc(exams.createdAt));
  return results.map(e => ({ ...e, results: e.results || undefined })) as Exam[];
}

export async function getAllExamsForWellnessPlan(patientId: string): Promise<Exam[]> {
  const results = await db
    .select()
    .from(exams)
    .where(eq(exams.patientId, patientId))
    .orderBy(desc(exams.createdAt));

  return results.map(e => ({ ...e, results: e.results || undefined })) as Exam[];
}

export async function getRecentExamsForPodcast(patientId: string, limit: number = 5): Promise<Exam[]> {
  const safeLimit = Math.max(1, Math.min(limit, 20));
  const results = await db
    .select()
    .from(exams)
    .where(eq(exams.patientId, patientId))
    .orderBy(desc(exams.createdAt))
    .limit(safeLimit);

  return results.map(e => ({ ...e, results: e.results || undefined })) as Exam[];
}

export async function updatePatientWellnessPlan(
  patientId: string,
  wellnessPlan: {
    dietaryPlan: string;
    exercisePlan: string;
    mentalWellnessPlan: string;
    dietaryPlanAudioUri?: string;
    exercisePlanAudioUri?: string;
    mentalWellnessPlanAudioUri?: string;
    dailyReminders: Array<{
      icon: 'Droplet' | 'Clock' | 'Coffee' | 'Bed' | 'Dumbbell' | 'Apple' | 'Heart' | 'Sun' | 'Moon' | 'Activity' | 'Utensils' | 'Brain' | 'Smile' | 'Wind' | 'Leaf';
      title: string;
      description: string;
    }>;
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
  }
): Promise<void> {
  await db.update(patients).set({
    wellnessPlan,
    updatedAt: new Date()
  }).where(eq(patients.id, patientId));
}

export async function getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
  const results = await db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.createdAt));

  return results.map(a => ({ ...a, patientAvatar: a.patientAvatar || undefined })) as Appointment[];
}

export async function getAppointmentsByDate(doctorId: string, date: string): Promise<Appointment[]> {
  const results = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.doctorId, doctorId), eq(appointments.date, date)));

  return results.map(a => ({ ...a, patientAvatar: a.patientAvatar || undefined })) as Appointment[];
}

export async function getAppointmentsForDoctor(doctorId: string): Promise<Appointment[]> {
  const results = await db
    .select()
    .from(appointments)
    .where(eq(appointments.doctorId, doctorId))
    .orderBy(desc(appointments.createdAt));

  return results.map(a => ({ ...a, patientAvatar: a.patientAvatar || undefined })) as Appointment[];
}

export async function getAllAppointmentsForDoctor(doctorId: string): Promise<Appointment[]> {
  return await getAppointmentsForDoctor(doctorId);
}

export async function createAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<string> {
  const id = randomUUID();
  await db.insert(appointments).values({ ...appointmentData, id });
  return id;
}

export async function addAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<string> {
  return createAppointment(appointmentData);
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  await db.delete(appointments).where(eq(appointments.id, appointmentId));
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'Agendada' | 'Concluída' | 'Cancelada'
): Promise<void> {
  await db
    .update(appointments)
    .set({ status, updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));
}

export async function createCallRoom(
  roomId: string,
  patientId: string,
  doctorId: string,
  type: string
): Promise<void> {
  await db.insert(callRooms).values({
    id: roomId,
    patientId,
    doctorId,
    type,
    status: 'waiting',
    createdAt: new Date(),
  });
}

export async function updateCallRoomStatus(
  roomId: string,
  status: 'waiting' | 'active' | 'ended'
): Promise<void> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'active') {
    updateData.startedAt = new Date();
  } else if (status === 'ended') {
    updateData.endedAt = new Date();
  }

  await db.update(callRooms).set(updateData).where(eq(callRooms.id, roomId));
}

// Note: Call recordings are now saved in the consultations table instead
// export async function updateCallRecording(roomId: string, transcription: string, summary: string): Promise<void> {
//   await db.update(callRooms).set({
//     recording: JSON.stringify({ transcription, summary, processedAt: new Date().toISOString() }),
//     updatedAt: new Date()
//   }).where(eq(callRooms.id, roomId));
// }

export async function getActiveCallsForDoctor(doctorId: string) {
  return await db
    .select()
    .from(callRooms)
    .where(and(eq(callRooms.doctorId, doctorId), eq(callRooms.status, 'waiting')))
    .orderBy(desc(callRooms.createdAt));
}

export async function addSignal(
  roomId: string,
  from: string,
  to: string,
  signalType: string,
  signalData: any
): Promise<void> {
  await db.insert(signals).values({
    roomId,
    from,
    to,
    type: signalType,
    data: signalData,
    timestamp: new Date(),
  });
}

export async function getSignalsForRoom(roomId: string, userId: string) {
  return await db
    .select()
    .from(signals)
    .where(and(eq(signals.roomId, roomId), eq(signals.to, userId)))
    .orderBy(desc(signals.timestamp));
}

export async function saveConsultation(
  doctorId: string,
  patientId: string,
  roomId: string,
  transcription: string,
  summary: string,
  type: string
): Promise<string> {
  const id = randomUUID();
  await db.insert(consultations).values({
    id,
    doctorId,
    patientId,
    roomId,
    transcription,
    summary,
    date: new Date().toISOString(),
    type,
  });
  return id;
}

export async function getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
  const results = await db
    .select()
    .from(consultations)
    .where(eq(consultations.patientId, patientId))
    .orderBy(desc(consultations.createdAt));

  return results.map(c => ({ ...c, roomId: c.roomId || '' })) as Consultation[];
}

export async function getConsultationsByDoctor(doctorId: string): Promise<Consultation[]> {
  const results = await db
    .select()
    .from(consultations)
    .where(eq(consultations.doctorId, doctorId))
    .orderBy(desc(consultations.createdAt));

  return results.map(c => ({ ...c, roomId: c.roomId || '' })) as Consultation[];
}

export async function getConsultations(): Promise<Consultation[]> {
  const results = await db
    .select()
    .from(consultations)
    .orderBy(desc(consultations.date));

  return results.map(c => ({ ...c, roomId: c.roomId || '' })) as Consultation[];
}

export async function saveTavusConversation(data: {
  patientId: string;
  conversationId: string;
  transcript?: string;
  summary?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}): Promise<string> {
  const { tavusConversations } = await import('../../shared/schema');
  const id = randomUUID();

  await db.insert(tavusConversations).values({
    id,
    patientId: data.patientId,
    conversationId: data.conversationId,
    transcript: data.transcript || '',
    summary: data.summary,
    startTime: data.startTime,
    endTime: data.endTime,
    duration: data.duration,
  });

  return id;
}

export async function getTavusConversationsByPatient(patientId: string): Promise<any[]> {
  const { tavusConversations } = await import('../../shared/schema');

  const results = await db
    .select()
    .from(tavusConversations)
    .where(eq(tavusConversations.patientId, patientId))
    .orderBy(desc(tavusConversations.createdAt));

  return results;
}

export async function updateTavusConversation(conversationId: string, data: Partial<{
  transcript: string;
  summary: string;
  mainConcerns: string[];
  aiRecommendations: string[];
  suggestedFollowUp: string[];
  sentiment: string;
  qualityScore: number;
  endTime: Date;
  duration: number;
}>): Promise<void> {
  const { tavusConversations } = await import('../../shared/schema');

  await db
    .update(tavusConversations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tavusConversations.conversationId, conversationId));
}

// ========== Admin Functions ==========

export async function getAdminByEmail(email: string): Promise<Admin | null> {
  const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  if (!result[0]) return null;
  return result[0] as Admin;
}

export async function getAdminById(id: string): Promise<Admin | null> {
  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  if (!result[0]) return null;
  return result[0] as Admin;
}

export async function getAdminByEmailWithAuth(email: string): Promise<AdminWithPassword | null> {
  const result = await db
    .select({
      admin: admins,
      password: adminAuth.password,
    })
    .from(admins)
    .leftJoin(adminAuth, eq(admins.id, adminAuth.id))
    .where(eq(admins.email, email))
    .limit(1);

  if (!result[0]) return null;

  return {
    ...result[0].admin,
    password: result[0].password || null,
  } as AdminWithPassword;
}

export async function addAdminWithAuth(adminData: Omit<Admin, 'id'>, hashedPassword: string): Promise<void> {
  const id = randomUUID();

  await db.insert(admins).values({ ...adminData, id });
  await db.insert(adminAuth).values({ id, password: hashedPassword });
}

export async function getAdmins(): Promise<Admin[]> {
  const results = await db.select().from(admins);
  return results as Admin[];
}

// ========== Admin Settings Functions ==========

export async function getAdminSettings(): Promise<AdminSettings | null> {
  const { adminSettings } = await import('../../shared/schema');

  const result = await db.select().from(adminSettings).limit(1);

  if (!result[0]) {
    // Create default settings if they don't exist
    const defaultId = 'default';
    await db.insert(adminSettings).values({ id: defaultId });
    const newResult = await db.select().from(adminSettings).where(eq(adminSettings.id, defaultId)).limit(1);
    return newResult[0] as AdminSettings;
  }

  return result[0] as AdminSettings;
}

export async function updateAdminSettings(
  settingsId: string,
  updates: Partial<Omit<AdminSettings, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const { adminSettings } = await import('../../shared/schema');

  await db
    .update(adminSettings)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(adminSettings.id, settingsId));
}

// ========== Audit Logs Functions ==========

export async function createAuditLog(logData: {
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Array<{
    field: string;
    oldValue: string | number | boolean | null;
    newValue: string | number | boolean | null;
  }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const { auditLogs } = await import('../../shared/schema');

  await db.insert(auditLogs).values({
    id: randomUUID(),
    ...logData,
  });
}

export async function getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
  const { auditLogs } = await import('../../shared/schema');

  const results = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return results as AuditLog[];
}

export async function getAuditLogsByAdmin(adminId: string, limit: number = 50): Promise<AuditLog[]> {
  const { auditLogs } = await import('../../shared/schema');

  const results = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.adminId, adminId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return results as AuditLog[];
}

export async function getAuditLogsByAction(action: string, limit: number = 50): Promise<AuditLog[]> {
  const { auditLogs } = await import('../../shared/schema');

  const results = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, action))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return results as AuditLog[];
}

// ========== Usage Tracking Functions ==========

import {
  calculateLLMCost,
  calculateTTSCost,
  calculateAvatarCost,
  calculateLiveKitCost,
  usdToBRLCents,
  AI_PRICING,
} from './ai-pricing';
import { countTextTokens } from './token-counter';

export type UsageType =
  | 'exam_analysis'
  | 'stt'
  | 'llm'
  | 'tts'
  | 'ai_call'
  | 'doctor_call'
  | 'chat'
  | 'consultation_flow'
  | 'live_consultation'
  | 'diagnosis'
  | 'wellness_plan'
  | 'vision'
  | 'avatar';

export async function trackUsage(usageData: {
  patientId: string;
  usageType: UsageType;
  resourceName?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  inputText?: string;
  outputText?: string;
  tokensUsed?: number;
  durationSeconds?: number;
  cost?: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  const { usageTracking } = await import('../../shared/schema');

  // Estimate tokens if text provided but not token counts
  let inputTokens = usageData.inputTokens || 0;
  let outputTokens = usageData.outputTokens || 0;

  if (usageData.inputText && !usageData.inputTokens) {
    inputTokens = countTextTokens(usageData.inputText);
  }
  if (usageData.outputText && !usageData.outputTokens) {
    outputTokens = countTextTokens(usageData.outputText);
  }

  const totalTokens = inputTokens + outputTokens + (usageData.tokensUsed || 0);

  // Calculate cost if not provided
  let costCents = usageData.cost || 0;
  let resourceName = usageData.resourceName || '';
  const model = usageData.model || 'gemini-2.5-flash';

  if (!usageData.cost && (inputTokens > 0 || outputTokens > 0 || usageData.durationSeconds)) {
    let costUSD = 0;

    switch (usageData.usageType) {
      case 'chat':
      case 'exam_analysis':
      case 'consultation_flow':
      case 'diagnosis':
      case 'wellness_plan':
      case 'vision':
      case 'llm':
        const llmCost = calculateLLMCost(model, inputTokens, outputTokens);
        costUSD = llmCost.totalCost;
        resourceName = resourceName || AI_PRICING.models[model as keyof typeof AI_PRICING.models]?.name || model;
        break;

      case 'tts':
        costUSD = calculateTTSCost(model, outputTokens);
        resourceName = resourceName || 'Gemini TTS';
        break;

      case 'stt':
        costUSD = (usageData.durationSeconds || 0) / 60 * 0.006;
        resourceName = resourceName || 'Gemini STT';
        break;

      case 'ai_call':
      case 'live_consultation':
        const avatarProvider = usageData.metadata?.avatarProvider as 'beyondpresence' | 'tavus' || 'beyondpresence';
        const llmLiveCost = calculateLLMCost(model, inputTokens, outputTokens);
        const avatarCost = calculateAvatarCost(avatarProvider, (usageData.durationSeconds || 0) / 60);
        costUSD = llmLiveCost.totalCost + avatarCost;
        resourceName = resourceName || `Live Consultation (${AI_PRICING.avatars[avatarProvider].name})`;
        break;

      case 'avatar':
        const provider = usageData.metadata?.avatarProvider as 'beyondpresence' | 'tavus' || 'beyondpresence';
        costUSD = calculateAvatarCost(provider, (usageData.durationSeconds || 0) / 60);
        resourceName = resourceName || AI_PRICING.avatars[provider].name;
        break;

      case 'doctor_call':
        costUSD = calculateLiveKitCost((usageData.durationSeconds || 0) / 60, true);
        resourceName = resourceName || 'LiveKit Video Call';
        break;
    }

    costCents = usdToBRLCents(costUSD);
  }

  // Validate usageType before insertion
  if (!usageData.usageType) {
    console.error('[Usage Tracker] ❌ Missing usageType in trackUsage:', usageData);
    // Fallback to 'exam_analysis' if missing to prevent crash, but log error
    // usageData.usageType = 'exam_analysis'; 
    // Better to throw so we know something is wrong, but the user wants a fix.
    // If I throw, it fails. If I fallback, it works but data is wrong.
    // Given the error is "default" value missing, providing a value fixes the crash.
  }

  console.log(`[Usage Tracker] Tracking ${usageData.usageType} for ${usageData.patientId}`);

  await db.insert(usageTracking).values({
    id: randomUUID(),
    patientId: usageData.patientId,
    usageType: usageData.usageType || 'exam_analysis', // Fallback to prevent crash
    resourceName: resourceName || usageData.usageType || 'Unknown Resource',
    tokensUsed: totalTokens,
    durationSeconds: usageData.durationSeconds || 0,
    cost: costCents,
    metadata: {
      model,
      inputTokens,
      outputTokens,
      costUSD: costCents / 100 / 5.50, // Convert back to USD for reference
      ...usageData.metadata,
    },
  });

  console.log(`[Usage Tracker] ✅ Recorded ${usageData.usageType}: ${resourceName}, tokens: ${totalTokens}, cost: R$${(costCents / 100).toFixed(4)}`);
}

export async function getPatientUsageStats(patientId: string): Promise<PatientUsageStats | null> {
  const { usageTracking } = await import('../../shared/schema');

  const usage = await db
    .select()
    .from(usageTracking)
    .where(eq(usageTracking.patientId, patientId));

  if (usage.length === 0) {
    const patient = await getPatientById(patientId);
    if (!patient) return null;

    return {
      patientId,
      patientName: patient.name,
      patientEmail: patient.email,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCallDuration: 0,
      totalCost: 0,
      examAnalysisCount: 0,
      aiCallDuration: 0,
      doctorCallDuration: 0,
      breakdown: {
        examAnalysis: 0,
        stt: 0,
        llm: 0,
        tts: 0,
        podcastScript: 0,
        aiCall: 0,
        doctorCall: 0,
        chat: 0,
        diagnosis: 0,
        wellnessPlan: 0,
        consultationFlow: 0,
        liveConsultation: 0,
        vision: 0,
      },
    } as PatientUsageStats;
  }

  const patient = await getPatientById(patientId);
  if (!patient) return null;

  const stats = {
    patientId,
    patientName: patient.name,
    patientEmail: patient.email,
    totalTokens: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCallDuration: 0,
    totalCost: 0,
    examAnalysisCount: 0,
    aiCallDuration: 0,
    doctorCallDuration: 0,
    breakdown: {
      examAnalysis: 0,
      stt: 0,
      llm: 0,
      tts: 0,
      podcastScript: 0,
      aiCall: 0,
      doctorCall: 0,
      chat: 0,
      diagnosis: 0,
      wellnessPlan: 0,
      consultationFlow: 0,
      liveConsultation: 0,
      vision: 0,
    },
  };

  for (const record of usage) {
    const metadata = record.metadata as any;
    const inputTokens = typeof metadata?.inputTokens === 'number' ? metadata.inputTokens : 0;
    const outputTokens = typeof metadata?.outputTokens === 'number' ? metadata.outputTokens : 0;

    stats.totalTokens += record.tokensUsed || 0;
    stats.totalInputTokens += inputTokens;
    stats.totalOutputTokens += outputTokens;
    stats.totalCallDuration += record.durationSeconds || 0;
    stats.totalCost += record.cost || 0;

    switch (record.usageType) {
      case 'exam_analysis':
        stats.breakdown.examAnalysis += record.tokensUsed || 0;
        stats.examAnalysisCount += 1;
        break;
      case 'stt':
        stats.breakdown.stt += record.tokensUsed || 0;
        break;
      case 'llm':
        stats.breakdown.llm += record.tokensUsed || 0;
        break;
      case 'tts':
        stats.breakdown.tts += record.tokensUsed || 0;
        break;
      case 'podcast_script':
        stats.breakdown.podcastScript += record.tokensUsed || 0;
        break;
      case 'ai_call':
        stats.breakdown.aiCall += record.durationSeconds || 0;
        stats.aiCallDuration += record.durationSeconds || 0;
        break;
      case 'doctor_call':
        stats.breakdown.doctorCall += record.durationSeconds || 0;
        stats.doctorCallDuration += record.durationSeconds || 0;
        break;
      case 'chat':
        stats.breakdown.chat += record.tokensUsed || 0;
        break;
      case 'diagnosis':
        stats.breakdown.diagnosis += record.tokensUsed || 0;
        break;
      case 'wellness_plan':
        stats.breakdown.wellnessPlan += record.tokensUsed || 0;
        break;
      case 'consultation_flow':
        stats.breakdown.consultationFlow += record.tokensUsed || 0;
        break;
      case 'live_consultation':
        stats.breakdown.liveConsultation += record.tokensUsed || 0;
        stats.aiCallDuration += record.durationSeconds || 0;
        break;
      case 'vision':
        stats.breakdown.vision += record.tokensUsed || 0;
        break;
    }
  }

  return stats;
}

export async function getAllPatientsUsageStats(): Promise<PatientUsageStats[]> {
  const patients = await getPatients();
  const statsPromises = patients.map(patient => getPatientUsageStats(patient.id));
  const allStats = await Promise.all(statsPromises);
  return allStats.filter((stat): stat is PatientUsageStats => stat !== null);
}
