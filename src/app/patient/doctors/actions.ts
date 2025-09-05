
'use server';

import { getAppointmentsByDate, getPatientById, getDoctorById, addAppointment, updateDoctorAvailability } from "@/lib/firestore-admin-adapter";
import { format } from "date-fns";
import { z } from 'zod';

// Defines a standard work day for doctors
const allPossibleTimes = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

/**
 * Calculates available appointment times for a given date by checking existing appointments.
 * @param doctorId The ID of the doctor.
 * @param date The selected date.
 * @returns A list of available time slots.
 */
export async function getAvailableTimesAction(doctorId: string, date: Date): Promise<string[]> {
    try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const existingAppointments = await getAppointmentsByDate(doctorId, formattedDate);

        const bookedTimes = new Set(existingAppointments.map(appt => appt.time));

        const doctor = await getDoctorById(doctorId); // Obter disponibilidade do médico
        if (!doctor || !doctor.availability) {
            return []; // Se o médico não tiver disponibilidade definida, não há horários
        }

        const doctorAvailableTimes = doctor.availability
            .filter(slot => slot.date === formattedDate && slot.available)
            .map(slot => slot.time);

        const availableTimes = allPossibleTimes.filter(time => 
            !bookedTimes.has(time) && doctorAvailableTimes.includes(time)
        );

        return availableTimes;

    } catch (error) {
        console.error("Error fetching available times:", error);
        // In case of an error, return no available times to be safe.
        return [];
    }
}

// Schema para validação do agendamento
const ScheduleSchema = z.object({
    doctorId: z.string().min(1, { message: "ID do médico é obrigatório." }),
    patientId: z.string().min(1, { message: "ID do paciente é obrigatório." }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de data inválido (YYYY-MM-DD)." }),
    time: z.string().regex(/^\d{2}:\d{2}$/, { message: "Formato de hora inválido (HH:MM)." }),
    type: z.enum(['Consulta Online (Vídeo)', 'Consulta Online (Voz)', 'Consulta Presencial']), // Definir tipos de consulta
});

export async function scheduleAppointmentAction(prevState: any, formData: FormData) {
    const validatedFields = ScheduleSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Erro de validação. Por favor, corrija os campos destacados.',
        };
    }

    const { doctorId, patientId, date, time, type } = validatedFields.data;

    try {
        // 1. Verificar se o slot ainda está disponível (evitar agendamento duplo)
        const doctor = await getDoctorById(doctorId);
        if (!doctor || !doctor.availability) {
            return { ...prevState, message: 'Médico não encontrado ou sem disponibilidade definida.' };
        }

        const targetSlot = doctor.availability.find(
            slot => slot.date === date && slot.time === time && slot.available
        );

        if (!targetSlot) {
            return { ...prevState, message: 'Horário selecionado não está mais disponível.' };
        }

        // 2. Obter informações do paciente e médico para o agendamento
        const patient = await getPatientById(patientId);
        if (!patient) {
            return { ...prevState, message: 'Paciente não encontrado.' };
        }

        // 3. Criar o agendamento
        const newAppointment = {
            patientId: patient.id,
            patientName: patient.name,
            patientAvatar: patient.avatar,
            doctorId: doctor.id,
            doctorName: doctor.name, // Adicionado nome do doutor para exibição
            doctorSpecialty: doctor.specialty, // Adicionado especialidade do doutor
            date: date,
            time: time,
            type: type,
            status: 'Agendada',
        };

        await addAppointment(newAppointment); // Supondo que addAppointment existe no admin-adapter

        // 4. Atualizar a disponibilidade do médico (marcar slot como indisponível)
        const updatedAvailability = doctor.availability.map(slot =>
            slot.date === date && slot.time === time ? { ...slot, available: false } : slot
        );
        await updateDoctorAvailability(doctorId, updatedAvailability); // Supondo que updateDoctorAvailability existe

        return {
            ...prevState,
            success: true,
            message: 'Consulta agendada com sucesso!',
        };

    } catch (error) {
        console.error("Error scheduling appointment:", error);
        return { ...prevState, message: 'Erro ao agendar consulta. Por favor, tente novamente.' };
    }
}
