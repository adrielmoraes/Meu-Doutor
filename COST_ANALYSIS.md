# Análise de Custos da API Gemini para 1.000 Usuários Ativos/Mês

Este documento detalha uma estimativa de custos para a utilização da API do Google Gemini na plataforma MediAI, considerando uma base de 1.000 usuários ativos mensais.

_**Aviso:** Os preços são baseados nos valores do Google em Junho de 2024 para a região `us-central1` e podem variar. Esta é uma **estimativa** e os custos reais podem ser diferentes dependendo do uso exato._

---

## 1. Premissas de Uso (por usuário/mês)

- **Consultas com a IA:** 12 consultas/mês (cenário de uso mais intenso).
- **Duração da Consulta:** 10 trocas de mensagens (5 do usuário, 5 da IA).
- **Análise de Exames:** 1 exame/mês.
- **Validação de Diagnóstico:** 1 validação/mês.
- **Geração de Plano de Bem-Estar:** 1 plano/mês.

## 2. Modelos de IA e Preços

| Modelo | Função | Preço (Input) | Preço (Output) |
| :--- | :--- | :--- | :--- |
| **Gemini 2.0 Flash** | Chat, Análise, Resumos | $0.000125 / 1k caracteres | $0.00025 / 1k caracteres |
| **Gemini 2.0 Flash (Visão)** | Análise de Exames (imagem) | $0.00025 / imagem | - |
| **Gemini 2.5 Flash TTS** | Texto para Áudio | $0.0006 / 1k caracteres | - |

---

## 3. Cálculo de Custo por Funcionalidade (1.000 usuários)

### a. Consulta com a IA (Chat)
- **Premissa:** Cada troca tem ~500 caracteres de input e ~1000 de output (contexto + resposta).
- **Custo por consulta (10 trocas):**
  - Input: `10 * 500 = 5k caracteres` -> `5 * $0.000125 = $0.000625`
  - Output: `10 * 1000 = 10k caracteres` -> `10 * $0.00025 = $0.0025`
  - Total por consulta: `$0.003125`
- **Custo Mensal (1.000 usuários, 12 consultas/mês):**
  - `1000 * 12 * $0.003125` = **$37.50**

### b. Análise de Exames Médicos
- **Premissa:** 1 documento de exame (imagem) e um prompt com ~500 caracteres. A IA retorna ~1.500 caracteres.
- **Custo por análise:**
  - Imagem (Input): `1 * $0.00025 = $0.00025`
  - Texto (Input): `0.5k caracteres * $0.000125 = $0.0000625`
  - Texto (Output): `1.5k caracteres * $0.00025 = $0.000375`
  - Total por análise: `$0.0006875`
- **Custo Mensal (1.000 usuários, 1 exame/mês):**
  - `1000 * $0.0006875` = **$0.69**

### c. Geração de Diagnóstico Preliminar (Médico)
- **Premissa:** 1 chamada de triagem + 3 chamadas para agentes especialistas + 1 chamada de síntese. Total de 5 chamadas de modelo por paciente. Cada chamada tem ~2k de input e ~1k de output.
- **Custo por diagnóstico:**
  - Input: `5 * 2k = 10k caracteres` -> `10 * $0.000125 = $0.00125`
  - Output: `5 * 1k = 5k caracteres` -> `5 * $0.00025 = $0.00125`
  - Total por diagnóstico: `$0.0025`
- **Custo Mensal (1.000 usuários, 1 validação/mês):**
  - `1000 * $0.0025` = **$2.50**

### d. Geração de Plano de Bem-Estar e Explicação
- **Premissa:** 3 chamadas de modelo (plano de bem-estar, insights de saúde, explicação para o paciente). Cada chamada tem ~2k de input e ~2k de output.
- **Custo por geração:**
  - Input: `3 * 2k = 6k caracteres` -> `6 * $0.000125 = $0.00075`
  - Output: `3 * 2k = 6k caracteres` -> `6 * $0.00025 = $0.0015`
  - Total por geração: `$0.00225`
- **Custo Mensal (1.000 usuários, 1 plano/mês):**
  - `1000 * $0.00225` = **$2.25**

### e. Custo de Texto para Áudio (TTS)
- **Premissa:** O áudio é gerado durante a consulta e na visualização do diagnóstico. Dado 12 consultas, o total de caracteres por usuário/mês para áudio aumenta significativamente.
- **Caracteres por usuário/mês:** `(12 consultas * 10k output) + 5k (outros áudios)` = 125k caracteres
- **Custo por usuário:** `125k caracteres * $0.0006 = $0.075`
- **Custo Mensal (1.000 usuários):**
  - `1000 * $0.075` = **$75.00**

---

## 4. Estimativa de Custo Mensal Total (Uso Intenso)

| Funcionalidade | Custo Mensal Estimado |
| :--- | :--- |
| Consultas com a IA | $37.50 |
| Análise de Exames | $0.69 |
| Geração de Diagnóstico | $2.50 |
| Geração de Plano/Explicação | $2.25 |
| Texto para Áudio (TTS) | $75.00 |
| **Total (API Gemini)** | **$117.94** |

---

## 5. Cenário "Super Usuário" (Custo por Paciente/Mês)

Este cenário calcula o custo mensal da API para um único paciente com um volume de uso extremamente alto.

- **Premissas:**
  - **Consultas com a IA:** 30 consultas/mês
  - **Análise de Exames:** 15 análises/mês
  - **Outros Fluxos (Diagnóstico, Plano, etc.):** 1 por mês

- **Cálculo de Custo por Paciente:**
  - **Custo das Consultas:** `30 consultas * $0.003125/consulta` = **$0.09375**
  - **Custo das Análises de Exame:** `15 exames * $0.0006875/exame` = **$0.0103125**
  - **Custo dos Outros Fluxos:** `$0.0025 (diagnóstico) + $0.00225 (plano)` = **$0.00475**
  - **Custo de Texto para Áudio (TTS):**
    - Caracteres de consulta: `30 consultas * 10k output` = 300k
    - Caracteres de outros áudios: `~5k`
    - Custo total de TTS: `305k caracteres * $0.0006` = **$0.183**
  
- **Custo Final por Paciente (Super Usuário):**
  - `$0.09375 + $0.0103125 + $0.00475 + $0.183` = **$0.2918**

---

## 6. Modelos de Remuneração para Médicos (Análise Conceitual)

Esta seção aborda os custos operacionais com os profissionais de saúde, que são distintos dos custos da API. A escolha do modelo de remuneração é uma decisão de negócio e os valores abaixo são meramente ilustrativos.

| Modelo | Descrição | Vantagens | Desvantagens |
| :--- | :--- | :--- | :--- |
| **Pagamento por Ato** | O médico recebe um valor fixo por cada ato (ex: validação de diagnóstico, consulta virtual). Ex: `$20` por validação. | - Custo variável, escala com o uso.<br>- Incentiva a produtividade. | - Renda instável para o médico.<br>- Pode incentivar a quantidade sobre a qualidade. |
| **Salário / Retainer** | O médico recebe um valor fixo mensal para garantir disponibilidade. Ex: `$2,000/mês` por 20h/semana. | - Custo previsível.<br>- Maior estabilidade e retenção do médico. | - Custo fixo alto, mesmo com baixa demanda.<br>- Menor incentivo à produtividade extra. |
| **Modelo Híbrido** | Combinação de um valor fixo com pagamento por ato. Ex: `$500/mês` + `$10` por validação. | - Equilibra segurança para o médico com incentivos de produtividade. | - Mais complexo de administrar. |
| **Revenue Share** | O médico recebe uma porcentagem da receita gerada por suas consultas. Ex: 50% do valor da consulta paga pelo paciente. | - Alinha os interesses do médico e da plataforma.<br>- Baixo risco financeiro inicial para a plataforma. | - A receita do médico pode ser muito variável.<br>- Requer um modelo de negócio onde o paciente paga diretamente. |

### Conclusão sobre Custos com Médicos

Os custos com os médicos são um componente significativo e devem ser cuidadosamente modelados no plano de negócios. Para o protótipo MediAI, o modelo de **Pagamento por Ato** é o mais simples de simular, onde o custo total seria `(Nº de Validações * Valor por Validação)`. Em um negócio real, o **Modelo Híbrido** costuma ser o mais atraente para ambas as partes.

---

## Conclusão Geral

Com um cenário de uso mais intenso (12 consultas por mês), o custo estimado apenas com a **API Gemini** para operar a plataforma MediAI com 1.000 usuários ativos mensais sobe para aproximadamente **$117.94 por mês**. Neste novo cenário, o serviço de **Texto para Áudio (TTS)** se torna o maior responsável pelos custos, seguido pelas **Consultas com a IA**.

Para um **super usuário** individual, com 30 consultas e 15 análises de exame por mês, o custo da API seria de aproximadamente **$0.29**. Este valor serve como um teto para entender o custo máximo que um único paciente poderia gerar na plataforma sob uso extremo.

Para otimizar custos, as estratégias mencionadas anteriormente se tornam ainda mais relevantes:
- Limitar o número de consultas com IA ou a funcionalidade de áudio em planos gratuitos.
- Implementar cache para respostas e áudios.
- Explorar modelos de IA potencialmente mais baratos ou eficientes no futuro.
