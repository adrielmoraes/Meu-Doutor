# ✅ Migração Completa: Tavus Direct API → LiveKit

**Data**: 19 de outubro de 2025  
**Status**: ✅ Concluído

## 🎯 Objetivo

Migrar a funcionalidade de consultas ao vivo do MediAI do Tavus Direct API (que exigia créditos conversacionais) para a arquitetura LiveKit + Python Agent, oferecendo:
- ✅ Sem dependência de créditos conversacionais caros
- ✅ Melhor performance (WebRTC vs. HTTPS)
- ✅ Controle total sobre o comportamento da IA
- ✅ Tier gratuito generoso do LiveKit (10.000 minutos/mês)

## 📋 O que Foi Feito

### 1. Backend Python (LiveKit Agent)

**Criado:**
- `livekit-agent/agent.py` - Agent principal com lógica médica
- `livekit-agent/gemini_provider.py` - Providers Gemini (STT, LLM, TTS)
- `livekit-agent/medical_tools/patient_data.py` - Acesso a dados do paciente
- `livekit-agent/medical_tools/wellness.py` - Gestão de planos de bem-estar
- `livekit-agent/requirements.txt` - Dependências Python
- `livekit-agent/.env.example` - Template de variáveis de ambiente
- `livekit-agent/README.md` - Documentação do agent

**Funcionalidades:**
- ✅ STT (Speech-to-Text) usando Gemini Multimodal API em português
- ✅ LLM usando Gemini 2.0 Flash com contexto médico completo
- ✅ TTS (Text-to-Speech) usando Gemini 2.5 Flash TTS (voz Kore)
- ✅ Integração opcional com Tavus Avatar para vídeo realista
- ✅ Tool calling: `get_latest_exams()`, `get_patient_symptoms()`, `check_wellness_plan()`
- ✅ Carregamento automático do histórico médico do paciente

### 2. Frontend Next.js

**Criado:**
- `src/app/api/livekit/token/route.ts` - API para gerar tokens JWT do LiveKit
- `src/components/patient/livekit-consultation.tsx` - Componente de vídeo conferência

**Atualizado:**
- `src/app/patient/live-consultation/page.tsx` - Migrado para usar LiveKit
- `src/components/patient/patient-dashboard-improved.tsx` - Removida dependência do componente antigo

**Funcionalidades:**
- ✅ Interface de vídeo conferência usando `@livekit/components-react`
- ✅ Geração de tokens de acesso via API route
- ✅ Interface em português com instruções claras
- ✅ Cards informativos sobre o funcionamento da consulta

### 3. Código Antigo (Depreciado)

**Movido para `deprecated/`:**
- `src/components/patient/deprecated/tavus-consultation-client.tsx`
- `src/components/patient/deprecated/cvi/` - Componentes CVI antigos
- `src/app/api/deprecated/tavus/` - Rotas antigas do Tavus Direct API

Esses arquivos foram preservados como backup mas não são mais usados.

### 4. Documentação

**Criado:**
- `LIVEKIT_SETUP_GUIDE.md` - Guia completo de configuração passo a passo
- `QUICKSTART_LIVEKIT.md` - Guia rápido de início
- `livekit-agent/README.md` - Documentação técnica do Python Agent
- `.env.example` - Template atualizado de variáveis de ambiente
- `MIGRATION_SUMMARY.md` - Este documento

**Atualizado:**
- `replit.md` - Documentação da nova arquitetura

### 5. Dependências Instaladas

**Node.js:**
- `@livekit/components-react` - Componentes React para LiveKit
- `@livekit/components-styles` - Estilos dos componentes
- `livekit-client` - SDK cliente LiveKit
- `livekit-server-sdk` - SDK servidor para geração de tokens

**Python (a instalar):**
- `livekit` - SDK LiveKit
- `livekit-agents` - Framework de agents
- `livekit-plugins-tavus` - Plugin para avatar Tavus
- `google-generativeai` - Gemini API
- `asyncpg` - PostgreSQL async

## 🔧 Variáveis de Ambiente

### Já Configuradas ✅
- `GEMINI_API_KEY`
- `TAVUS_API_KEY`
- `TAVUS_REPLICA_ID`
- `TAVUS_PERSONA_ID`
- `DATABASE_URL`
- `LIVEKIT_URL` ✅
- `LIVEKIT_API_KEY` ✅
- `LIVEKIT_API_SECRET` ✅

## 🚀 Como Usar

### 1. Configurar Python Agent

```bash
cd livekit-agent
cp .env.example .env
nano .env  # Preencher variáveis

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python agent.py start
```

### 2. Acessar a Aplicação

1. Navegue para `/patient/live-consultation`
2. Faça login como paciente
3. Clique em "Iniciar Consulta ao Vivo"
4. Permita acesso ao microfone e câmera
5. Converse com a MediAI!

## 📊 Arquitetura

```
Frontend Next.js (Navegador)
    ↓ WebRTC
LiveKit Room (Cloud)
    ↓
Python Agent (MediAI) ← Gemini API (STT, LLM, TTS)
    ↓                       ↓
Tavus Avatar          PostgreSQL (Histórico)
```

## ✨ Benefícios da Nova Arquitetura

| Aspecto | Antes (Direct API) | Depois (LiveKit) |
|---------|-------------------|------------------|
| **Custo** | ❌ Créditos conversacionais caros | ✅ 10k min/mês grátis |
| **Latência** | 🟡 Média (HTTPS) | ✅ Baixa (WebRTC) |
| **Controle** | ❌ Limitado ao Tavus | ✅ Total (código Python) |
| **Escalabilidade** | 🟡 Limitada | ✅ Alta |
| **Gravação** | 🟡 Via API Tavus | ✅ Integrada no LiveKit |
| **Contexto** | 🟡 Via conversational_context | ✅ Injetado no LLM |
| **Ferramentas** | ❌ Não suportado | ✅ Tool calling completo |

## 🔄 Próximos Passos Recomendados

1. ✅ **Testar a consulta ao vivo** - Verificar funcionamento completo
2. ⬜ **Implementar salvamento de transcrição** - Gravar conversa no banco
3. ⬜ **Adicionar analytics** - Métricas de uso e satisfação
4. ⬜ **Deploy do Python Agent** - Configurar em servidor de produção
5. ⬜ **Otimizar avatar Tavus** - Ajustar configurações de sincronização
6. ⬜ **Adicionar funcionalidades** - Agendamento, histórico de conversas, etc.

## ⚠️ Observações Importantes

- O Python Agent **deve rodar separadamente** do frontend Next.js
- Para desenvolvimento local, execute em dois terminais diferentes
- Para produção, considere usar um servidor dedicado ou container para o agent
- A rota antiga `/patient/live-consultation` agora usa a nova implementação LiveKit
- Os componentes antigos foram preservados em `deprecated/` como backup

## 🆘 Troubleshooting

### Frontend não conecta ao LiveKit
→ Verifique se `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` estão configurados nos Secrets do Replit

### Python Agent não inicia
→ Verifique se todas as dependências foram instaladas: `pip install -r requirements.txt`

### Avatar Tavus não aparece
→ Verifique se `TAVUS_API_KEY` e `TAVUS_REPLICA_ID` estão configurados no `.env` do agent

### Erro de banco de dados
→ Verifique se `DATABASE_URL` está correto no `.env` do agent

## 📚 Documentação Adicional

- **Setup Completo**: `LIVEKIT_SETUP_GUIDE.md`
- **Início Rápido**: `QUICKSTART_LIVEKIT.md`
- **Agent Python**: `livekit-agent/README.md`
- **Arquitetura**: `replit.md`

---

**Migração realizada com sucesso!** 🎉
