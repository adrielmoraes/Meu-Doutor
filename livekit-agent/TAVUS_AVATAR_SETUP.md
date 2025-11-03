# 🎭 Configuração do Avatar Tavus no LiveKit

## ✅ Status: Totalmente Implementado

O avatar Tavus está **completamente integrado** no Python Agent LiveKit. Quando você executar o agent com as credenciais corretas, o avatar aparecerá automaticamente na sala LiveKit.

## 🎯 Como Funciona

### Arquitetura

```
┌──────────────────────────────────────────┐
│          LiveKit Room                    │
│                                          │
│  👤 Participante 1: Paciente (você)      │
│  🤖 Participante 2: Avatar Tavus         │
│                                          │
└──────────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │   Python Agent      │
    ├─────────────────────┤
    │ • Gemini STT        │ ← Escuta o paciente
    │ • Gemini LLM        │ ← Pensa e responde
    │ • Gemini TTS        │ ← Gera áudio
    │ • Tavus Avatar      │ ← Sincroniza lábios
    └─────────────────────┘
```

### Fluxo de Conversação

1. **Paciente fala** → Gemini STT transcreve
2. **LLM processa** → Gemini LLM gera resposta (com contexto médico)
3. **TTS sintetiza** → Gemini TTS cria áudio em português
4. **Avatar sincroniza** → Tavus move os lábios com o áudio
5. **Vídeo transmitido** → Paciente vê e ouve o avatar

## 🔧 Configuração

### 1. Criar arquivo `.env`

```bash
cd livekit-agent
cp .env.example .env
```

### 2. Preencher variáveis (já configuradas no Replit)

Edite o arquivo `.env`:

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://seu-projeto.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxx
LIVEKIT_API_SECRET=secretxxxxxxxxxxxxxxxxxx

# Gemini API
GEMINI_API_KEY=sua_gemini_key

# Tavus Avatar (IMPORTANTE!)
TAVUS_API_KEY=sua_tavus_key
TAVUS_REPLICA_ID=r3a47ce45e68  # Seu replica ID
TAVUS_PERSONA_ID=pa9ba32a3418  # Seu persona ID (opcional)

# Database
DATABASE_URL=sua_database_url
```

### 3. Instalar dependências

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Executar o agent

```bash
python agent.py start
```

### Logs Esperados (com avatar)

```
[MediAI] Starting agent for patient: abc123
[MediAI] Loading context for patient: abc123
[MediAI] Patient context loaded (2456 chars)
[MediAI] Initializing Tavus avatar...     ← Avatar detectado!
[MediAI] Tavus avatar initialized         ← Avatar ativo!
[MediAI] Starting voice session...
[MediAI] Agent session started successfully
```

### Logs Sem Avatar (credenciais ausentes)

```
[WARN] Tavus credentials not found, running without avatar
```

## 🎬 O que o Paciente Vê

### Com Avatar Tavus ✅

```
┌─────────────────────────────────┐
│  🎥 LiveKit Video Conference    │
├─────────────────────────────────┤
│                                 │
│  ┌───────────┐  ┌───────────┐  │
│  │           │  │    🤖     │  │
│  │  Você     │  │  MediAI   │  │
│  │  (câmera) │  │  Avatar   │  │
│  └───────────┘  └───────────┘  │
│                                 │
│  🎤 Fale normalmente            │
│  Avatar responde com lábios     │
│  sincronizados!                 │
│                                 │
└─────────────────────────────────┘
```

### Sem Avatar (somente áudio) 🔊

```
┌─────────────────────────────────┐
│  🎥 LiveKit Video Conference    │
├─────────────────────────────────┤
│                                 │
│  ┌───────────┐                  │
│  │           │                  │
│  │  Você     │    🔊 Áudio      │
│  │  (câmera) │    MediAI        │
│  └───────────┘                  │
│                                 │
│  🎤 Fale normalmente            │
│  Resposta por áudio apenas      │
│                                 │
└─────────────────────────────────┘
```

## 🔍 Verificando se o Avatar Está Ativo

### No Frontend (Console do Navegador)

```javascript
// Você verá 2 participantes na sala:
[LiveKit] Participante adicionado: Seu Nome
[LiveKit] Participante adicionado: MediAI Assistant  ← Avatar!
```

### No Python Agent (Terminal)

```
[MediAI] Tavus avatar initialized  ← Se ver isso, avatar está ativo!
```

### Visualmente

- ✅ **Com avatar**: Você vê um vídeo realista da MediAI com lábios sincronizados
- ❌ **Sem avatar**: Você só ouve o áudio, sem vídeo do assistente

## ⚙️ Configurações do Avatar

### No código (`agent.py` linhas 201-206):

```python
avatar = tavus.AvatarSession(
    api_key=tavus_api_key,           # Sua API key Tavus
    replica_id=replica_id,            # ID do avatar (Phoenix-3, etc.)
    persona_id=persona_id,            # Comportamento (opcional)
    avatar_participant_name="MediAI Assistant"  # Nome na sala
)
```

### Personalizar Nome do Avatar

Para mudar o nome que aparece no vídeo, edite a linha 205:

```python
avatar_participant_name="Dra. MediAI"  # Ou outro nome
```

## 🎨 Avatares Disponíveis (Tavus)

Você pode trocar o `TAVUS_REPLICA_ID` para usar diferentes avatares:

- **Phoenix-3**: Avatar feminino profissional (recomendado para medicina)
- **PRO Replicas**: Avatares premium personalizados
- **Seu Próprio Avatar**: Se você criou um replica customizado

Consulte seu dashboard Tavus para ver os replica IDs disponíveis.

## 🐛 Troubleshooting

### Avatar não aparece

**Causa**: Credenciais Tavus ausentes ou incorretas

**Solução**:
1. Verifique se `TAVUS_API_KEY` e `TAVUS_REPLICA_ID` estão no `.env`
2. Confirme que as credenciais são válidas
3. Reinicie o Python Agent

### Erro: "Tavus credentials not found"

**Causa**: Arquivo `.env` não configurado ou variáveis erradas

**Solução**:
```bash
cd livekit-agent
nano .env  # Adicione TAVUS_API_KEY e TAVUS_REPLICA_ID
```

### Avatar aparece mas não sincroniza lábios

**Causa**: Problema com a integração TTS → Avatar

**Solução**:
1. Verifique logs do agent para erros
2. Confirme que `audio_enabled=False` está na linha 228 do `agent.py`
3. Isso permite que o avatar controle o áudio

### Vídeo do avatar está travado

**Causa**: Problema de rede ou sobrecarga

**Solução**:
1. Verifique sua conexão com LiveKit
2. Reduza qualidade de vídeo se necessário
3. Considere usar servidor com melhor rede

## 💡 Dicas Avançadas

### 1. Avatar Sem Persona

Se não quiser usar persona, remova da inicialização:

```python
avatar = tavus.AvatarSession(
    api_key=tavus_api_key,
    replica_id=replica_id,
    # persona_id=persona_id,  # Comentado
    avatar_participant_name="MediAI Assistant"
)
```

### 2. Múltiplos Avatares

Para ter avatares diferentes para especialidades:

```python
# Cardiologista
avatar_cardio = tavus.AvatarSession(
    replica_id="replica_id_cardiologista",
    avatar_participant_name="Dr. Cardio"
)

# Nutricionista
avatar_nutri = tavus.AvatarSession(
    replica_id="replica_id_nutricionista",
    avatar_participant_name="Dra. Nutri"
)
```

### 3. Desativar Avatar Temporariamente

Para testar sem avatar (somente áudio):

Renomeie as variáveis no `.env`:
```bash
# TAVUS_API_KEY=...  # Comentado
# TAVUS_REPLICA_ID=... # Comentado
```

O agent rodará normalmente, mas sem vídeo do avatar.

## 📊 Monitoramento

### Dashboard LiveKit

Acesse https://cloud.livekit.io para ver:
- Participantes na sala (paciente + avatar)
- Uso de banda
- Qualidade de vídeo/áudio

### Dashboard Tavus

Acesse https://platform.tavus.io para ver:
- Minutos de avatar usados
- Qualidade de sincronização
- Logs de sessões

## ✨ Próximos Passos

1. ✅ Configurar `.env` com credenciais Tavus
2. ✅ Executar `python agent.py start`
3. ✅ Testar consulta ao vivo no frontend
4. ✅ Verificar se avatar aparece no vídeo
5. ⬜ Personalizar comportamento do avatar
6. ⬜ Ajustar qualidade de vídeo conforme necessário

---

**O avatar Tavus está pronto para uso!** 🎭🚀
