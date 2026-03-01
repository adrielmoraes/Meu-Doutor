# Manual Técnico e de Arquitetura de Software
**Produto:** Medi.AI (Meu-Doutor)
**Versão:** 1.0.0
**Empresa Responsável:** ALFA GLOBAL SERVICES TECHNOLOGY LTDA
**Responsável Técnico:** Adriel Moraes e Equipe de Engenharia

---

## 1. Escopo e Propósito
O Medi.AI é um portal de saúde bidirecional (Paciente e Médico) que processa dados clínicos e interage com os usuários utilizando Inteligência Artificial em tempo real. Este manual define a arquitetura, padrões de segurança e especificações técnicas.

## 2. Tecnologias Utilizadas
*   **Front-end & Back-end:** Next.js (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui.
*   **Inteligência Artificial (Orquestrador Multi-Agente):** Firebase Genkit (Framework de roteamento), Modelos Google Gemini Multimodais (Gemini 1.5 Pro/Flash).
*   **Banco de Dados:** Neon Data Base (PostgreSQL com Drizzle ORM) e Cloud Firestore (Arquitetura Híbrida de alta disponibilidade).
*   **Comunicação em Tempo Real e Voz:** WebRTC (API nativa) adaptada via `LiveKit`, integração `Socket.io-client`, e rotas customizadas de `text-to-speech` no backend.
*   **Monitoramento e Logs de Erro:** Integração edge via Sentry.

## 3. Arquitetura de Software (Padrão MVC / Serverless)
O projeto é baseado no framework Next.js utilizando Server Components para a camada de visualização em conjunção com rotas de API serverless para abstrair o controle do backend.

1.  **`/src/app`**: Controlador central de rotas e injeção do UI (View).
2.  **`/src/ai`**: Contém a lógica das funções (Controller), englobando prompts e "tools" (ferramentas de contexto) em TypeScript puro, gerenciadas pelo Genkit.
3.  **`/src/lib/db` (Drizzle ORM) & `/lib/firebase`**: Modelagem de dados (Model), contendo a abstração do Neondb e do Firestore, e validações.

## 4. Roteamento de API e Ecossistema Multi-Agente (Genkit)
Os processos de inteligência artificial nunca chamam diretamente a LLM do cliente (zero exposição client-side). Todos os comandos são disparados via rotas serverless do Next.js integradas ao orquestrador Genkit, isolando a `GEMINI_API_KEY`.

A infraestrutura de IA está arquitetada em um sistema de **mais de 35 micro-fluxos (flows) e ferramentas**, incluindo:
*   **Orquestradores Base e Visão Multimodal:** Módulo `analyze-medical-exam` (para ingestão computacional de PDFs/JPGs) e `live-consultation-flow` (que une `text-to-speech` e WebRTC numa videochamada com IA).
*   **Junta Médica de Agentes Genkit (16+ IAs):** O core da arquitetura clínica é processado por IAs especialistas paralelizadas (ex: `cardiologist-agent.ts`, `neurologist-agent.ts`, `oncologist-agent.ts`, etc.).
*   **Consolidação de Triagem e Urgência:** O módulo `generate-preliminary-diagnosis` cruza os achados da equipe médica virtual e usa o `validator-agent.ts` para classificar o paciente no banco de dados (`triage-urgency-flow`), gerando a fila B2B do médico parceiro.
*   **Genkit Tools Customizadas:** Injeção sistêmica de contexto médico nos agentes, empregando ferramentas criadas in-house como `patient-data-access` (Firestore connector), `medical-knowledge-base` e `doctors-list-access`.

## 5. Esquema de Banco de Dados / Coleções Principais
O banco é estritamente separado para garantir segurança de ponta a ponta:
*   `patients` e `doctors`: Tabelas de perfis.
*   `patientAuth` e `doctorAuth`: Tabelas separadas e protegidas contendo credenciais via `bcrypt` hashing, isolando dados PII (Personally Identificable Information) de senhas criptografadas.
*   `appointments`: Agendamentos contendo horários, local e relação *User_ID* <-> *Doctor_ID*.

## 6. Pipeline de Implantação (CI/CD)
O deploy é configurado primariamente para **Vercel** através de Integração Contínua com GitHub:
1.  **Commit / Push** em *branch* principal (ou aberturas de PR para Vercel Preview).
2.  **Build Phase** (verificação de tipos com o TypeScript (`tsc --noEmit`), linting (`next lint`), e build de produção).
3.  **Deployment** na borda e nos Serverless Runtimes da infraestrutura global da Vercel.

## 7. Estratégia de Escalabilidade e Falhas
O banco Serverless (Neon) tem autoscaling vertical nativo. As IAs dependem da Google Cloud; se a API de GenAI (1.5 Pro) estourar cotas, os Handlers da API contam com lógica de fallback para modelos mais leves ou mais eficientes (1.5 Flash), além do logging centralizado das falhas via Sentry na edge ("@sentry/nextjs").
