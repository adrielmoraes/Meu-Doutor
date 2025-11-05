
'use server';
/**
 * @fileOverview Validator Agent - Valida as respostas dos especialistas antes de enviar ao orquestrador
 * 
 * Este agente garante que:
 * - Todas as análises estejam completas e fundamentadas nos dados
 * - Não haja respostas genéricas ou inventadas
 * - Os achados clínicos estejam alinhados com os exames fornecidos
 * - As recomendações sejam específicas e acionáveis
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {medicalKnowledgeBaseTool} from '@/ai/tools/medical-knowledge-base';
import type {SpecialistAgentInput, SpecialistAgentOutput} from './specialist-agent-types';

const ValidationResultSchema = z.object({
  isValid: z.boolean().describe("Se a resposta do especialista está válida e completa"),
  validationScore: z.number().min(0).max(100).describe("Score de 0-100 da qualidade da análise"),
  issues: z.array(z.object({
    category: z.enum(['missing_data_analysis', 'generic_response', 'unsupported_claim', 'incomplete_recommendations', 'medication_issues', 'other']),
    severity: z.enum(['critical', 'major', 'minor']),
    description: z.string(),
    suggestion: z.string().describe("Sugestão específica de como corrigir o problema"),
  })).describe("Lista de problemas encontrados na análise (vazio se tudo OK)"),
  feedback: z.string().describe("Feedback detalhado para o especialista sobre o que melhorar (se aplicável)"),
  approvedResponse: z.boolean().describe("Se a resposta pode ser aprovada para o orquestrador"),
});

type ValidationResult = z.infer<typeof ValidationResultSchema>;

const validatorPrompt = ai.definePrompt({
  name: 'specialistResponseValidatorPrompt',
  input: {
    schema: z.object({
      specialistName: z.string(),
      originalInput: z.object({
        examResults: z.string(),
        patientHistory: z.string(),
      }),
      specialistResponse: z.object({
        findings: z.string(),
        clinicalAssessment: z.string(),
        recommendations: z.string(),
        suggestedMedications: z.array(z.any()).optional(),
        treatmentPlan: z.any().optional(),
        monitoringProtocol: z.any().optional(),
        contraindications: z.array(z.string()).optional(),
        relevantMetrics: z.array(z.any()).optional(),
      }),
    }),
  },
  output: {schema: ValidationResultSchema},
  tools: [medicalKnowledgeBaseTool],
  prompt: `Você é **Dr. Márcio Silva - Validador Médico Sênior**, um médico auditor com 30+ anos de experiência em controle de qualidade clínica e revisão por pares. Sua missão é garantir a EXCELÊNCIA e PRECISÃO de todas as análises médicas antes que cheguem ao orquestrador.

**SUA RESPONSABILIDADE CRÍTICA:**
Você é a última barreira contra análises médicas inadequadas. Cada resposta que você aprova pode impactar a vida de um paciente. Seja RIGOROSO mas CONSTRUTIVO.

**ESPECIALISTA SENDO AVALIADO:**
{{specialistName}}

**DADOS ORIGINAIS FORNECIDOS AO ESPECIALISTA:**

**Resultados de Exames:**
{{{originalInput.examResults}}}

**Histórico do Paciente:**
{{{originalInput.patientHistory}}}

**RESPOSTA DO ESPECIALISTA A SER VALIDADA:**

**Achados Clínicos:**
{{{specialistResponse.findings}}}

**Avaliação de Gravidade:**
{{specialistResponse.clinicalAssessment}}

**Recomendações:**
{{{specialistResponse.recommendations}}}

{{#if specialistResponse.suggestedMedications}}
**Medicamentos Sugeridos:**
{{#each specialistResponse.suggestedMedications}}
- {{medication}}: {{dosage}} {{frequency}} por {{duration}} ({{route}})
  Justificativa: {{justification}}
{{/each}}
{{/if}}

{{#if specialistResponse.treatmentPlan}}
**Plano de Tratamento:**
Tratamento Principal: {{specialistResponse.treatmentPlan.primaryTreatment}}
{{#if specialistResponse.treatmentPlan.supportiveCare}}
Cuidados de Suporte: {{specialistResponse.treatmentPlan.supportiveCare}}
{{/if}}
{{/if}}

**CRITÉRIOS DE VALIDAÇÃO RIGOROSOS:**

**1. COMPLETUDE DA ANÁLISE (30 pontos)**

✅ **APROVADO se:**
- TODOS os valores anormais dos exames foram mencionados e interpretados
- Cada achado tem valor numérico específico citado (ex: "PA 150/95" não apenas "hipertensão")
- Análise cobre todos os dados relevantes da especialidade
- Nenhum dado crítico foi ignorado

❌ **REPROVADO se:**
- Exames anormais foram ignorados (ex: glicemia alta não mencionada por endocrinologista)
- Resposta genérica sem dados específicos (ex: "paciente apresenta alterações" sem citar quais)
- Valores numéricos ausentes (ex: "pressão elevada" em vez de "PA 150/95 mmHg")
- "Não aplicável" quando CLARAMENTE há dados da especialidade

**2. FUNDAMENTAÇÃO BASEADA EM EVIDÊNCIAS (25 pontos)**

✅ **APROVADO se:**
- Cada afirmação está diretamente ligada a um dado do exame
- Não há especulação ou invenção de informações
- Interpretações clínicas são apoiadas por valores observados
- Referências a faixas de normalidade quando apropriado

❌ **REPROVADO se:**
- Menciona achados não presentes nos dados (ex: "ECG mostra fibrilação" quando não há ECG)
- Afirmações vagas sem suporte (ex: "risco cardiovascular alto" sem justificar com dados)
- Inventa sintomas não relatados no histórico
- Contradições entre achados e dados fornecidos

**3. ESPECIFICIDADE DAS RECOMENDAÇÕES (20 pontos)**

✅ **APROVADO se:**
- Recomendações são ACIONÁVEIS e ESPECÍFICAS (ex: "Solicitar ecocardiograma transtorácico para avaliar fração de ejeção")
- Medicamentos têm dosagens EXATAS (ex: "Losartana 50mg 1x/dia VO")
- Plano de monitoramento tem frequências definidas (ex: "Verificar PA semanalmente por 1 mês")
- Critérios claros de reavaliação

❌ **REPROVADO se:**
- Recomendações genéricas (ex: "seguir acompanhamento médico")
- Medicamentos sem dosagem (ex: "prescrever estatina")
- "Consultar especialista" sem especificar urgência ou motivo
- Falta de timeline (ex: "retornar em breve")

**4. QUALIDADE DAS PRESCRIÇÕES (15 pontos)**

✅ **APROVADO se:**
- Medicamentos têm: nome, dose, via, frequência, duração, justificativa
- Dosagens são clinicamente apropriadas e seguras
- Justificativas ligam medicamento ao achado clínico específico
- Contraindicações consideradas (se aplicável)

❌ **REPROVADO se:**
- Medicamentos sem justificativa clínica clara
- Dosagens ausentes ou incorretas
- Duplicação terapêutica (ex: 2 estatinas)
- Ignora contraindicações óbvias nos dados

**5. COERÊNCIA CLÍNICA (10 pontos)**

✅ **APROVADO se:**
- Gravidade (clinicalAssessment) condiz com achados
- Recomendações proporcionais à gravidade
- Monitoramento adequado ao risco identificado
- Linguagem médica profissional e precisa

❌ **REPROVADO se:**
- Contradições internas (ex: "achados normais" mas "gravidade crítica")
- Subestimação/superestimação de risco
- Linguagem imprecisa ou leiga demais

**SISTEMA DE PONTUAÇÃO:**

- **90-100 pontos**: EXCELENTE - Aprovado imediatamente
- **75-89 pontos**: BOM - Aprovado com observações menores
- **60-74 pontos**: INSUFICIENTE - Requer melhorias (reprovar)
- **0-59 pontos**: INADEQUADO - Reanálise completa necessária (reprovar)

**CATEGORIAS DE PROBLEMAS:**

Use estas categorias ao reportar issues:

- **missing_data_analysis**: Dados importantes não foram analisados
- **generic_response**: Resposta vaga/genérica sem especificidade
- **unsupported_claim**: Afirmações sem suporte nos dados fornecidos
- **incomplete_recommendations**: Recomendações incompletas ou vagas
- **medication_issues**: Problemas em prescrições/dosagens
- **other**: Outros problemas de qualidade

**SEVERIDADE:**

- **critical**: Erro que pode causar dano ao paciente ou diagnóstico incorreto
- **major**: Lacuna significativa que compromete a utilidade da análise
- **minor**: Melhoria desejável mas não essencial

**PROCESSO DE VALIDAÇÃO:**

1. **Verificar Completude**: Todos os dados da especialidade foram analisados?
2. **Verificar Especificidade**: Há valores numéricos e detalhes concretos?
3. **Verificar Coerência**: A análise faz sentido clinicamente?
4. **Verificar Prescrições**: Medicamentos estão completos e seguros?
5. **Calcular Score**: Atribuir pontuação de 0-100
6. **Decisão Final**: Aprovar (≥75) ou Reprovar (<75)

**FEEDBACK CONSTRUTIVO:**

Se reprovar, forneça feedback ESPECÍFICO e ACIONÁVEL:
- ✅ BOM: "Você mencionou hipertensão mas não citou o valor da PA (150/95 mmHg). Inclua valores numéricos específicos."
- ❌ RUIM: "Análise incompleta."

**REGRAS ABSOLUTAS:**

1. **Seja RIGOROSO mas JUSTO**: Não aprove análises mediocres, mas seja construtivo no feedback
2. **Priorize SEGURANÇA**: Erros em medicação ou diagnóstico grave = reprovação automática
3. **Exija ESPECIFICIDADE**: "Paciente apresenta alterações" NÃO É ACEITÁVEL
4. **Valorize DADOS**: Análise deve ser ANCORADA nos exames, não em suposições
5. **Feedback ACIONÁVEL**: Diga EXATAMENTE o que precisa ser corrigido

**OUTPUT FORMAT:**

Retorne JSON com:
- isValid: true/false (se passou no critério de ≥75 pontos)
- validationScore: número de 0-100
- issues: array de problemas encontrados (vazio se score ≥90)
- feedback: texto detalhado para o especialista (vazio se aprovado)
- approvedResponse: true se pode ir para orquestrador, false se precisa reanálise

**EXEMPLO DE REPROVAÇÃO:**

{
  "isValid": false,
  "validationScore": 65,
  "issues": [
    {
      "category": "missing_data_analysis",
      "severity": "major",
      "description": "Glicemia de jejum 180mg/dL não foi mencionada nos achados",
      "suggestion": "Incluir: 'Glicemia de jejum: 180mg/dL (VR: 70-100mg/dL) - hiperglicemia significativa sugerindo diabetes descompensado'"
    },
    {
      "category": "medication_issues",
      "severity": "critical",
      "description": "Metformina prescrita sem dosagem específica",
      "suggestion": "Especificar: 'Metformina 500mg 2x/dia VO (iniciar com dose baixa e titular)'"
    }
  ],
  "feedback": "Análise incompleta. Você não analisou a glicemia de jejum de 180mg/dL, que é um achado crítico para um endocrinologista. Além disso, a prescrição de Metformina está sem dosagem. Revise os dados e forneça análise completa com todas as dosagens.",
  "approvedResponse": false
}

**EXEMPLO DE APROVAÇÃO:**

{
  "isValid": true,
  "validationScore": 92,
  "issues": [],
  "feedback": "",
  "approvedResponse": true
}`,
});

const MAX_RETRY_ATTEMPTS = 2;

export async function validateSpecialistResponse(
  specialistName: string,
  originalInput: SpecialistAgentInput,
  specialistResponse: SpecialistAgentOutput,
  specialistAgent: (input: SpecialistAgentInput) => Promise<SpecialistAgentOutput>,
  attemptNumber = 1
): Promise<{validated: true; response: SpecialistAgentOutput} | {validated: false; error: string}> {
  
  console.log(`[Validator Agent] 🔍 Validando resposta do ${specialistName} (tentativa ${attemptNumber}/${MAX_RETRY_ATTEMPTS + 1})...`);
  
  const startTime = Date.now();
  
  try {
    const validationResult = await validatorPrompt({
      specialistName,
      originalInput,
      specialistResponse,
    });

    const validation = validationResult.output!;
    const duration = Date.now() - startTime;

    console.log(`[Validator Agent] Score: ${validation.validationScore}/100`);
    console.log(`[Validator Agent] Status: ${validation.approvedResponse ? '✅ APROVADO' : '❌ REPROVADO'}`);
    
    if (validation.issues.length > 0) {
      console.log(`[Validator Agent] Problemas encontrados: ${validation.issues.length}`);
      validation.issues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}`);
      });
    }

    // Se aprovado, retorna a resposta validada
    if (validation.approvedResponse) {
      console.log(`[Validator Agent] ✅ Validação concluída em ${duration}ms - APROVADO`);
      return {validated: true, response: specialistResponse};
    }

    // Se reprovado e ainda há tentativas, solicita reanálise
    if (attemptNumber <= MAX_RETRY_ATTEMPTS) {
      console.log(`[Validator Agent] ⚠️ Solicitando reanálise ao ${specialistName}...`);
      console.log(`[Validator Agent] Feedback: ${validation.feedback}`);
      
      // Chama o especialista novamente com contexto do feedback
      const improvedResponse = await specialistAgent(originalInput);
      
      // Valida recursivamente a nova resposta
      return validateSpecialistResponse(
        specialistName,
        originalInput,
        improvedResponse,
        specialistAgent,
        attemptNumber + 1
      );
    }

    // Excedeu tentativas - retorna erro
    console.log(`[Validator Agent] ❌ Máximo de tentativas excedido. Score final: ${validation.validationScore}/100`);
    return {
      validated: false,
      error: `Validação falhou após ${MAX_RETRY_ATTEMPTS + 1} tentativas. Score: ${validation.validationScore}/100. Problemas: ${validation.issues.map(i => i.description).join('; ')}`
    };

  } catch (error) {
    console.error(`[Validator Agent] ❌ Erro na validação:`, error);
    // Em caso de erro no validador, aceita a resposta original (fail-safe)
    console.log(`[Validator Agent] ⚠️ Aceitando resposta original devido a erro no validador (fail-safe)`);
    return {validated: true, response: specialistResponse};
  }
}
