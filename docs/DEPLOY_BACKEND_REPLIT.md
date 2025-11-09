# 🐍 Backend Python LiveKit Agent - Replit Deploy

## ✅ Status Atual

O backend Python já está configurado e rodando no Replit! ✨

### Workflow Configurado:
- **Nome:** MediAI Avatar Agent
- **Comando:** `cd livekit-agent && python run-agent.py`
- **Status:** ✅ Rodando

## 📋 Checklist de Verificação

### 1. Variáveis de Ambiente (Secrets)
Certifique-se de que estas variáveis estão configuradas no Replit:

```env
LIVEKIT_API_KEY=APIrYvWHxL...
LIVEKIT_API_SECRET=seu_secret_aqui
LIVEKIT_URL=wss://mediai-livikit-gmavbnbs.livekit.cloud
GEMINI_API_KEY=AIza...
DATABASE_URL=postgresql://neondb_owner:...
TAVUS_API_KEY=seu_tavus_key (opcional)
BEY_API_KEY=seu_bey_key (opcional)
```

### 2. Dependências Instaladas
✅ Todas as dependências Python foram instaladas via `requirements.txt`:
- livekit
- livekit-agents
- livekit-plugins-tavus
- livekit-plugins-bey ✨ (adicionado)
- livekit-plugins-google
- google-generativeai
- python-dotenv
- asyncpg, psycopg2-binary
- aiohttp, httpx
- tenacity

### 3. Estrutura do Projeto

```
livekit-agent/
├── agent.py              # Agente principal
├── run-agent.py          # Script de inicialização
├── requirements.txt      # Dependências
└── .env                  # Variáveis locais (não commitado)
```

## 🚀 Como Manter Rodando 24/7

### Opção 1: Replit Always On (Recomendado)

Se você tem um plano pago do Replit:
1. Vá em configurações do Repl
2. Ative "Always On"
3. O agente rodará continuamente

### Opção 2: UptimeRobot (Gratuito)

Se está no plano gratuito:
1. Crie uma conta em [UptimeRobot](https://uptimerobot.com)
2. Adicione um monitor HTTP(S)
3. URL: `https://seu-repl.replit.dev` (ou endpoint de health check)
4. Intervalo: 5 minutos
5. O UptimeRobot fará ping e manterá o Repl ativo

### Opção 3: Criar Health Check Endpoint

Adicione este endpoint no seu projeto Next.js:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

E configure o UptimeRobot para fazer ping em: `https://seu-repl.replit.dev/api/health`

## 📊 Monitoramento

### Ver Logs do Agente

No Replit:
1. Clique na aba "Console"
2. Selecione o workflow "MediAI Avatar Agent"
3. Veja logs em tempo real

Ou use as ferramentas do Replit Agent:
```typescript
refresh_all_logs() // Ver todos os logs
```

### Logs Esperados (Normal)

```
🚀 MediAI LiveKit Agent - 100% Gemini Powered
============================================================
✅ Configuração LiveKit Agent:
  • LiveKit URL: wss://mediai-livikit-gmavbnbs.livekit.cloud
  • LiveKit API Key: APIrYvWHxL...
  • Gemini API: ✅ Configurado
  • Avatar Providers Disponíveis:
    - Tavus: 🎭 CONFIGURADO
    - Beyond Presence (BEY): 🎭 CONFIGURADO
  • Database: ✅ Configurado
============================================================
{"message": "registered worker", "level": "INFO"}
```

### Logs de Erro Comuns

**Erro: "cannot import name 'bey'"**
- ✅ **Resolvido!** Plugin instalado

**Erro: "LIVEKIT_API_KEY não configurado"**
- Adicione as variáveis de ambiente no Replit Secrets

**Erro: "ModuleNotFoundError: No module named 'dotenv'"**
- ✅ **Resolvido!** Dependência instalada

## 🔧 Troubleshooting

### Agente não está conectando

1. **Verificar se está rodando:**
```bash
# No console Replit
ps aux | grep python
```

2. **Reiniciar workflow:**
   - Pare o workflow
   - Inicie novamente
   - Aguarde 10-15 segundos

3. **Verificar conexão LiveKit:**
```bash
curl -I https://mediai-livikit-gmavbnbs.livekit.cloud
```

### Agente conecta mas não responde

1. **Verificar GEMINI_API_KEY:**
   - Confirme que está configurada
   - Teste em outro projeto

2. **Ver logs detalhados:**
   - Aumentar nível de log no `agent.py`
   - Adicionar `logger.setLevel(logging.DEBUG)`

## 🎯 Integração com Frontend (Vercel)

O agente Python **NÃO precisa** estar no mesmo servidor que o frontend!

### Como funciona:

1. **Usuário acessa frontend** (Vercel)
2. **Frontend solicita token** (Next.js API route)
3. **Frontend conecta no LiveKit Cloud**
4. **LiveKit Cloud detecta sala** e chama o agente Python (Replit)
5. **Agente responde** via LiveKit Cloud
6. **Frontend recebe áudio/vídeo**

### Configuração no Frontend:

```typescript
// Não precisa saber onde está o agente!
const LIVEKIT_URL = 'wss://mediai-livikit-gmavbnbs.livekit.cloud';

// O LiveKit Cloud encontra o agente automaticamente
```

## 📈 Escalabilidade

### Workers Paralelos

O LiveKit suporta múltiplos workers do mesmo agente:

```bash
# No run-agent.py, você pode configurar:
WorkerOptions(
    entrypoint_fnc=entrypoint,
    num_workers=4,  # 4 workers paralelos
)
```

### Load Balancing

O LiveKit Cloud automaticamente distribui consultas entre workers disponíveis.

## 💡 Dicas

1. **Logs são seus amigos:** Sempre verifique os logs antes de debugar
2. **Teste localmente:** Use `python agent.py dev` para testar localmente
3. **Monitore métricas:** O LiveKit Cloud tem dashboard com métricas
4. **Backup das configs:** Mantenha um arquivo `.env.example` no repo

## 🎓 Recursos

- [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- [LiveKit Cloud Dashboard](https://cloud.livekit.io/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Tavus Docs](https://docs.tavus.io/)
- [Beyond Presence Docs](https://docs.bey.dev/)

---

**Status:** ✅ Backend rodando e pronto para produção!
