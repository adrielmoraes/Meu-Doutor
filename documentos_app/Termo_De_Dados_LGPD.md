# Termo de Privacidade, Tratamento de Dados (LGPD) e Consentimento Informado

**Medi.AI - Assistente de Saúde Inteligente**

*Aviso: Este é um documento simulado, criado para o projeto protótipo Medi.AI. Antes da publicação a um ambiente de produção comercial ou uso real médico, este documento precisa de revisão por um escritório de advocacia sênior.**

## 1. Escopo e Concordância
Ao acessar o Medi.AI ("A Plataforma"), você está concordando automática e inexoravelmente com a coleta, retenção e processamento de informações que garantam as melhores deliberações em saúde, sob inteira e contínua vigilância rigorosa de nossa Política de Privacidade baseada na **Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)** do Brasil.

## 2. Coleta e Finalidade de Dados Sensíveis
O uso precípuo do aplicativo necessita de processamento de:
*   **Identificação Pessoal (PII):** Nome, e-mail, foto, e data de nascimento.
*   **Dados e Imagens Clínicas Essenciais (Sensíveis):** Gravações e transcrições da "Triagem por Voz" via WebRTC, imagens e relatórios de exames na nuvem (Vision AI em PDFs/JPGs) e deliberações firmadas pelos médicos da plataforma.
*   **Finalidade do Processamento:** Alimentar a junta orquestrada de Inteligência Artificial para fins EXCLUSIVOS de preparar laudos preliminares estruturados aos médicos credenciados da rede. NUNCA monetizamos o conteúdo primário do prontuário.

## 3. Segurança Técnica e de Rede (Criptografia)
Garantimos:
1.  **Isolamento Autoritário:** Seu painel ("auth layer") encontra-se segregado das coleções de "Exames" no Banco de Dados em nuvem, garantindo acessibilidade exclusiva ao portador ou ao Médico (com prévio consentimento logístico).
2.  **Criptografia "At-Rest" e "In-Transit":** Todos os dados transitam baseados na política obrigatória `TLS-1.3 / HTTPS`. O armazenamento encontra-se ofuscado de forma assimétrica ponta a ponta na GCP (Google Cloud) via Firebase/Neon DB.

## 4. IA como Serviço Auxiliar e Orquestrado (Consentimento Ciente)
Ao submeter seus exames ao módulo Firebase Genkit:
*   Você DECLARA CIENTE que uma **junta especializada de 16 Inteligências Artificiais em arquitetura de "Modelos Fundamentais de Linguagem" (LLM)** atuará de forma simultânea e paralela varrendo seus exames e histórica médica para identificar marcadores patológicos.
*   Os resultados preditos PELA IA *DE MODO ALGUM* SUBSTITUEM OS TRATAMENTOS OU AS PRESCRIÇÕES EFETUADAS POR UM PROFISSIONAL HUMANO COM CRM ATIVO (que atua sob curadoria no Marketplace "Gig Economy" da plataforma).

## 5. Retenção e Direito de Interrupção Mútua (Deletar Conta)
A conformidade da LGPD garante que no app você disponha nas configurações da aba "Apagar Conta" o encerramento sistêmico. Toda e qualquer tabela relacional de PII ou Dados Sensíveis indexados via ID de Paciente (incluindo áudios passados ou exames legados na aba Categoria de bucket na nuvem) serão apagados definitivamente do serviço a título precário em um buffer não reversível de horas após o clique (Art 18, Inc VI - LGPD).

**Última Atualização:** 25 de Fevereiro de 2026.
 ALFA GLOBAL SERVICES TECHNOLOGY LTDA (CNPJ 34.419.151/0001-09)
