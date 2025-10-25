/**
 * Sistema de Agendamento de Consultas para MediAI
 */

import { db } from '../../server/storage';
import { appointments } from '../../shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { Appointment } from '@/types';
import { randomUUID } from 'crypto';

export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
  appointmentId?: string;
}

export interface ScheduleParams {
  doctorId: string;
  patientId: string;
  patientName: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  type: 'consultation' | 'follow-up' | 'emergency';
  notes?: string;
}

/**
 * Agenda uma nova consulta (verifica conflitos primeiro)
 */
export async function scheduleAppointment(params: ScheduleParams): Promise<string> {
  // Verificar se o horário está disponível
  const isAvailable = await isTimeSlotAvailable(
    params.doctorId,
    params.appointmentDate,
    params.startTime,
    params.endTime
  );

  if (!isAvailable) {
    throw new Error('Horário não disponível. Por favor, escolha outro horário.');
  }

  const id = randomUUID();
  
  await db.insert(appointments).values({
    id,
    doctorId: params.doctorId,
    patientId: params.patientId,
    patientName: params.patientName,
    appointmentDate: params.appointmentDate,
    startTime: params.startTime,
    endTime: params.endTime,
    status: 'scheduled',
    type: params.type,
    notes: params.notes || '',
  });

  return id;
}

/**
 * Verifica se um horário está disponível
 */
export async function isTimeSlotAvailable(
  doctorId: string,
  date: Date,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        gte(appointments.appointmentDate, startOfDay),
        lte(appointments.appointmentDate, endOfDay),
        eq(appointments.status, 'scheduled')
      )
    );

  // Verificar conflitos de horário
  for (const apt of existingAppointments) {
    const aptStart = apt.startTime;
    const aptEnd = apt.endTime;
    
    // Horários se sobrepõem?
    if (
      (startTime >= aptStart && startTime < aptEnd) ||
      (endTime > aptStart && endTime <= aptEnd) ||
      (startTime <= aptStart && endTime >= aptEnd)
    ) {
      return false; // Conflito encontrado
    }
  }

  return true; // Horário disponível
}

/**
 * Busca horários disponíveis para um médico em um dia
 */
export async function getAvailableSlots(
  doctorId: string,
  date: Date,
  slotDuration: number = 30 // minutos
): Promise<TimeSlot[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Buscar compromissos existentes
  const existingAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        gte(appointments.appointmentDate, startOfDay),
        lte(appointments.appointmentDate, endOfDay),
        eq(appointments.status, 'scheduled')
      )
    );

  // Gerar slots de 8h às 18h
  const slots: TimeSlot[] = [];
  const workStart = 8 * 60; // 8:00 em minutos
  const workEnd = 18 * 60; // 18:00 em minutos

  for (let time = workStart; time < workEnd; time += slotDuration) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const endMinutes = time + slotDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    // Verificar se está ocupado
    const isOccupied = existingAppointments.some(apt => {
      const aptStart = apt.startTime;
      const aptEnd = apt.endTime;
      
      return (
        (startTime >= aptStart && startTime < aptEnd) ||
        (endTime > aptStart && endTime <= aptEnd) ||
        (startTime <= aptStart && endTime >= aptEnd)
      );
    });

    slots.push({
      date,
      startTime,
      endTime,
      available: !isOccupied,
      appointmentId: isOccupied
        ? existingAppointments.find(apt => 
            (startTime >= apt.startTime && startTime < apt.endTime) ||
            (endTime > apt.startTime && endTime <= apt.endTime)
          )?.id
        : undefined,
    });
  }

  return slots;
}

/**
 * Cancela uma consulta
 */
export async function cancelAppointment(appointmentId: string): Promise<void> {
  await db
    .update(appointments)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));
}

/**
 * Confirma uma consulta
 */
export async function confirmAppointment(appointmentId: string): Promise<void> {
  await db
    .update(appointments)
    .set({ status: 'confirmed', updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));
}

/**
 * Marca consulta como concluída
 */
export async function completeAppointment(appointmentId: string): Promise<void> {
  await db
    .update(appointments)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));
}
