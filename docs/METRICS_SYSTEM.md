# Sistema de Rastreamento de Métricas - Gemini API

## Visão Geral

Sistema completo de rastreamento de tokens e tempo de conversa do Gemini API para o MediAI. As métricas são coletadas em tempo real durante as consultas com o agente de IA e enviadas para o backend Next.js para armazenamento e análise.

## Arquitetura

### Componentes

1. **MetricsCollector (Python)** - `livekit-agent/agent.py`
   - Coleta métricas durante a sessão do agente
   - Rastreia tokens STT, LLM, TTS e Vision
   - Rastreia tempo ativo de conversa
   - Calcula custos em centavos BRL

2. **API Endpoint (Next.js)** - `/src/app/api/agent-usage/route.ts`
   - Recebe métricas do agente Python
   - Valida autenticação via `X-Agent-Secret`
   - Salva no banco de dados usando `trackUsage()`

3. **Banco de Dados** - Tabela `usage_tracking`
   - Armazena todas as métricas de uso
   - Permite análise posterior no dashboard admin

## Métricas Rastreadas

### Tokens

- **STT (Speech-to-Text):** Tokens de transcrição de áudio para texto
- **LLM Input:** Tokens de entrada do modelo de linguagem
- **LLM Output:** Tokens de saída do modelo de linguagem
- **TTS (Text-to-Speech):** Tokens de conversão de texto para áudio
- **Vision Input:** Tokens de entrada para análise visual
- **Vision Output:** Tokens de saída da análise visual

### Tempo

- **Active Seconds:** Tempo ativo de processamento de áudio/texto (não inclui tempo de avatar)
- **Avatar Seconds:** Tempo de streaming de avatar (usado para calcular custo de avatar separadamente)

### Custos

Calculados em centavos BRL usando conversão USD→BRL = R$5,42:

- **Gemini 2.5 Flash Native Audio (Live API):**
  - Text Input: $0.50/1M tokens
  - Text Output: $12.00/1M tokens
  - Audio/Video Input (STT): $3.00/1M tokens
  - Audio/Video Output (TTS): $2.00/1M tokens

- **Gemini Vision:**
  - Input: $0.50/1M tokens (same as text)
  - Output: $12.00/1M tokens (same as text)

- **Avatar Providers:**
  - BeyondPresence (BEY): $0.175/minuto
  - Tavus CVI: $0.10/minuto

## Fluxo de Dados

```
┌─────────────────────┐
│   Agente Python     │
│   (agent.py)        │
│                     │
│ MetricsCollector    │
│  - Rastreia tokens  │
│  - Rastreia tempo   │
│  - Calcula custos   │
└──────────┬──────────┘
           │
           │ HTTP POST (a cada 60s + ao final)
           │ Headers: X-Agent-Secret
           │
           ▼
┌─────────────────────┐
│   Next.js API       │
│   /api/agent-usage  │
│                     │
│  - Valida secret    │
│  - Valida dados     │
│  - Salva no DB      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PostgreSQL         │
│  usage_tracking     │
│                     │
│  - Histórico        │
│  - Dashboard Admin  │
└─────────────────────┘
```

## Configuração

### Variáveis de Ambiente

Adicione ao `.env.local` e `livekit-agent/.env`:

```bash
# Secret compartilhado para autenticação
AGENT_SECRET=<secret-aleatorio-seguro>

# URL do backend Next.js (para o agente enviar métricas)
NEXT_PUBLIC_URL=https://your-app.replit.dev
```

### Dependências Python

Adicione ao `livekit-agent/requirements.txt`:

```
httpx>=0.27.0
```

Instale com:

```bash
cd livekit-agent
pip install httpx
```

## Como Funciona

### 1. Inicialização

Quando uma sessão do agente inicia:

```python
# Criar MetricsCollector
metrics_collector = MetricsCollector(
    patient_id=patient_id,
    session_id=session_id
)

# Integrar no agente
agent = MediAIAgent(
    instructions=system_prompt,
    room=ctx.room,
    metrics_collector=metrics_collector
)
```

### 2. Rastreamento de Tokens

#### Estimativa Baseada em Texto

Para STT/LLM/TTS onde metadata não está disponível:

```python
# 1 token ≈ 4 caracteres
metrics_collector.track_stt(transcribed_text)
metrics_collector.track_llm(input_text, output_text)
metrics_collector.track_tts(synthesized_text)
```

#### Tokens Reais de Vision

Para análise visual com metadata real:

```python
# Usa usage_metadata do Gemini
response = vision_model.generate_content([image, prompt])
metrics_collector.track_vision(response.usage_metadata)
```

### 3. Envio Periódico

As métricas são enviadas automaticamente:

- **A cada 60 segundos** durante a sessão
- **Ao final da sessão** quando o agente desconecta

```python
# Envio automático com retry exponencial
await metrics_collector.send_metrics()
```

### 4. Retry com Backoff Exponencial

Em caso de falha de rede:

- Retry 1: espera 2^0 = 1 segundo
- Retry 2: espera 2^1 = 2 segundos
- Retry 3: espera 2^2 = 4 segundos
- Após 3 tentativas, registra erro e continua

## Validações Implementadas

### Endpoint API

✅ Autenticação via `X-Agent-Secret`  
✅ Validação de schema com Zod  
✅ Validação de UUID do paciente  
✅ Verificação de existência do paciente no banco  
✅ Separação de métricas por tipo (STT, LLM, TTS, Vision, AI Call)  
✅ Cálculo correto de custos em centavos BRL  

### Agente Python

✅ Rastreamento de tokens estimados (1 token ≈ 4 caracteres)  
✅ Rastreamento de tokens reais de Vision via `usage_metadata`  
✅ Rastreamento de tempo ativo de conversa  
✅ Envio periódico a cada 60s  
✅ Envio ao final da sessão  
✅ Retry com backoff exponencial (até 3 tentativas)  
✅ Continua funcionando mesmo com falhas de rede temporárias  

## Testando o Sistema

### Teste Manual do Endpoint

```bash
curl -X POST http://localhost:5000/api/agent-usage \
  -H "Content-Type: application/json" \
  -H "X-Agent-Secret: <seu-secret>" \
  -d '{
    "patientId": "<patient-uuid>",
    "sessionId": "test-session-1",
    "sttTokens": 100,
    "llmInputTokens": 200,
    "llmOutputTokens": 300,
    "ttsTokens": 150,
    "visionTokens": 50,
    "visionInputTokens": 25,
    "visionOutputTokens": 25,
    "activeSeconds": 60,
    "avatarSeconds": 45,
    "costCents": 10,
    "metadata": {
      "test": true
    }
  }'
```

Resposta esperada:
```json
{"success": true}
```

### Verificar no Banco de Dados

```sql
SELECT * FROM usage_tracking 
WHERE patient_id = '<patient-uuid>' 
ORDER BY created_at DESC 
LIMIT 10;
```

Você deve ver registros separados para:
- `usage_type = 'stt'` - Tokens STT
- `usage_type = 'llm'` - Tokens LLM
- `usage_type = 'tts'` - Tokens TTS
- `usage_type = 'llm'` (com `visionAnalysis: true`) - Tokens Vision
- `usage_type = 'ai_call'` - Duração da chamada

## Dashboard Admin

As métricas salvas aparecerão automaticamente no dashboard admin em:

- **Admin > Usage** - Página de estatísticas de uso
- **Admin > Patients > [Patient Detail]** - Uso por paciente

## Troubleshooting

### Métricas não aparecem no dashboard

1. Verifique se `AGENT_SECRET` está configurado em ambos `.env.local` e `livekit-agent/.env`
2. Verifique os logs do agente: `[Metrics] ✅ Métricas enviadas com sucesso!`
3. Verifique os logs do Next.js: `[Agent Usage] ✅ Métricas salvas com sucesso`
4. Consulte o banco de dados diretamente

### Erros de autenticação (401)

- Verifique se o `AGENT_SECRET` é o mesmo em ambos os arquivos
- Verifique se o header `X-Agent-Secret` está sendo enviado

### Erros de validação (400)

- Verifique o schema Zod - todos os campos obrigatórios devem estar presentes
- `patientId` deve ser um UUID válido
- Tokens devem ser números inteiros não-negativos

### Métricas não enviadas

- Verifique se `httpx` está instalado: `pip list | grep httpx`
- Verifique a URL do Next.js em `NEXT_PUBLIC_URL`
- Verifique conectividade de rede do agente

## Notas de Implementação

### Estimativas vs. Tokens Reais

- **Gemini Live API** integra STT+LLM+TTS, então usamos estimativas baseadas em texto (1 token ≈ 4 caracteres)
- **Gemini Vision API** fornece `usage_metadata` com tokens reais, então rastreamos valores exatos
- Estimativas são conservadoras e razoavelmente precisas para análise de custos

### Performance

- Envio assíncrono não bloqueia a conversa
- Retry com backoff evita sobrecarga em caso de problemas de rede
- Métricas são agregadas em memória e enviadas em lote (60s)

### Segurança

- `AGENT_SECRET` protege o endpoint contra acessos não autorizados
- Validação de UUID do paciente previne injeção de dados
- Schema Zod garante integridade dos dados

## Manutenção

### Atualizar Preços

Preços estão definidos em:
- `livekit-agent/agent.py` - `MetricsCollector.calculate_cost_cents()`
- `src/app/api/agent-usage/route.ts` - Comentários explicativos

### Adicionar Novos Tipos de Métricas

1. Adicionar campo no schema Zod em `route.ts`
2. Adicionar método de rastreamento em `MetricsCollector`
3. Adicionar lógica de salvamento em `POST` handler
4. Atualizar cálculo de custos se necessário

---

**Sistema implementado em:** 29 de Outubro de 2025  
**Status:** ✅ Completo e testado  
**Versão:** 1.0.0
