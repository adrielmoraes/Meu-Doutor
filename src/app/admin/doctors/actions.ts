'use server';

import { approveDoctor, deleteDoctor, getDoctorById } from "@/lib/db-adapter";
import { revalidatePath } from "next/cache";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email-service";

export async function approveDoctorAction(doctorId: string) {
  try {
    const doctor = await getDoctorById(doctorId);
    if (!doctor) return { success: false, message: 'Médico não encontrado.' };

    await approveDoctor(doctorId);
    
    // Enviar email
    try {
        await sendApprovalEmail(doctor.email, doctor.name);
    } catch (emailError) {
        console.error('Erro ao enviar email de aprovação:', emailError);
        // Não falhar a ação inteira se o email falhar, mas logar
    }

    revalidatePath('/admin/doctors');
    return { success: true, message: 'Médico aprovado com sucesso!' };
  } catch (error) {
    console.error('Erro ao aprovar médico:', error);
    return { success: false, message: 'Erro ao aprovar médico.' };
  }
}

export async function rejectDoctorAction(doctorId: string, reason: string) {
  try {
    const doctor = await getDoctorById(doctorId);
    if (!doctor) return { success: false, message: 'Médico não encontrado.' };

    await deleteDoctor(doctorId);
    
    try {
        await sendRejectionEmail(doctor.email, doctor.name, reason);
    } catch (emailError) {
        console.error('Erro ao enviar email de rejeição:', emailError);
    }

    revalidatePath('/admin/doctors');
    return { success: true, message: 'Médico rejeitado e removido.' };
  } catch (error) {
    console.error('Erro ao rejeitar médico:', error);
    return { success: false, message: 'Erro ao rejeitar médico.' };
  }
}
