import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/server/storage';
import { patients } from './shared/schema';
import { generateHealthPodcast } from './src/ai/flows/generate-health-podcast';
import { eq } from 'drizzle-orm';

async function main() {
    console.log("Finding patient...");
    const patientResult = await db.select().from(patients).limit(1);
    const patient = patientResult[0];

    if (!patient) {
        console.error("No patient found.");
        return;
    }

    console.log(`Found patient: ${patient.name} (${patient.id})`);

    // We import generateHealthPodcast but wait, we want to see the error. The error is logged to console inside runBackgroundGeneration.
    // If the process exits too fast, we might not see it. Let's patch the function or just run it and block.

    const { healthPodcastFlow } = require('./src/ai/flows/generate-health-podcast'); // Un-exported wait...

    // Since `generateHealthPodcast` is exported, let's just call it and then keep the process alive for 30s.
    await generateHealthPodcast({ patientId: patient.id });

    console.log("Waiting 60 seconds to allow background process to complete/fail...");
    await new Promise(r => setTimeout(r, 60000));
}

main().then(() => { process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
