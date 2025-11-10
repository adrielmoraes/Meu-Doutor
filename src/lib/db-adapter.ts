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
    await db.insert(doctors).values({
      id: doctorId,
      ...doctor,
      verificationToken: verificationToken || null,
      tokenExpiry: tokenExpiry || null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Inserir autenticação
    await db.insert(doctorAuth).values({
      id: doctorId,
      password,
      createdAt: new Date(),
    });

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

  try {
    // Inserir paciente
    await db.insert(patients).values({
      id: patientId,
      ...patient,
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
  examData: Omit<Exam, 'id' | 'date' | 'status' | 'patientId'>
): Promise<string> {
  const id = randomUUID();
  const examRecord = {
    ...examData,
    id,
    patientId,
    date: new Date().toISOString(),
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

export async function updatePatientWellnessPlan(
  patientId: string,
  wellnessPlan: {
    dietaryPlan: string;
    exercisePlan: string;
    mentalWellnessPlan: string;
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

export async function trackUsage(usageData: {
  patientId: string;
  usageType: 'exam_analysis' | 'stt' | 'llm' | 'tts' | 'ai_call' | 'doctor_call' | 'chat';
  resourceName?: string;
  tokensUsed?: number;
  durationSeconds?: number;
  cost?: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  const { usageTracking } = await import('../../shared/schema');

  await db.insert(usageTracking).values({
    id: randomUUID(),
    patientId: usageData.patientId,
    usageType: usageData.usageType,
    resourceName: usageData.resourceName || null,
    tokensUsed: usageData.tokensUsed || 0,
    durationSeconds: usageData.durationSeconds || 0,
    cost: usageData.cost || 0,
    metadata: usageData.metadata || null,
  });
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
        aiCall: 0,
        doctorCall: 0,
        chat: 0,
      },
    };
  }

  const patient = await getPatientById(patientId);
  if (!patient) return null;

  const stats = {
    patientId,
    patientName: patient.name,
    patientEmail: patient.email,
    totalTokens: 0,
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
      aiCall: 0,
      doctorCall: 0,
      chat: 0,
    },
  };

  for (const record of usage) {
    stats.totalTokens += record.tokensUsed || 0;
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