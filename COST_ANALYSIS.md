# Análise de Custos da API Gemini para 1.000 Usuários Ativos/Mês

Este documento detalha uma estimativa de custos para a utilização da API do Google Gemini na plataforma MediAI, considerando uma base de 1.000 usuários ativos mensais.

_**Aviso:** Os preços são baseados nos valores do Google em Junho de 2024 para a região `us-central1` e podem variar. Esta é uma **estimativa** e os custos reais podem ser diferentes dependendo do uso exato._

---

## 1. Premissas de Uso (por usuário/mês)

- **Consultas com a IA:** 2 consultas/mês.
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
- **Custo Mensal (1.000 usuários, 2 consultas/mês):**
  - `1000 * 2 * $0.003125` = **$6.25**

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
- **Premissa:** O áudio é gerado durante a consulta e na visualização do diagnóstico. Total de ~15.000 caracteres por usuário/mês.
- **Custo por usuário:** `15k caracteres * $0.0006 = $0.009`
- **Custo Mensal (1.000 usuários):**
  - `1000 * $0.009` = **$9.00**

---

## 4. Estimativa de Custo Mensal Total

| Funcionalidade | Custo Mensal Estimado |
| :--- | :--- |
| Consultas com a IA | $6.25 |
| Análise de Exames | $0.69 |
| Geração de Diagnóstico | $2.50 |
| Geração de Plano/Explicação | $2.25 |
| Texto para Áudio (TTS) | $9.00 |
| **Total** | **$20.69** |

---

## Conclusão

O custo estimado para operar a plataforma MediAI com 1.000 usuários ativos mensais é de aproximadamente **$20.69 por mês**.

O maior custo vem do serviço de **Texto para Áudio (TTS)**, devido ao seu preço por caractere ser maior. O segundo maior custo é a **Consulta com a IA**, por ser uma funcionalidade de alta frequência e interatividade.

Para otimizar custos no futuro, poderíamos considerar estratégias como:
- Limitar a duração ou o número de consultas com a IA por mês no plano gratuito.
- Utilizar cache para respostas e áudios que não precisam ser gerados em tempo real.
- Oferecer a funcionalidade de áudio apenas em planos pagos.
