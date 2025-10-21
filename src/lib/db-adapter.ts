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
import type { Doctor, DoctorWithPassword, Patient, PatientWithPassword, Admin, AdminWithPassword, Exam, Appointment, Consultation } from '@/types';
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
  doctorData: Omit<Doctor, 'id'>, 
  hashedPassword: string,
  verificationToken?: string,
  tokenExpiry?: Date
): Promise<string> {
  const id = randomUUID();
  
  await db.insert(doctors).values({ 
    ...doctorData, 
    id,
    emailVerified: false,
    verificationToken: verificationToken || null,
    tokenExpiry: tokenExpiry || null,
  });
  await db.insert(doctorAuth).values({ id, password: hashedPassword });
  
  return id;
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
  patientData: Omit<Patient, 'id'>, 
  hashedPassword: string,
  verificationToken?: string,
  tokenExpiry?: Date
): Promise<string> {
  const id = randomUUID();
  
  await db.insert(patients).values({ 
    ...patientData, 
    id,
    emailVerified: false,
    verificationToken: verificationToken || null,
    tokenExpiry: tokenExpiry || null,
  });
  await db.insert(patientAuth).values({ id, password: hashedPassword });
  
  return id;
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
      icon: 'Droplet' | 'Clock' | 'Coffee' | 'Bed' | 'Dumbbell';
      title: string;
      description: string;
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
