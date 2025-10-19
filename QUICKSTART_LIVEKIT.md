# ⚡ Quick Start: LiveKit + Tavus Integration

## 🎯 O que foi implementado?

Uma nova arquitetura de **consultas ao vivo em tempo real** usando:
- ✅ **LiveKit** - WebRTC para vídeo/áudio de baixa latência
- ✅ **Python Agent** - Servidor que controla a IA médica
- ✅ **Gemini API** - STT, LLM e TTS totalmente em Gemini
- ✅ **Tavus Avatar** - Avatar visual realista que sincroniza com a fala
- ✅ **Frontend React** - Interface de vídeo conferência com LiveKit Components

## 📁 Estrutura de Arquivos Criados

```
├── livekit-agent/               # Servidor Python (NOVO)
│   ├── agent.py                 # Agent principal
│   ├── gemini_provider.py       # Providers Gemini (STT, LLM, TTS)
│   ├── requirements.txt         # Dependências Python
│   ├── .env.example             # Template de variáveis
│   ├── .gitignore              # Ignorar arquivos sensíveis
│   ├── README.md               # Documentação do agent
│   └── medical_tools/          # Ferramentas médicas
│       ├── __init__.py
│       ├── patient_data.py     # Acesso a dados do paciente
│       └── wellness.py         # Planos de bem-estar
│
├── src/
│   ├── app/
│   │   ├── api/livekit/token/  # API para gerar tokens LiveKit (NOVO)
│   │   │   └── route.ts
│   │   └── patient/
│   │       └── live-consultation-new/  # Página de teste (NOVO)
│   │           └── page.tsx
│   └── components/patient/
│       └── livekit-consultation.tsx  # Componente de vídeo (NOVO)
│
├── LIVEKIT_SETUP_GUIDE.md      # 📖 Guia completo de configuração (NOVO)
├── QUICKSTART_LIVEKIT.md       # ⚡ Este arquivo
├── .env.example                # Template de variáveis (ATUALIZADO)
└── replit.md                   # Documentação atualizada
```

## 🚀 Próximos Passos (Para Você)

### 1️⃣ Configurar Credenciais LiveKit

Você precisa criar uma conta no LiveKit Cloud e obter as credenciais:

1. Acesse: **https://cloud.livekit.io**
2. Crie uma conta gratuita (10.000 minutos/mês)
3. Crie um projeto
4. Copie as credenciais:
   - `LIVEKIT_URL` (ex: `wss://seu-projeto.livekit.cloud`)
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`

### 2️⃣ Adicionar Secrets no Replit

No painel de Secrets do Replit, adicione:

```
LIVEKIT_URL=wss://seu-projeto.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxx
LIVEKIT_API_SECRET=secretxxxxxxxxxxxxxxxxxx
```

*(As outras credenciais - GEMINI_API_KEY, TAVUS_*, DATABASE_URL - já estão configuradas)*

### 3️⃣ Configurar o Python Agent

```bash
cd livekit-agent
cp .env.example .env
nano .env  # Preencha as variáveis
```

Depois instale as dependências:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4️⃣ Executar o Agent

Em um terminal separado:

```bash
cd livekit-agent
source venv/bin/activate
python agent.py start
```

O agent ficará rodando e aguardando conexões.

### 5️⃣ Testar a Integração

1. Acesse: `/patient/live-consultation-new`
2. Faça login como paciente
3. Clique em "Iniciar Consulta ao Vivo"
4. Permita acesso ao microfone/câmera
5. Converse com a MediAI!

## 📚 Documentação Completa

Para instruções detalhadas, troubleshooting e arquitetura:

👉 **Leia o [LIVEKIT_SETUP_GUIDE.md](./LIVEKIT_SETUP_GUIDE.md)**

## 🔧 Arquitetura Simplificada

```
Navegador (Paciente)
    ↓
    WebRTC (LiveKit Room)
    ↓
Python Agent ← Gemini API (STT, LLM, TTS)
    ↓
Tavus Avatar (Vídeo realista)
    ↓
Banco de Dados (Histórico médico)
```

## ✨ Vantagens desta Arquitetura

✅ **Baixa latência** - WebRTC é mais rápido que HTTP  
✅ **Escalável** - LiveKit gerencia múltiplas salas simultaneamente  
✅ **Modular** - Fácil adicionar novos recursos ao agent  
✅ **Controle total** - Você decide como a IA se comporta  
✅ **Gravação integrada** - LiveKit grava e transcreve automaticamente  
✅ **Gemini puro** - Toda a IA usa Gemini (STT, LLM, TTS)  

## ⚠️ Importante

- O **frontend** já está pronto e rodando no Replit
- O **Python Agent precisa ser executado separadamente** (em outro terminal ou servidor)
- As **dependências LiveKit** já foram instaladas no Node.js
- A **rota antiga** (`/patient/live-consultation`) ainda usa Direct API (não migrada ainda)

## 🆘 Suporte

Se algo não funcionar:

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Confirme que o Python Agent está rodando
3. Veja os logs do agent (`python agent.py start`)
4. Consulte o `LIVEKIT_SETUP_GUIDE.md` para troubleshooting detalhado

---

**Data**: 19 de outubro de 2025  
**Status**: ✅ Implementação completa, aguardando configuração de credenciais LiveKit
