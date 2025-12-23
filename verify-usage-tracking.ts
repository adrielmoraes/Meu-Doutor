
import 'dotenv/config';
import { trackAIUsage } from './src/lib/usage-tracker';
import { db } from './server/storage';
import { usageTracking } from './shared/schema';
import { desc } from 'drizzle-orm';

async function testUsageTracking() {
    try {
        console.log('🧪 Testing Usage Tracking for Podcast...');
        const patientId = 'test-patient-id'; // Use a dummy or valid patient ID if FK constraint exists
        // Note: FK constraint exists to patients table. I need a valid patient ID.
        // Let's find a valid patient first.
        
        const patient = await db.query.patients.findFirst();
        if (!patient) {
            console.error('❌ No patients found in database. Cannot test tracking (FK constraint).');
            return;
        }

        console.log(`👤 Using patient: ${patient.id} (${patient.name})`);

        // Test 1: Podcast Script Tracking
        console.log('📝 Testing Script Tracking...');
        await trackAIUsage({
            patientId: patient.id,
            usageType: 'podcast_script',
            model: 'gemini-2.5-flash-lite',
            inputTokens: 1000,
            outputTokens: 500,
            metadata: {
                feature: 'test-script',
            }
        });
        console.log('✅ Script tracking called successfully.');

        // Test 2: Podcast Audio Tracking
        console.log('🔊 Testing Audio Tracking...');
        await trackAIUsage({
            patientId: patient.id,
            usageType: 'tts',
            model: 'gemini-2.5-flash-preview-tts',
            inputTokens: 500,
            outputTokens: 180 * 60, // 1 minute of audio
            metadata: {
                feature: 'test-audio',
                durationMs: 60000,
            }
        });
        console.log('✅ Audio tracking called successfully.');

        // Verify insertion
        const logs = await db.select().from(usageTracking).orderBy(desc(usageTracking.createdAt)).limit(2);
        console.log('📊 Recent usage logs:');
        logs.forEach(log => {
            console.log(`- Type: ${log.usageType}, Cost: ${log.cost}, Resource: ${log.resourceName}`);
        });

        if (logs.length >= 2) {
            console.log('✅ Usage tracking verification PASSED.');
        } else {
            console.error('❌ Usage tracking verification FAILED: Not enough logs found.');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    }
    process.exit(0);
}

testUsageTracking();
