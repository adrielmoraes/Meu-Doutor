'use server';

import { updateDoctorStatus } from '@/lib/db-adapter';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function toggleDoctorOnlineStatus(online: boolean) {
  const session = await getSession();
  
  if (!session || session.role !== 'doctor' || !session.userId) {
    return { success: false, message: 'Não autorizado.' };
  }

  try {
    await updateDoctorStatus(session.userId, online);
    console.log(`[ToggleStatus] Médico ${session.userId} agora está ${online ? 'ONLINE' : 'OFFLINE'}`);
    
    // Revalidar páginas relevantes
    revalidatePath('/doctor');
    revalidatePath('/patient/doctors');
    
    return { 
      success: true, 
      message: online ? 'Você está online agora!' : 'Você está offline.',
      online 
    };
  } catch (error) {
    console.error('[ToggleStatus] Erro ao atualizar status:', error);
    return { success: false, message: 'Erro ao atualizar status.' };
  }
}
