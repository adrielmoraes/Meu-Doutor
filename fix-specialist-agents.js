const fs = require('fs');
const path = require('path');

const flowsDir = path.join(__dirname, 'src', 'ai', 'flows');

const agentsToFix = [
    'allergist-agent.ts',
    'angiologist-agent.ts',
    'dermatologist-agent.ts',
    'endocrinologist-agent.ts',
    'gastroenterologist-agent.ts',
    'geneticist-agent.ts',
    'geriatrician-agent.ts',
    'gynecologist-agent.ts',
    'hematologist-agent.ts',
    'infectologist-agent.ts',
    'mastologist-agent.ts',
    'nephrologist-agent.ts',
    'nutritionist-agent.ts',
    'oncologist-agent.ts',
    'ophthalmologist-agent.ts',
    'orthopedist-agent.ts',
    'otolaryngologist-agent.ts',
    'pediatrician-agent.ts',
    'psychiatrist-agent.ts',
    'radiologist-agent.ts',
    'rheumatologist-agent.ts',
    'sports-doctor-agent.ts',
    'urologist-agent.ts',
    'validator-agent.ts',
];

const specialistNames = {
    'allergist': 'Allergist',
    'angiologist': 'Angiologist',
    'dermatologist': 'Dermatologist',
    'endocrinologist': 'Endocrinologist',
    'gastroenterologist': 'Gastroenterologist',
    'geneticist': 'Geneticist',
    'geriatrician': 'Geriatrician',
    'gynecologist': 'Gynecologist',
    'hematologist': 'Hematologist',
    'infectologist': 'Infectologist',
    'mastologist': 'Mastologist',
    'nephrologist': 'Nephrologist',
    'nutritionist': 'Nutritionist',
    'oncologist': 'Oncologist',
    'ophthalmologist': 'Ophthalmologist',
    'orthopedist': 'Orthopedist',
    'otolaryngologist': 'Otolaryngologist',
    'pediatrician': 'Pediatrician',
    'psychiatrist': 'Psychiatrist',
    'radiologist': 'Radiologist',
    'rheumatologist': 'Rheumatologist',
    'sports-doctor': 'Sports Doctor',
    'urologist': 'Urologist',
    'validator': 'Validator',
};

function fixAgentFile(filePath, agentType) {
    console.log(`\n🔧 Fixing ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('trackAIUsage')) {
        console.log(`✅ ${agentType} already has token tracking - skipping`);
        return;
    }
    
    const agentName = agentType.replace('-agent.ts', '');
    const promptName = agentName.toUpperCase().replace(/-/g, '_') + '_PROMPT_TEMPLATE';
    const specialistName = specialistNames[agentName] || agentName;
    
    const importRegex = /(import { SpecialistAgentInputSchema, SpecialistAgentOutputSchema, createFallbackResponse } from '\.\/specialist-agent-types';)/;
    const newImports = `$1\nimport { countTextTokens } from '@/lib/token-counter';\nimport { trackAIUsage } from '@/lib/usage-tracker';`;
    
    content = content.replace(importRegex, newImports);
    
    const promptDefineRegex = /const specialistPrompt = ai\.definePrompt\(\{\s*name: '(\w+)AgentPrompt',\s*input: \{schema: SpecialistAgentInputSchema\},\s*output: \{schema: SpecialistAgentOutputSchema\},\s*tools: \[medicalKnowledgeBaseTool\],\s*prompt: `([\s\S]*?)`\s*\}\);/;
    
    const match = content.match(promptDefineRegex);
    if (!match) {
        console.log(`❌ Could not find prompt definition in ${agentType}`);
        return;
    }
    
    const promptContent = match[2];
    const newPromptDef = `const ${promptName} = \`${promptContent}\`;\n\nconst specialistPrompt = ai.definePrompt({\n    name: '${match[1]}AgentPrompt',\n    input: {schema: SpecialistAgentInputSchema},\n    output: {schema: SpecialistAgentOutputSchema},\n    tools: [medicalKnowledgeBaseTool],\n    prompt: ${promptName},\n});`;
    
    content = content.replace(promptDefineRegex, newPromptDef);
    
    const flowRegex = /(async \(input\) => \{\s*)(const \{output\} = await specialistPrompt\(input\);)/;
    const newFlowContent = `$1const patientId = input.patientId || 'anonymous';\n        \n        const inputText = ${promptName} + JSON.stringify(input);\n        const inputTokens = countTextTokens(inputText);\n        \n        $2`;
    
    content = content.replace(flowRegex, newFlowContent);
    
    const returnRegex = /(return createFallbackResponse\('[^']+'\);\s*\}\s*)(return output;)/;
    const newReturnContent = `$1\n        const outputTokens = countTextTokens(JSON.stringify(output));\n        \n        await trackAIUsage({\n            feature: 'Specialist Agent - ${specialistName}',\n            model: 'googleai/gemini-2.5-flash-lite',\n            inputTokens: inputTokens,\n            outputTokens: outputTokens,\n            patientId,\n        });\n        \n        $2`;
    
    content = content.replace(returnRegex, newReturnContent);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${agentType} fixed successfully!`);
}

console.log('🚀 Starting specialist agents token tracking fix...\n');

agentsToFix.forEach(agent => {
    const filePath = path.join(flowsDir, agent);
    if (fs.existsSync(filePath)) {
        fixAgentFile(filePath, agent);
    } else {
        console.log(`⚠️  ${agent} not found - skipping`);
    }
});

console.log('\n✨ All specialist agents have been processed!');
