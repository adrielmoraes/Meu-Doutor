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
*   **Banco de Dados:** [neon data base
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)

---

## ⚙️ Como Executar o Projeto

### Pré-requisitos
*   Node.js (versão 20 ou superior)

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
    *   Renomeie o arquivo `.env.example` (se existir) para `.env`.
    *   Preencha as variáveis de ambiente no arquivo `.env` com as credenciais do seu projeto Firebase.

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

5.  **Acesse a aplicação:**
    *   Abra seu navegador e acesse `http://localhost:9002`.

### Variáveis de Ambiente Essenciais (`.env`)

Para que a aplicação funcione, você **precisará** preencher o arquivo `.env` com as chaves do seu projeto Firebase.
*   `JWT_SECRET`: Uma chave secreta para a sessão do usuário. Você pode gerar uma com o comando: `openssl rand -base64 32`.
*   `GEMINI_API_KEY`: Sua chave de API para usar os modelos do Gemini.
---

## 🔒 Estrutura do Banco de Dados e Segurança

O banco de dados do MediAI no Cloud Firestore é organizado para garantir segurança e escalabilidade.

*   **`/patients`**: Uma coleção onde cada documento representa um paciente. Contém informações do perfil como nome, idade, e-mail e histórico médico.
    *   **`/patients/{patientId}/exams`**: Uma subcoleção dentro de cada paciente para armazenar todos os exames que ele enviou.
*   **`/doctors`**: Uma coleção onde cada documento representa um médico. Contém informações profissionais como nome, especialidade e dados de gamificação.
*   **`/patientAuth`**: Uma coleção separada para armazenar as credenciais de login dos pacientes. Cada documento aqui tem o mesmo ID do paciente correspondente na coleção `patients` e armazena a senha criptografada (hash).
*   **`/doctorAuth`**: Similar à `patientAuth`, mas para os médicos. Armazena as senhas criptografadas dos profissionais.
*   **`/appointments`**: Uma coleção para armazenar todos os agendamentos entre pacientes e médicos.

Essa estrutura separa os dados de perfil das credenciais de autenticação, o que é uma prática de segurança fundamental.

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

#### 6. **Automação Inteligente e Rastreamento de Custos**
*   **Atualização Automática do Plano:** Sempre que um novo exame é analisado, o plano de bem-estar é automaticamente regenerado em segundo plano para incorporar as novas descobertas, garantindo que o paciente tenha sempre as recomendações mais atuais.
*   **Auditoria de Custos em Tempo Real:** O sistema implementa um rastreamento rigoroso de custos para todas as interações de IA (Gemini Live, TTS, Vision). Cada token de entrada e saída (texto, áudio, vídeo) é contabilizado com precisão milimétrica, incluindo a cobrança por minuto do Avatar (Beyond Presence), garantindo transparência financeira total.

### Portal do Médico

#### 1. **Painel de Controle Centralizado**
*   **Navegação Eficiente:** Uma barra lateral persistente e um layout profissional permitem acesso rápido a todas as funcionalidades do médico.
*   **Visão Geral:** Cartões de acesso rápido levam para "Meus Pacientes", "Agenda" e "Histórico".

#### 2. **Gerenciamento de Pacientes com Priorização Inteligente**
*   **Lista Priorizada:** Uma tabela exibe todos os pacientes que requerem validação, ordenados por um nível de urgência ("Urgente", "Alta", "Normal") que é automaticamente determinado por um fluxo de IA (`triageUrgency`). Isso garante que os casos mais críticos sejam vistos primeiro.
*   **Indicadores Visuais:** Ícones e cores destacam o status e a prioridade de cada paciente, permitindo uma rápida identificação visual.

#### 3. **Fluxo de Validação de Diagnóstico com Múltiplos Especialistas**
*   **Síntese da Equipe de IAs:** O médico visualiza um diagnóstico preliminar gerado por uma "Junta Médica Virtual".
*   **Triagem e Orquestração:** O fluxo (`generatePreliminaryDiagnosis`) invoca dinamicamente agentes especialistas (Cardiologista, Endocrinologista, etc.) com base nos achados do exame.
*   **Consolidação de Exames:** Capacidade de analisar múltiplos exames simultaneamente e consolidar os achados em um único relatório coerente.
*   **Pareceres Estruturados:** As descobertas de cada especialista são apresentadas isoladamente para revisão, antes da síntese final.
*   **Edição e Validação:** O médico humano tem a palavra final, validando ou ajustando o diagnóstico e a prescrição.

#### 4. **Agenda e Consultas com Base na Localização**
*   **Listagem Inteligente:** Busca de médicos por geolocalização.
*   **Calendário Visual:** Gestão intuitiva de horários e agendamentos.
*   **Agendamento Flexível:** Pacientes podem visualizar e reservar horários livres em tempo real.

#### 5. **Perfil do Médico com Gamificação**
*   **Progressão de Carreira:** Sistema de níveis e XP baseado em validações realizadas.
*   **Estatísticas e Conquistas:** Badges e métricas de desempenho para engajamento profissional.

## 💰 Estrutura de Custos de IA (Validada)

O sistema possui uma tabela de preços (`ai-pricing.ts`) auditada e alinhada com os valores oficiais do Google (Dez/2025):

| Serviço | Detalhes | Custo Estimado |
| :--- | :--- | :--- |
| **Gemini Live (Áudio)** | Entrada (Ouvir) | $3.00 / 1M tokens |
| **Gemini Live (Fala)** | Saída (Falar) | $12.00 / 1M tokens |
| **Avatar (Beyond)** | Visual (Vídeo) | $0.176 / minuto |
| **Análise de Exames** | Visão + Texto | Variável (por token) |

*Nota: O sistema rastreia separadamente o tempo de conexão do avatar e o fluxo de dados do Gemini, garantindo cobrança justa.*

## 💰 Modelos de Negócio e Monetização

A estrutura do MediAI permite diversos modelos de monetização, que podem ser combinados para criar uma estratégia de negócio sustentável.

| Modelo | Foco no | Descrição | Vantagens | Desvantagens |
| :--- | :--- | :--- | :--- | :--- |
| **Freemium** | Paciente | Oferece um nível de serviço gratuito com limitações (ex: 1 análise de exame/mês) e um plano "Premium" pago com acesso ilimitado, funcionalidades avançadas e consultas prioritárias. | - Baixa barreira de entrada, atrai muitos usuários.<br>- Potencial de upsell para usuários engajados. | - Custo para manter usuários gratuitos.<br>- A conversão para o plano pago pode ser um desafio. |
| **Pagamento por Uso (Pay-per-Use)** | Paciente | O paciente paga por transação (ex: R$10 por análise de exame, R$50 por consulta validada). | - O usuário paga apenas pelo que usa.<br>- Modelo simples de entender e implementar. | - Receita imprevisível.<br>- Pode desencorajar o uso frequente por parte do paciente. |
| **Assinatura (B2C)** | Paciente | Um valor mensal fixo para acesso a um pacote de serviços (ex: R$29,90/mês para 5 análises, consultas ilimitadas com IA e 1 validação médica). | - Receita previsível e recorrente.<br>- Incentiva o engajamento contínuo do paciente. | - Barreira de entrada maior (compromisso mensal).<br>- Precisa oferecer valor constante para evitar cancelamentos. |
| **Assinatura (B2B)** | Médico / Clínica | Médicos ou clínicas pagam uma licença mensal (ex: R$199/mês) para usar o MediAI como ferramenta de gestão, otimização de diagnósticos e portal para seus pacientes. | - Ticket médio mais alto.<br>- Reduz o custo para o paciente, aumentando a adoção.<br>- Menor churn (taxa de cancelamento). | - Ciclo de vendas mais longo e complexo.<br>- Requer funcionalidades robustas para o profissional. |
| **Híbrido** | Ambos | Combina diferentes modelos. Ex: Plano gratuito para pacientes, mas a validação de diagnóstico é paga; ou uma assinatura para médicos que oferece um número limitado de análises, com pacotes adicionais para compra. | - Flexível, permite capturar diferentes segmentos de mercado.<br>- Maximiza o potencial de receita. | - Pode se tornar complexo para comunicar e gerenciar. |

A escolha do modelo ideal dependerá da estratégia de mercado e do público-alvo principal. A `Análise de Custos` do projeto fornece uma base para o cálculo dos preços de cada serviço.
