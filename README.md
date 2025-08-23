
# MediAI - Seu Assistente de Saúde Inteligente

Bem-vindo ao MediAI, um protótipo funcional de uma plataforma de saúde inovadora que utiliza Inteligência Artificial para conectar pacientes e médicos. Esta aplicação demonstra um fluxo de trabalho completo, desde a consulta inicial do paciente com uma IA até a validação do diagnóstico por um médico humano, culminando na criação de um plano de bem-estar personalizado.

## ✨ Visão Geral

O MediAI é construído como dois portais interconectados:

*   **Portal do Paciente:** Um espaço onde os pacientes podem interagir com um assistente de IA, fazer upload de exames para análise, acompanhar seu histórico de saúde, receber planos de bem-estar personalizados e agendar consultas com médicos.
*   **Portal do Médico:** Um painel de controle profissional para que os médicos possam revisar as análises geradas pela IA, validar diagnósticos, adicionar suas próprias notas e prescrições e gerenciar sua agenda de pacientes.

O projeto foi desenhado para ser uma simulação de alta fidelidade, pronta para ser integrada com serviços reais, como APIs de busca médica e sistemas de autenticação.

## 🚀 Tecnologias Utilizadas

*   **Framework:** [Next.js](https://nextjs.org/) (com App Router)
*   **Inteligência Artificial:** [Google Genkit](https://firebase.google.com/docs/genkit)
*   **Banco de Dados:** [Cloud Firestore](https://firebase.google.com/docs/firestore)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)

---

## 🌟 Funcionalidades Detalhadas

### Portal do Paciente

#### 1. **Consulta com a IA por Vídeo**
*   **Interação por Voz:** O paciente pode conversar com a IA usando a voz. A aplicação utiliza a API de Speech Recognition do navegador para transcrever a fala do usuário.
*   **Respostas em Áudio:** A IA responde com uma voz sintetizada, criando uma experiência de conversação natural (usando modelos Text-to-Speech do Gemini).
*   **Consciência de Contexto:** A IA sabe com qual paciente está falando (através de um ID de usuário) e pode acessar seu histórico médico no Firestore usando uma ferramenta Genkit (`patientDataAccessTool`) para fornecer respostas personalizadas.
*   **Persistência da Conversa:** Ao final da chamada, o histórico completo da conversa é salvo no registro do paciente, permitindo que o médico o revise mais tarde.

#### 2. **Upload e Análise de Exames Médicos**
*   **Suporte a Múltiplos Formatos:** O paciente pode fazer upload de documentos como PDF, JPG ou PNG.
*   **Análise Multimodal com IA:** Um fluxo Genkit (`analyzeMedicalExam`) utiliza um modelo de visão do Gemini para extrair informações do documento, gerar um diagnóstico preliminar e uma explicação simplificada para o paciente.
*   **Salvamento Automático:** O resultado da análise é automaticamente salvo no histórico do paciente no Firestore.

#### 3. **Histórico de Exames com Clareza**
*   **Diferenciação Visual:** A interface distingue claramente entre um "Diagnóstico Preliminar da IA" e um "Diagnóstico Final Validado pelo Médico", usando ícones e textos diferentes.
*   **Explicação Adaptativa:** Se o diagnóstico foi validado, a explicação médica é processada por uma IA para ser "traduzida" para uma linguagem simples e empática para o paciente, incluindo uma narração em áudio de alta qualidade.

#### 4. **Plano de Bem-Estar Personalizado**
*   **Geração Dinâmica:** Após a validação do diagnóstico, um fluxo de IA (`generateWellnessPlan` e `generateHealthInsights`) cria um plano de bem-estar completo.
*   **Seções Abrangentes:** O plano inclui recomendações de dieta (com consulta a um agente IA nutricionista), exercícios e bem-estar mental.
*   **Lembretes Acionáveis:** A IA também gera lembretes diários personalizados (ex: "Beba água", "Hora da caminhada") com base no plano.

#### 5. **Painel de Metas de Saúde (Gamificação)**
*   **Prevenção Proativa:** A IA identifica potenciais riscos de saúde futuros e os apresenta como "oportunidades de prevenção".
*   **Metas Rastreáveis:** O sistema cria metas de saúde mensuráveis (ex: "Reduzir Pressão Arterial") com barras de progresso.
*   **Interação do Usuário:** O paciente pode registrar seu progresso clicando em um botão, o que atualiza visualmente a barra de progresso, criando um ciclo de engajamento.

### Portal do Médico

#### 1. **Painel de Controle Centralizado**
*   **Navegação Eficiente:** Uma barra lateral persistente e um layout profissional permitem acesso rápido a todas as funcionalidades do médico.
*   **Visão Geral:** Cartões de acesso rápido levam para "Meus Pacientes", "Agenda" e "Histórico".

#### 2. **Gerenciamento de Pacientes**
*   **Lista de Pacientes:** Uma tabela exibe todos os pacientes, com um indicador de status visual ("Requer Validação" ou "Validado").
*   **Visão Detalhada do Caso:** Ao clicar em um paciente, o médico acessa uma página completa com todas as informações relevantes.

#### 3. **Fluxo de Validação de Diagnóstico**
*   **Síntese da IA:** O médico visualiza um resumo do histórico do paciente e o diagnóstico preliminar gerado pela orquestração de múltiplos especialistas de IA (Cardiologista, Neurologista, etc.).
*   **Triagem Inteligente:** A IA primeiro realiza uma triagem para invocar apenas os especialistas relevantes para o caso, otimizando o processo.
*   **Edição e Validação:** O médico tem uma área de texto para editar as notas da IA, adicionar sua própria análise, diagnóstico final e prescrição.
*   **Ações de Salvar e Validar:** O médico pode salvar seu trabalho como rascunho ou clicar em "Validar Diagnóstico", o que finaliza o caso e dispara a geração do plano de bem-estar para o paciente.

#### 4. **Agenda e Consultas**
*   **Calendário Visual:** Uma página de agenda exibe as consultas marcadas em um calendário.
*   **Agendamento Inteligente:** O paciente pode ver os horários disponíveis de um médico (o sistema verifica a disponibilidade no Firestore) e agendar uma nova consulta.

## ⚙️ Como Executar o Projeto

### Pré-requisitos
*   Node.js (versão 20 ou superior)
*   Um projeto Firebase com o Cloud Firestore habilitado.

### Passos para Instalação

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd <NOME_DA_PASTA>
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    *   Renomeie o arquivo `.env.example` para `.env`.
    *   Preencha as variáveis de ambiente no arquivo `.env` com as credenciais do seu projeto Firebase.
    *   Para habilitar as ferramentas de busca com APIs reais, preencha as variáveis `GOOGLE_API_KEY` e `GOOGLE_SEARCH_ENGINE_ID`. Caso contrário, o aplicativo usará dados de demonstração.

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

5.  **Acesse a aplicação:**
    *   Abra seu navegador e acesse `http://localhost:9002`.

---
