
'use server';

import { getDoctorById, updateDoctorAvailability } from '@/lib/db-adapter';
import { getSession } from '@/lib/session';
import { revalidatePath, revalidateTag } from 'next/cache';

// Tipos locais
type AvailabilitySlot = { date: string; time: string; available: boolean };

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
        if (!timesJson || timesJson.trim() === '') {
            return { success: false, message: 'Nenhum horário selecionado.', errors: null };
        }
        
        const selectedTimes = JSON.parse(timesJson) as string[];
        
        console.log('[UpdateAvailability] Data recebida:', dateStr);
        console.log('[UpdateAvailability] Horários selecionados:', selectedTimes);

        const doctor = await getDoctorById(userId);
        if (!doctor) {
             return { success: false, message: 'Perfil do médico não encontrado.', errors: null };
        }

        const currentAvailability = doctor.availability || [];
        console.log('[UpdateAvailability] Disponibilidade atual:', JSON.stringify(currentAvailability));

        // CORREÇÃO: Usar formato yyyy-MM-dd consistente em vez de ISO
        const otherDaysAvailability = currentAvailability.filter((slot: AvailabilitySlot) => {
            return slot.date !== dateStr;
        });

        const newAvailabilityForDay: AvailabilitySlot[] = selectedTimes.map(time => ({
            date: dateStr, // Usar formato yyyy-MM-dd diretamente
            time: time,
            available: true,
        }));

        const finalAvailability = [...otherDaysAvailability, ...newAvailabilityForDay];
        
        console.log('[UpdateAvailability] Nova disponibilidade final:', JSON.stringify(finalAvailability));

        await updateDoctorAvailability(userId, finalAvailability);

        // Revalida o cache para que a UI seja atualizada
        revalidateTag(`doctor-availability-${userId}`);
        revalidatePath('/doctor/schedule');
        revalidatePath('/patient/doctors');

        return { success: true, message: `Disponibilidade atualizada! ${selectedTimes.length} horário(s) salvo(s) para ${dateStr}`, errors: null };

    } catch (error) {
        console.error("Erro ao atualizar disponibilidade:", error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        return { success: false, message: `Falha ao salvar: ${errorMessage}`, errors: null };
    }
}
