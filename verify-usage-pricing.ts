
import 'dotenv/config';
import { trackAIUsage } from './src/lib/usage-tracker';
import { db } from './server/storage';
import { usageTracking } from './shared/schema';
import { desc } from 'drizzle-orm';

async function testUsageTracking() {
    try {
        console.log('🧪 Testing Usage Tracking for Podcast (Inputs + Outputs)...');
        
        const patient = await db.query.patients.findFirst();
        if (!patient) {
            console.error('❌ No patients found in database.');
            return;
        }

        console.log(`👤 Using patient: ${patient.id} (${patient.name})`);

        // Test 1: Podcast Audio Tracking with Inputs and Outputs
        console.log('🔊 Testing Audio Tracking with Input Tokens...');
        // Model: gemini-2.5-flash-preview-tts
        // Input Price: $0.50 / 1M tokens
        // Output Price: $10.00 / 1M tokens
        
        const inputTokens = 1000;
        const outputTokens = 180 * 60; // 10800 tokens

        // Expected Cost Calculation:
        // Input Cost: (1000 / 1_000_000) * 0.50 = 0.0005
        // Output Cost: (10800 / 1_000_000) * 10.00 = 0.108
        // Total Expected USD: 0.1085
        // Total Expected BRL (rate 5.42): 0.1085 * 5.42 = 0.58807 -> ~59 cents

        await trackAIUsage({
            patientId: patient.id,
            usageType: 'tts',
            model: 'gemini-2.5-flash-preview-tts',
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            metadata: {
                feature: 'test-audio-full-pricing',
                durationMs: 60000,
            }
        });
        console.log('✅ Audio tracking called successfully.');

        // Verify insertion
        const logs = await db.select().from(usageTracking).orderBy(desc(usageTracking.createdAt)).limit(1);
        console.log('📊 Recent usage logs:');
        logs.forEach(log => {
            console.log(`- Type: ${log.usageType}`);
            console.log(`  Resource: ${log.resourceName}`);
            console.log(`  Tokens Used: ${log.tokensUsed} (Input: ${log.metadata.inputTokens}, Output: ${log.metadata.outputTokens})`);
            console.log(`  Cost (Cents): ${log.cost}`);
            console.log(`  Cost (USD recorded): ${log.metadata.costUSD}`);
        });

        if (logs.length > 0) {
             const log = logs[0];
             const expectedUSD = 0.1085;
             const actualUSD = log.metadata.costUSD;
             
             // Allow small floating point difference
             if (Math.abs(actualUSD - expectedUSD) < 0.0001) {
                 console.log(`✅ COST VERIFICATION PASSED: Expected $${expectedUSD}, Got $${actualUSD}`);
             } else {
                 console.error(`❌ COST VERIFICATION FAILED: Expected $${expectedUSD}, Got $${actualUSD}`);
             }
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    }
    process.exit(0);
}

testUsageTracking();
