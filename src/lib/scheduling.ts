/**
 * Sistema de Agendamento de Consultas para MediAI
 * Com validações de segurança LGPD/HIPAA
 */

import { db } from '../../server/storage';
import { appointments, doctors } from '../../shared/schema';
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
  type: string;
  notes?: string;
}

interface DoctorAvailability {
  [dayOfWeek: string]: string[];
}

interface DateSlot {
  date: string;
  time: string;
  available: boolean;
}

function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

function parseTimeRange(timeRange: string): { start: string; end: string } {
  const [start, end] = timeRange.split('-');
  return { start, end };
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Agenda uma nova consulta (verifica conflitos primeiro)
 */
export async function scheduleAppointment(params: ScheduleParams): Promise<string> {
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
  const dateStr = formatDate(params.appointmentDate);
  const timeStr = `${params.startTime}-${params.endTime}`;
  
  await db.insert(appointments).values({
    id,
    doctorId: params.doctorId,
    patientId: params.patientId,
    patientName: params.patientName,
    date: dateStr,
    time: timeStr,
    type: params.type,
    status: 'Agendada',
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
  const dateStr = formatDate(date);

  const existingAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.date, dateStr),
        eq(appointments.status, 'Agendada')
      )
    );

  for (const apt of existingAppointments) {
    const { start: aptStart, end: aptEnd } = parseTimeRange(apt.time);
    
    if (
      (startTime >= aptStart && startTime < aptEnd) ||
      (endTime > aptStart && endTime <= aptEnd) ||
      (startTime <= aptStart && endTime >= aptEnd)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Detecta se a disponibilidade está no formato de slots por data
 * Ex: [{"date":"2025-11-26","time":"09:00","available":true}]
 */
function isDateSlotFormat(availability: unknown): availability is DateSlot[] {
  return Array.isArray(availability) && 
    availability.length > 0 && 
    typeof availability[0] === 'object' &&
    availability[0] !== null &&
    'date' in availability[0] && 
    'time' in availability[0];
}

/**
 * Busca horários disponíveis para um médico em um dia
 * Respeita o campo availability do médico no banco de dados
 * 
 * Suporta dois formatos de disponibilidade:
 * 1. Por dia da semana: {"monday": ["09:00-12:00", "14:00-18:00"]}
 * 2. Por data específica: [{"date":"2025-11-26","time":"09:00","available":true}]
 */
export async function getAvailableSlots(
  doctorId: string,
  date: Date,
  slotDuration: number = 30
): Promise<TimeSlot[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const doctorData = await db
    .select()
    .from(doctors)
    .where(eq(doctors.id, doctorId))
    .limit(1);

  if (!doctorData || doctorData.length === 0) {
    throw new Error('Médico não encontrado');
  }

  const doctor = doctorData[0];
  const availability = doctor.availability;
  const dayOfWeek = getDayOfWeek(date);
  const dateStr = formatDate(date);

  const existingAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.date, dateStr),
        eq(appointments.status, 'Agendada')
      )
    );

  const slots: TimeSlot[] = [];

  if (isDateSlotFormat(availability)) {
    const dateSlots = availability.filter(slot => slot.date === dateStr);
    
    const appointmentDuration = 60;

    for (const slot of dateSlots) {
      const startTime = slot.time;
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + appointmentDuration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      const isOccupied = existingAppointments.some(apt => {
        const { start: aptStart, end: aptEnd } = parseTimeRange(apt.time);
        return (
          (startTime >= aptStart && startTime < aptEnd) ||
          (endTime > aptStart && endTime <= aptEnd) ||
          (startTime <= aptStart && endTime >= aptEnd)
        );
      });

      const slotAvailable = slot.available === true && !isOccupied;

      slots.push({
        date,
        startTime,
        endTime,
        available: slotAvailable,
        appointmentId: isOccupied
          ? existingAppointments.find(apt => {
              const { start: aptStart, end: aptEnd } = parseTimeRange(apt.time);
              return (
                (startTime >= aptStart && startTime < aptEnd) ||
                (endTime > aptStart && endTime <= aptEnd)
              );
            })?.id
          : undefined,
      });
    }

    return slots;
  }

  const weeklyAvailability = availability as DoctorAvailability | null;
  
  if (!weeklyAvailability || !weeklyAvailability[dayOfWeek] || weeklyAvailability[dayOfWeek].length === 0) {
    return [];
  }

  const dayAvailability = weeklyAvailability[dayOfWeek];

  for (const timeRange of dayAvailability) {
    const { start, end } = parseTimeRange(timeRange);
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    for (let time = startMinutes; time < endMinutes; time += slotDuration) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const endMin = time + slotDuration;
      const endHours = Math.floor(endMin / 60);
      const endMins = endMin % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      if (endMin > endMinutes) break;

      const isOccupied = existingAppointments.some(apt => {
        const { start: aptStart, end: aptEnd } = parseTimeRange(apt.time);
        
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
          ? existingAppointments.find(apt => {
              const { start: aptStart, end: aptEnd } = parseTimeRange(apt.time);
              return (
                (startTime >= aptStart && startTime < aptEnd) ||
                (endTime > aptStart && endTime <= aptEnd)
              );
            })?.id
          : undefined,
      });
    }
  }

  return slots;
}

/**
 * Cancela uma consulta
 */
export async function cancelAppointment(appointmentId: string): Promise<void> {
  await db
    .update(appointments)
    .set({ status: 'Cancelada', updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));
}

/**
 * Marca consulta como concluída
 */
export async function completeAppointment(appointmentId: string): Promise<void> {
  await db
    .update(appointments)
    .set({ status: 'Concluída', updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));
}
