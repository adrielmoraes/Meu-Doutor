import os
import re

flows_dir = r'c:\Users\ADRIEL\Desktop\Dr.IA\MediaAI 2.0\Meu-Doutor\src\ai\flows'

agents_to_fix = [
    ('allergist-agent.ts', 'Allergist', 'ALLERGIST'),
    ('angiologist-agent.ts', 'Angiologist', 'ANGIOLOGIST'),
    ('dermatologist-agent.ts', 'Dermatologist', 'DERMATOLOGIST'),
    ('gastroenterologist-agent.ts', 'Gastroenterologist', 'GASTROENTEROLOGIST'),
    ('geneticist-agent.ts', 'Geneticist', 'GENETICIST'),
    ('geriatrician-agent.ts', 'Geriatrician', 'GERIATRICIAN'),
    ('gynecologist-agent.ts', 'Gynecologist', 'GYNECOLOGIST'),
    ('hematologist-agent.ts', 'Hematologist', 'HEMATOLOGIST'),
    ('infectologist-agent.ts', 'Infectologist', 'INFECTOLOGIST'),
    ('mastologist-agent.ts', 'Mastologist', 'MASTOLOGIST'),
    ('nephrologist-agent.ts', 'Nephrologist', 'NEPHROLOGIST'),
    ('nutritionist-agent.ts', 'Nutritionist', 'NUTRITIONIST'),
    ('oncologist-agent.ts', 'Oncologist', 'ONCOLOGIST'),
    ('ophthalmologist-agent.ts', 'Ophthalmologist', 'OPHTHALMOLOGIST'),
    ('orthopedist-agent.ts', 'Orthopedist', 'ORTHOPEDIST'),
    ('otolaryngologist-agent.ts', 'Otolaryngologist', 'OTOLARYNGOLOGIST'),
    ('pediatrician-agent.ts', 'Pediatrician', 'PEDIATRICIAN'),
    ('psychiatrist-agent.ts', 'Psychiatrist', 'PSYCHIATRIST'),
    ('radiologist-agent.ts', 'Radiologist', 'RADIOLOGIST'),
    ('rheumatologist-agent.ts', 'Rheumatologist', 'RHEUMATOLOGIST'),
    ('sports-doctor-agent.ts', 'Sports Doctor', 'SPORTS_DOCTOR'),
    ('urologist-agent.ts', 'Urologist', 'UROLOGIST'),
    ('validator-agent.ts', 'Validator', 'VALIDATOR'),
]

def fix_agent_file(file_path, specialist_name, prompt_const_name):
    print(f'\n🔧 Fixing {file_path}...')
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'trackAIUsage' in content:
        print(f'✅ {specialist_name} already has token tracking - skipping')
        return
    
    import_pattern = r"(import \{ SpecialistAgentInputSchema, SpecialistAgentOutputSchema, createFallbackResponse \} from '\./specialist-agent-types';)"
    new_imports = r"\1\nimport { countTextTokens } from '@/lib/token-counter';\nimport { trackAIUsage } from '@/lib/usage-tracker';"
    content = re.sub(import_pattern, new_imports, content)
    
    prompt_pattern = r"(const specialistPrompt = ai\.definePrompt\(\{\s+name: '\w+AgentPrompt',\s+input: \{schema: SpecialistAgentInputSchema\},\s+output: \{schema: SpecialistAgentOutputSchema\},\s+tools: \[medicalKnowledgeBaseTool\],\s+prompt: )`"
    replacement = f"const {prompt_const_name}_PROMPT_TEMPLATE = `"
    content = re.sub(prompt_pattern, replacement, content, count=1)
    
    agent_name = os.path.basename(file_path).replace('-agent.ts', '')
    end_prompt_pattern = r"(Return complete JSON with all SpecialistAgentOutputSchema fields[^\`]*\.)`\s*\}\);"
    end_replacement = (r"\1`;\n\nconst specialistPrompt = ai.definePrompt({\n    name: '" + 
                      agent_name + 
                      r"AgentPrompt',\n    input: {schema: SpecialistAgentInputSchema},\n    output: {schema: SpecialistAgentOutputSchema},\n    tools: [medicalKnowledgeBaseTool],\n    prompt: " + 
                      f"{prompt_const_name}_PROMPT_TEMPLATE" + 
                      r",\n});")
    content = re.sub(end_prompt_pattern, end_replacement, content, count=1, flags=re.DOTALL)
    
    flow_start_pattern = r"(async \(input\) => \{)"
    flow_start_replacement = r"\1\n        const patientId = input.patientId || 'anonymous';\n        "
    content = re.sub(flow_start_pattern, flow_start_replacement, content, count=1)
    
    before_prompt_call_pattern = r"(const patientId = input\.patientId \|\| 'anonymous';\s+)(const \{output\} = await specialistPrompt\(input\);)"
    before_prompt_replacement = r"\1\n        const inputText = " + f"{prompt_const_name}_PROMPT_TEMPLATE" + r" + JSON.stringify(input);\n        const inputTokens = countTextTokens(inputText);\n        \n        \2"
    content = re.sub(before_prompt_call_pattern, before_prompt_replacement, content, count=1)
    
    after_fallback_pattern = r"(return createFallbackResponse\('[^']+'\);\s+\})\s+(return output;)"
    after_fallback_replacement = r"\1\n        \n        const outputTokens = countTextTokens(JSON.stringify(output));\n        \n        await trackAIUsage({\n            feature: 'Specialist Agent - " + specialist_name + r"',\n            model: 'googleai/gemini-2.5-flash-lite',\n            inputTokens: inputTokens,\n            outputTokens: outputTokens,\n            patientId,\n        });\n        \n        \2"
    content = re.sub(after_fallback_pattern, after_fallback_replacement, content, count=1)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'✅ {specialist_name} fixed successfully!')

print('🚀 Starting specialist agents token tracking fix...\n')

for agent_file, specialist_name, prompt_const in agents_to_fix:
    file_path = os.path.join(flows_dir, agent_file)
    if os.path.exists(file_path):
        try:
            fix_agent_file(file_path, specialist_name, prompt_const)
        except Exception as e:
            print(f'❌ Error fixing {agent_file}: {str(e)}')
    else:
        print(f'⚠️  {agent_file} not found - skipping')

print('\n✨ All specialist agents have been processed!')
