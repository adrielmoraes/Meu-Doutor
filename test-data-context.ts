import 'dotenv/config';
import { db } from './src/server/storage';
import { patients, exams, appointments } from './shared/schema';
import { eq, gte, and } from 'drizzle-orm';
import { getPatientById, getRecentExamsForPodcast } from './src/lib/db-adapter';

async function verifyData() {
    console.log("1. Buscando um paciente de teste...");
    const patientResult = await db.select().from(patients).limit(1);
    const patient = patientResult[0];

    if (!patient) {
        console.error("Nenhum paciente encontrado no banco de dados.");
        process.exit(1);
    }

    console.log(`Paciente selecionado: ${patient.name} (${patient.id})`);

    console.log("\n2. Verificando dados base do paciente obtidos via db-adapter...");
    const patientData = await getPatientById(patient.id);
    if (!patientData) {
        console.error("Erro: getPatientById retornou null");
    } else {
        console.log("Plano de Bem-Estar presente?", !!patientData.wellnessPlan);
        if (patientData.wellnessPlan) {
            console.log("Tamanho da análise preliminar:", patientData.wellnessPlan.preliminaryAnalysis?.length || 0, "caracteres");
        }
    }

    console.log("\n3. Verificando Exames Recentes...");
    const examsData = await getRecentExamsForPodcast(patient.id, 7);
    console.log(`Total de exames retornados: ${examsData.length}`);
    if (examsData.length > 0) {
        examsData.forEach((e, idx) => {
            console.log(`  Exame ${idx + 1}: ${e.type} - Data: ${e.date}`);
            console.log(`  Resultado Preliminar presente: ${!!e.preliminaryDiagnosis}`);
        });
    }

    console.log("\n4. Verificando Consultas Agendadas Futuras...");
    const now = new Date().toISOString();
    const upcomingAppointments = await db.select()
        .from(appointments)
        .where(
            and(
                eq(appointments.patientId, patient.id),
                eq(appointments.status, 'Agendada'),
                gte(appointments.date, now.split('T')[0])
            )
        )
        .orderBy(appointments.date)
        .limit(2);

    console.log(`Total de consultas futuras: ${upcomingAppointments.length}`);
    if (upcomingAppointments.length > 0) {
        upcomingAppointments.forEach((a, idx) => {
            console.log(`  Consulta ${idx + 1}: ${a.type} com ${a.patientName} em ${a.date} às ${a.time}`);
        });
    }

    console.log("\n--- DADOS QUE IRÃO PARA O PROMPT ---");

    const examContext = examsData.length > 0
        ? examsData
            .map(
                (e) =>
                    `Exame: ${e.type} (${e.date ? new Date(e.date).toLocaleDateString("pt-BR") : "Sem data"})\nResultado: ${((e.preliminaryDiagnosis || e.result || "Sem análise").toString()).slice(0, 100)}...`
            )
            .join("\n\n")
        : "Nenhum exame registrado recentemente.";

    const wellnessContext = patientData?.wellnessPlan?.preliminaryAnalysis
        ? `Análise de Saúde: ${(patientData.wellnessPlan.preliminaryAnalysis).slice(0, 100)}...`
        : "Sem plano de bem-estar no momento.";

    const agendaContext = upcomingAppointments.length > 0
        ? upcomingAppointments.map(a => `- ${a.type} com Dr(a). ${a.patientName.includes('Dr') ? a.patientName : 'Médico'} em ${new Date(a.date).toLocaleDateString('pt-BR')} às ${a.time}`).join('\n')
        : "Nenhum compromisso agendado.";

    console.log("EXAMES CONTEXT:\n", examContext);
    console.log("\nWELLNESS CONTEXT:\n", wellnessContext);
    console.log("\nAGENDA CONTEXT:\n", agendaContext);

    process.exit(0);
}

verifyData().catch(console.error);
