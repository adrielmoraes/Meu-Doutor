
import { PrismaClient } from '@prisma/client';
import { generateHealthPodcast } from './src/ai/flows/generate-health-podcast';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("Finding patient with exams...");
    const patient = await prisma.user.findFirst({
        where: {
            role: 'patient',
            exams: { some: {} }
        },
        include: { exams: true }
    });

    if (!patient) {
        console.error("No patient with exams found.");
        return;
    }

    console.log(`Found patient: ${patient.name} (${patient.id}) with ${patient.exams.length} exams.`);
    console.log("Generating Podcast...");

    try {
        // Calling the tool directly. Genkit tools are callable.
        // If it returns a tool action, we might need to .run(), but usually the export is the callable.
        // Let's check if export is 'tool' wrapper.
        // Yes, it is. The 'tool' function from genkit usually returns an executable action.
        // Depending on genkit version, it might be `await generateHealthPodcast(input)`.
        const result = await generateHealthPodcast({ patientId: patient.id });

        console.log(`Podcast generation started. ID: ${result.podcastId}, Status: ${result.status}`);
        console.log("Check database for completion (this is now an async background process).");
        
        /*
        console.log("\n--- PODCAST TRANSCRIPT ---\n");
        console.log(result.transcript);
        console.log("\n--- END TRANSCRIPT ---\n");
        console.log(`Audio generated (length: ${result.audioUrl.length} chars base64)`);
        */

    } catch (e) {
        console.error("Error generating podcast:", e);
    }
}

main();
