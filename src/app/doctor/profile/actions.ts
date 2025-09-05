
'use server';

import { getDoctorById, updateDoctorAvailability } from '@/lib/firestore-admin-adapter';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const AvailabilitySlotSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de data inválido (YYYY-MM-DD)." }),
    time: z.string().regex(/^\d{2}:\d{2}$/, { message: "Formato de hora inválido (HH:MM)." }),
    available: z.boolean(),
});

const UpdateAvailabilitySchema = z.object({
    doctorId: z.string().min(1, { message: "ID do médico é obrigatório." }),
    availability: z.array(AvailabilitySlotSchema),
});

export async function updateDoctorAvailabilityAction(prevState: any, formData: FormData) {
    const doctorId = formData.get('doctorId') as string;
    const availabilityJson = formData.get('availability') as string;

    let availabilityData;
    try {
        availabilityData = JSON.parse(availabilityJson);
    } catch (e) {
        console.error("Failed to parse availability JSON:", e);
        return { ...prevState, message: 'Dados de disponibilidade inválidos.' };
    }

    const validatedFields = UpdateAvailabilitySchema.safeParse({
        doctorId,
        availability: availabilityData,
    });

    if (!validatedFields.success) {
        console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Erro de validação nos dados de disponibilidade.',
        };
    }

    try {
        await updateDoctorAvailability(validatedFields.data.doctorId, validatedFields.data.availability);
        revalidatePath('/doctor/profile'); // Revalidar o cache da página
        revalidatePath('/patient/doctors'); // Revalidar para que pacientes vejam a nova disponibilidade

        return { ...prevState, success: true, message: 'Disponibilidade atualizada com sucesso!' };
    } catch (error) {
        console.error("Error updating doctor availability:", error);
        return { ...prevState, message: 'Falha ao atualizar a disponibilidade. Tente novamente.' };
    }
}
