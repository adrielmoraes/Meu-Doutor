# 🚀 Guia de Configuração: LiveKit + Tavus + Gemini

Este guia explica como configurar a nova arquitetura de consultas ao vivo do MediAI usando LiveKit, Tavus Avatar e Gemini API.

## 📊 Visão Geral da Arquitetura

```
┌─────────────────────┐
│  Frontend Next.js   │
│  (Navegador)        │
└──────────┬──────────┘
           │ WebRTC
           ▼
┌──────────────────────────────┐
│   LiveKit Cloud Room         │
│   - Baixa latência          │
│   - WebRTC streaming        │
└────────┬─────────────┬───────┘
         │             │
         ▼             ▼
┌────────────────┐  ┌─────────────────┐
│ Python Agent   │  │ Tavus Avatar    │
│ (MediAI)       │──│ Worker          │
│                │  │ (Vídeo+Áudio)   │
│ ┌────────────┐ │  └─────────────────┘
│ │ Gemini API │ │
│ │ - STT      │ │
│ │ - LLM      │ │
│ │ - TTS      │ │
│ └────────────┘ │
│                │
│ ┌────────────┐ │
│ │ Banco de   │ │
│ │ Dados      │ │
│ │ Postgres   │ │
│ └────────────┘ │
└────────────────┘
```

## 🔑 Passo 1: Obter Credenciais LiveKit

### Criar Conta LiveKit Cloud

1. Acesse https://cloud.livekit.io
2. Crie uma conta gratuita (10.000 minutos/mês grátis)
3. Crie um novo projeto

### Obter Credenciais

No dashboard do LiveKit, você encontrará:

- **`LIVEKIT_URL`**: Ex: `wss://seu-projeto.livekit.cloud`
- **`LIVEKIT_API_KEY`**: Ex: `APIxxxxxxxxxxxx`
- **`LIVEKIT_API_SECRET`**: Ex: `secretxxxxxxxxxxxxxxxxxx`

## 🎭 Passo 2: Configurar Tavus (Já Configurado)

Você já tem:
- ✅ `TAVUS_API_KEY`
- ✅ `TAVUS_REPLICA_ID`
- ✅ `TAVUS_PERSONA_ID`

## 🤖 Passo 3: Configurar Gemini API (Já Configurado)

Você já tem:
- ✅ `GEMINI_API_KEY`

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

### No Replit (Frontend/Backend)

Adicione as seguintes secrets no Replit:

```bash
# LiveKit (ADICIONAR)
LIVEKIT_URL=wss://seu-projeto.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxx
LIVEKIT_API_SECRET=secretxxxxxxxxxxxxxxxxxx

# Gemini (JÁ CONFIGURADO)
GEMINI_API_KEY=your_existing_gemini_key

# Tavus (JÁ CONFIGURADO)
TAVUS_API_KEY=your_existing_tavus_key
TAVUS_REPLICA_ID=your_existing_replica_id
TAVUS_PERSONA_ID=your_existing_persona_id

# Database (JÁ CONFIGURADO)
DATABASE_URL=your_existing_database_url
```

### No Python Agent

1. Entre na pasta `livekit-agent/`
2. Copie o `.env.example` para `.env`:
   ```bash
   cd livekit-agent
   cp .env.example .env
   ```

3. Edite o arquivo `.env` e preencha as variáveis:
   ```bash
   nano .env  # ou use seu editor preferido
   ```

## 🐍 Passo 5: Configurar Python Agent

### Instalar Python 3.10+ (se necessário)

Verifique sua versão:
```bash
python --version
```

Se necessário, instale Python 3.10 ou superior.

### Criar Ambiente Virtual

```bash
cd livekit-agent
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### Instalar Dependências

```bash
pip install -r requirements.txt
```

Isso instalará:
- `livekit` - SDK LiveKit
- `livekit-agents` - Framework de agents
- `livekit-plugins-tavus` - Plugin Tavus Avatar
- `google-generativeai` - Gemini API
- `asyncpg` - PostgreSQL async
- E outras dependências

### Testar o Agent

Modo desenvolvimento (terminal/console):
```bash
python agent.py dev
```

Você deve ver:
```
[MediAI] Starting agent...
[MediAI] Gemini API configured
[MediAI] LiveKit connected
```

## 📦 Passo 6: Dependências Node.js (Já Instalado)

As seguintes dependências já foram instaladas:
- ✅ `@livekit/components-react`
- ✅ `@livekit/components-styles`
- ✅ `livekit-client`
- ✅ `livekit-server-sdk`

## 🚀 Passo 7: Executar o Sistema Completo

### Terminal 1: Frontend Next.js (Replit)

Já está rodando automaticamente no Replit:
```bash
npm run dev
```

### Terminal 2: Python Agent

```bash
cd livekit-agent
source venv/bin/activate  # ativar ambiente virtual
python agent.py start
```

O agent ficará aguardando conexões de salas LiveKit.

## 🧪 Passo 8: Testar a Integração

1. **Acesse o frontend**: Faça login como paciente
2. **Navegue até**: `/patient/live-consultation-new`
3. **Clique em**: "Iniciar Consulta ao Vivo"
4. **Permita**: Acesso ao microfone e câmera
5. **Aguarde**: Conexão com LiveKit e inicialização do avatar
6. **Converse**: Com a MediAI naturalmente!

## 🔍 Verificar se Está Funcionando

### Frontend

Verifique o console do navegador (F12):
```
[LiveKit] Token gerado para João Silva na sala mediai-consultation-abc123
[LiveKit] Conectado à sala
[LiveKit] Participante adicionado: MediAI Assistant
```

### Python Agent

Verifique o terminal do agent:
```
[MediAI] Starting agent for patient: abc123
[MediAI] Loading context for patient: abc123
[MediAI] Patient context loaded (2456 chars)
[MediAI] Initializing Tavus avatar...
[MediAI] Tavus avatar initialized
[MediAI] Starting voice session...
[MediAI] Agent session started successfully
```

## ⚠️ Troubleshooting

### "LIVEKIT_URL not found"
→ Adicione as variáveis LiveKit nos Secrets do Replit

### "Cannot connect to LiveKit"
→ Verifique se o URL está correto e começa com `wss://`

### "Tavus avatar não aparece"
→ Verifique se TAVUS_API_KEY e TAVUS_REPLICA_ID estão configurados
→ Confira se você tem créditos Tavus disponíveis

### "Python agent não inicia"
→ Verifique se todas as dependências foram instaladas: `pip install -r requirements.txt`
→ Confirme que o .env está configurado corretamente

### "Erro no Gemini API"
→ Verifique se GEMINI_API_KEY está correto
→ Confirme que você tem quota disponível na Google Cloud

### "Erro de database"
→ Verifique se DATABASE_URL está configurado
→ Teste a conexão com o Neon PostgreSQL

## 📊 Monitoramento

### LiveKit Cloud Dashboard

Acesse https://cloud.livekit.io para ver:
- Salas ativas
- Participantes conectados
- Uso de minutos
- Logs em tempo real

### Logs do Agent

O agent mostra logs detalhados:
```
[MediAI] Patient context loaded
[MediAI] Function called: get_latest_exams
[MediAI] Gemini LLM response: "Olá João, vejo que você teve..."
[MediAI] Tavus TTS synthesizing...
```

## 💰 Custos Estimados

| Serviço | Tier Gratuito | Custo Após |
|---------|---------------|------------|
| **LiveKit** | 10k min/mês | ~$0.004/min |
| **Gemini API** | Grátis (com limites) | Varia por modelo |
| **Tavus** | Depende do plano | Por minuto de uso |
| **Neon PostgreSQL** | 0.5GB grátis | $0.10/GB/mês |

## 🎯 Próximos Passos

1. ✅ Configurar credenciais LiveKit
2. ✅ Instalar dependências Python
3. ✅ Testar agent em modo `dev`
4. ✅ Testar integração completa Frontend ↔ Agent
5. ⬜ Implementar salvamento de transcrição no banco
6. ⬜ Adicionar analytics e métricas
7. ⬜ Deploy do Python agent em produção

## 📚 Recursos Adicionais

- **LiveKit Docs**: https://docs.livekit.io/agents
- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs
- **Tavus Docs**: https://docs.tavus.io
- **Exemplo GitHub**: https://github.com/livekit-examples/python-agents-examples

## 🆘 Suporte

Se precisar de ajuda:

1. Verifique os logs do agent e do frontend
2. Consulte a documentação do LiveKit
3. Teste em modo `dev` antes de testar a integração completa
4. Confirme que todas as variáveis de ambiente estão configuradas

---

**Última atualização**: 19 de outubro de 2025
