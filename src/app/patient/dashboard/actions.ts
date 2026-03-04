"use server";

import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { updatePatient } from "@/lib/db-adapter";

export async function updatePatientHealthDataAction(data: {
    weight?: string;
    height?: string;
    reportedSymptoms?: string;
}): Promise<{ success: boolean; message: string }> {
    const session = await getSession();
    if (!session || session.role !== "patient") {
        return { success: false, message: "Não autorizado." };
    }

    const { userId } = session;

    const updatePayload: Record<string, any> = {};

    if (data.weight !== undefined) updatePayload.weight = data.weight;
    if (data.height !== undefined) updatePayload.height = data.height;
    if (data.reportedSymptoms !== undefined) updatePayload.reportedSymptoms = data.reportedSymptoms;

    if (Object.keys(updatePayload).length === 0) {
        return { success: false, message: "Nenhum dado para atualizar." };
    }

    try {
        await updatePatient(userId, updatePayload);
        revalidatePath("/patient/dashboard");

        return { success: true, message: "Dados de saúde atualizados com sucesso!" };
    } catch (error) {
        console.error("[HealthCheckin] Erro ao salvar dados:", error);
        return {
            success: false,
            message: "Falha ao salvar os dados no servidor.",
        };
    }
}
