# Parecer Regulatório - Estratégia de Registro ANVISA (Software as a Medical Device - SaMD)

**Produto:** Medi.AI (Meu-Doutor)
**Classificação Proposta:** Risco Classe II (Médio Risco)
*Data da Análise: Fev/2026*

## 1. Enquadramento Legal
O aplicativo Medi.AI atua como um "Software as a Medical Device" (SaMD), enquadrando-se nas diretrizes da **RDC nº 657/2022** da ANVISA, que dispõe sobre a regularização de software como dispositivo médico.
Dado que a solução realiza *triagem algorítmica e análise preliminar de exames de imagem e laboratoriais multimodais*, recomendando um Plano de Bem Estar antes da predição final do médico, enquadra-se no conceito de Software com finalidade diagnóstica/preventiva intermediária.

## 2. Classificação de Risco (RDC nº 830/2023)
Pleiteamos a adequação do Medi.AI à **Regra 11 - Software Diag / Terapêutico** e de monitoramento fisiológico.
Acreditamos que o software recai prioritariamente na **Classe II (Médio Risco Categoria B)** porque:
*   As IAs Especialistas (um esquadrão de **16 agentes** orquestrados em paralelo no Firebase Genkit) apenas sugerem o direcionamento preventivo e resumem dados clínicos complexos em uma visão omni.
*   **Controle de Mitigação Human-in-the-Loop ("Marketplace de Diagnóstico"):** O laudo da máquina é ESTRITAMENTE **NÃO DEFINITIVO**. Todo processo gera um payload em um dashboard de fila prioritária. Um Médico parceiro (devidamente certificado no CRM) "aceita a corrida", analisa a triagem mastigada, homologa o receituário e clica no botão "Validar Laudo Médico" assumindo a responsabilidade civil e clínica.
*   Logo, a inteligência artificial não atua de forma inquestionável no diagnóstico ou prescrição terminal de doenças graves, servindo 100% como Sistema de Apoio à Decisão Clínica (CDSS).

## 3. Requisitos de Submissão (Boas Práticas de Fabricação)
Para prosseguir com o deferimento do registro de Classe II na ANVISA, estamos implementando o arcabouço de Sistema de Gestão de Qualidade compatível com a **ISO 13485:2016** e a **RDC nº 665/2022 (CBPF)**, contendo:
*   **Engenharia de Usabilidade (IEC 62366):** Mitigação de confusão gráfica na distinção entre o "Selo IA" e "Selo Médico Validou".
*   **Gerenciamento de Risco (ISO 14971):** Tabela de FMEA implementada detalhando os riscos de "Alucinações da LLM (Google Gemini)" com a medida profilática de disclaimer contínuo.
*   **Ciclo de Vida de Software Médio (IEC 62304):** Rastreador de bugs já conectado na esteira do CI/CD com o *Sentry*, provando controle absoluto de versionamento numérico das heurísticas da IA.

## 4. Avaliação e Estudos Clínicos Requeridos
Conforme prevê a legislação SaMD para a submissão, anexaremos (vide Documento de Evidência Clínica) o dossiê da comprovação empírica retroativa de mais de 100 análises médicas comparativas onde especialistas aprovaram as minutas preliminares elaboradas pelos Agentes Orquestrados Genkit do Medi.AI, consolidando sua robustez na detecção sintomática sem Falsos-Negativos contundentes de risco.

*Documento Preparatório Confidencial - Uso Interno - Assessoria Regulatória ALFA GLOBAL SERVICES TECHNOLOGY LTDA*
