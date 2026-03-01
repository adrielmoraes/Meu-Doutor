const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'ai', 'flows');
const files = fs.readdirSync(dir).filter(f => f.endsWith('-agent.ts'));

let updated = 0;
for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip files that already import generateWithFallback
    if (content.includes('generateWithFallback')) {
        continue;
    }

    // Add import if not exists
    if (!content.includes('generateWithFallback')) {
        content = content.replace(
            /^import { z } from 'genkit';/m,
            "import { z } from 'genkit';\nimport { generateWithFallback } from '@/lib/ai-resilience';"
        );
    }

    // Replace await specialistPrompt(input);
    const regex = /const\s+\{\s*output\s*}\s*=\s*await\s+specialistPrompt\(input\);/g;
    let matches = content.match(regex);
    if (matches) {
        content = content.replace(
            regex,
            `const { output } = await generateWithFallback({
                prompt: specialistPrompt,
                input
            });`
        );
        fs.writeFileSync(filePath, content);
        updated++;
        console.log('Updated ' + file);
    }
}
console.log('Total updated: ' + updated);
