
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { AvailabilitySlot } from '@/types';

// Garante que o app admin seja inicializado
import { admin } from '@/lib/firebase-admin'; 

const db = getFirestore();

// Tipagem para o estado da ação
interface ActionResult {
    message: string | null;
    errors: Record<string, string> | null;
    success: boolean;
}

export async function updateDoctorAvailabilityAction(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const session = await getSession();
    if (!session || session.role !== 'doctor' || !session.userId) {
        return { success: false, message: 'Não autorizado.', errors: null };
    }

    const { userId } = session;
    const dateStr = formData.get('date') as string;
    const timesJson = formData.get('times') as string;

    if (!dateStr || !timesJson) {
        return { success: false, message: 'Dados incompletos para atualizar a disponibilidade.', errors: null };
    }

    try {
        const selectedTimes = JSON.parse(timesJson) as string[];
        const targetDate = new Date(dateStr);

        // Busca o documento do médico
        const doctorRef = db.collection('doctors').doc(userId);
        const doctorDoc = await doctorRef.get();

        if (!doctorDoc.exists) {
             return { success: false, message: 'Perfil do médico não encontrado.', errors: null };
        }

        const doctorData = doctorDoc.data();
        const currentAvailability = doctorData?.availability || [];

        // Filtra a disponibilidade existente, mantendo apenas os horários de outros dias
        const otherDaysAvailability = currentAvailability.filter((slot: AvailabilitySlot) => {
            const slotDate = new Date(slot.date);
            return slotDate.toDateString() !== targetDate.toDateString();
        });

        // Cria os novos slots de disponibilidade para a data selecionada
        const newAvailabilityForDay: AvailabilitySlot[] = selectedTimes.map(time => ({
            date: targetDate.toISOString(),
            time: time,
            available: true, // Por padrão, um novo horário está disponível
        }));

        // Combina a disponibilidade de outros dias com a nova disponibilidade do dia
        const finalAvailability = [...otherDaysAvailability, ...newAvailabilityForDay];

        // Atualiza o documento no Firestore
        await doctorRef.update({ availability: finalAvailability });

        // Revalida o cache para que a UI seja atualizada
        revalidateTag(`doctor-availability-${userId}`);
        revalidatePath('/doctor/schedule');
        revalidatePath('/patient/doctors');

        return { success: true, message: 'Disponibilidade atualizada com sucesso!', errors: null };

    } catch (error) {
        console.error("Erro ao atualizar disponibilidade:", error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        return { success: false, message: `Falha ao salvar: ${errorMessage}`, errors: null };
    }
}
