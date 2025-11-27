
'use server';

import { getDoctorById, updateDoctorAvailability, deleteAppointment } from '@/lib/db-adapter';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CancelAppointmentSchema = z.object({
    appointmentId: z.string().min(1),
    doctorId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}(-\d{2}:\d{2})?$/),
});

export async function cancelAppointmentAction(prevState: any, formData: FormData) {
    const validatedFields = CancelAppointmentSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Dados inválidos para cancelamento.',
        };
    }

    const { appointmentId, doctorId, date, time } = validatedFields.data;

    try {
        const doctor = await getDoctorById(doctorId);

        if (!doctor) {
            throw new Error('Médico não encontrado.');
        }

        await deleteAppointment(appointmentId);

        const updatedAvailability = (doctor.availability || []).map(slot => 
            (slot.date === date && slot.time === time) ? { ...slot, available: true } : slot
        );
        await updateDoctorAvailability(doctorId, updatedAvailability);

        // 3. Revalidar os paths para atualizar a UI
        revalidatePath('/patient/doctors');
        revalidatePath('/doctor/schedule');

        return { success: true, message: 'Consulta cancelada com sucesso!' };
    } catch (error: any) {
        console.error("Error canceling appointment:", error);
        return { success: false, message: `Falha ao cancelar a consulta: ${error.message}` };
    }
}
