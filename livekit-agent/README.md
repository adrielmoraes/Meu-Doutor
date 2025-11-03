# MediAI LiveKit Agent

Servidor Python que executa o agente de voz MediAI com integração Tavus Avatar e Gemini API.

## 🏗️ Arquitetura

```
Frontend (Next.js) 
    ↓ WebRTC
LiveKit Room
    ↓
Python Agent (este servidor)
    ├── Gemini API (STT, LLM, TTS)
    ├── Tavus Avatar (Video realista)
    ├── Medical Tools (acesso ao banco de dados)
    └── Functions (ferramentas para o LLM)
```

## 📋 Pré-requisitos

### 1. Python 3.10+
Verifique sua versão:
```bash
python --version
```

### 2. Credenciais Necessárias

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Preencha as seguintes variáveis:

#### LiveKit (https://cloud.livekit.io)
- `LIVEKIT_URL` - URL do seu projeto (ex: wss://seu-projeto.livekit.cloud)
- `LIVEKIT_API_KEY` - API Key
- `LIVEKIT_API_SECRET` - API Secret

#### Gemini API (https://ai.google.dev)
- `GEMINI_API_KEY` - Sua chave Gemini API

#### Tavus (https://platform.tavus.io)
- `TAVUS_API_KEY` - Tavus API Key
- `TAVUS_REPLICA_ID` - ID do avatar/replica
- `TAVUS_PERSONA_ID` - (Opcional) ID da persona

#### Database
- `DATABASE_URL` - PostgreSQL connection string (Neon)

## 🚀 Instalação

1. **Criar ambiente virtual** (recomendado):
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

2. **Instalar dependências**:
```bash
pip install -r requirements.txt
```

## 🎯 Como Executar

### Modo Development (Console/Terminal)

Para testar localmente sem frontend:

```bash
python agent.py dev
```

Isso inicia o agent em modo console - você pode falar diretamente usando seu microfone.

### Modo Production (LiveKit Room)

Para conectar ao LiveKit Cloud e receber conexões do frontend:

```bash
python agent.py start
```

O agent ficará aguardando conexões de salas LiveKit.

### Deploy (LiveKit Cloud)

Para fazer deploy automático no LiveKit Cloud:

```bash
lk deploy
```

## 🧰 Estrutura do Código

```
livekit-agent/
├── agent.py                 # Agent principal
├── gemini_provider.py       # Providers Gemini (STT, LLM, TTS)
├── medical_tools/           # Ferramentas médicas
│   ├── __init__.py
│   ├── patient_data.py     # Acesso a dados do paciente
│   └── wellness.py         # Planos de bem-estar
├── requirements.txt        # Dependências Python
├── .env.example           # Template de variáveis de ambiente
└── README.md              # Esta documentação
```

## 🛠️ Funcionalidades do Agent

### Providers Customizados

**GeminiSTT** - Speech-to-Text usando Gemini Multimodal API
- Transcrição em português brasileiro
- Alta precisão

**GeminiLLM** - Large Language Model com Gemini 2.0 Flash
- Conversa contextual
- Acesso ao histórico médico do paciente
- Tool calling (funções customizadas)

**GeminiTTS** - Text-to-Speech com Gemini 2.5 TTS
- Voz natural em português
- 24kHz de qualidade

### Medical Tools (Funções do LLM)

O agent tem acesso às seguintes funções:

1. **`get_latest_exams(limit=3)`**
   - Busca últimos exames do paciente
   - Retorna tipo, data, status e diagnóstico

2. **`get_patient_symptoms()`**
   - Retorna sintomas relatados no cadastro

3. **`check_wellness_plan()`**
   - Verifica plano de bem-estar atual
   - Mostra dieta e exercícios

### Contexto Automático

O agent carrega automaticamente:
- Informações básicas do paciente
- Histórico de exames
- Histórico de consultas
- Plano de bem-estar

Tudo isso é injetado nas instruções do LLM.

## 🎭 Integração Tavus Avatar

Se as credenciais Tavus estiverem configuradas, o agent:

1. Cria uma sessão de avatar no LiveKit Room
2. O avatar aparece como participante separado
3. Avatar sincroniza lábios com a fala do TTS
4. Vídeo realista em tempo real

**Sem Tavus**: Agent funciona normalmente, apenas sem o avatar visual.

## 📊 Logs e Debugging

O agent mostra logs detalhados:

```
[MediAI] Starting agent for patient: abc123
[MediAI] Loading context for patient: abc123
[MediAI] Patient context loaded (2456 chars)
[MediAI] Initializing Tavus avatar...
[MediAI] Tavus avatar initialized
[MediAI] Starting voice session...
[MediAI] Agent session started successfully
```

## 🔧 Troubleshooting

### "GEMINI_API_KEY not found"
→ Verifique se o arquivo `.env` existe e tem a chave

### "DATABASE_URL not found"
→ Configure a variável DATABASE_URL com a connection string do Neon

### "Tavus credentials not found"
→ Agent funciona sem avatar. Adicione TAVUS_API_KEY e TAVUS_REPLICA_ID se quiser o avatar.

### Import errors
→ Certifique-se de instalar todas as dependências:
```bash
pip install -r requirements.txt
```

## 📚 Recursos Adicionais

- **LiveKit Docs**: https://docs.livekit.io/agents
- **Gemini API**: https://ai.google.dev/gemini-api/docs
- **Tavus Integration**: https://docs.livekit.io/agents/integrations/avatar/tavus/
- **GitHub Examples**: https://github.com/livekit/agents/tree/main/examples

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Teste primeiro em modo `dev` antes do modo `start`
3. Confira os logs do console para erros específicos
4. Verifique a documentação do LiveKit para atualizações

## ✨ Próximos Passos

Após configurar o agent:

1. Configure o frontend LiveKit (Next.js)
2. Crie salas LiveKit com metadata `patient_id`
3. Conecte frontend → LiveKit Room → Agent
4. Teste a consulta ao vivo!
