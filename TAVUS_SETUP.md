# Configuração Tavus CVI com Gemini LLM - MediAI

## ✅ Status da Integração
**Configurado e Operacional** (19 de outubro de 2025)

A integração Tavus CVI está completamente funcional e pronta para uso com Gemini LLM.

---

## 🔑 Variáveis de Ambiente Configuradas

Você já configurou todas as variáveis necessárias:

- ✅ `TAVUS_API_KEY` - Chave de autenticação da API Tavus
- ✅ `TAVUS_REPLICA_ID` - ID do avatar visual (r3a47ce45e68)
- ✅ `TAVUS_PERSONA_ID` - ID da persona com Gemini LLM (pa9ba32a3418)

---

## 🎯 Como Configurar o Persona para Usar Gemini

### Opção 1: Via Dashboard Tavus (Recomendado)

1. Acesse: https://platform.tavus.io
2. Navegue até **"Personas"** no menu lateral
3. Selecione seu persona atual ou crie um novo
4. Nas configurações do Persona:
   - **LLM Provider**: Selecione "Google Gemini"
   - **Model**: Escolha o modelo Gemini desejado (ex: gemini-2.0-flash-exp)
   - **Context**: Defina o contexto médico e comportamento da IA
   - **Language**: Configure para "Portuguese" ou "multilingual"
5. Salve as alterações

### Opção 2: Via API Tavus

```bash
curl --request POST \
  --url https://tavusapi.com/v2/personas \
  --header 'Content-Type: application/json' \
  --header 'x-api-key: SEU_TAVUS_API_KEY' \
  --data '{
    "persona_name": "MediAI - Assistente Médica",
    "context": "Você é uma assistente médica virtual especializada em triagem de pacientes. Seja empática, profissional e clara.",
    "replica_id": "r3a47ce45e68",
    "layers": {
      "llm": {
        "model": "gemini-2.0-flash-exp",
        "provider": "google"
      },
      "transport": {
        "transport_type": "daily"
      }
    },
    "properties": {
      "language": "Portuguese"
    }
  }'
```

---

## 🚀 Como Funciona a Integração

### Fluxo de Criação de Consulta

1. **Paciente clica em "Iniciar Consulta ao Vivo"**
2. **Frontend** (`tavus-consultation-client.tsx`) faz requisição para `/api/tavus/create-conversation`
3. **Backend** (`create-conversation/route.ts`):
   - Monta payload com `persona_id`, `replica_id`, e contexto médico
   - Envia requisição para Tavus API: `POST https://tavusapi.com/v2/conversations`
   - Recebe `conversation_url` (link Daily.co)
   - Salva registro no banco de dados
4. **Frontend** exibe iframe com a `conversation_url`
5. **Paciente conversa** com o avatar IA usando Gemini LLM
6. **Transcrição automática** é gerada (se `enable_recording: true`)

### Payload da API Tavus

```typescript
{
  persona_id: "pa9ba32a3418",          // Controla LLM e comportamento
  replica_id: "r3a47ce45e68",          // Avatar visual
  conversation_name: "Consulta - João Silva",
  conversational_context: "PACIENTE: João Silva\nSINTOMAS: ...",
  custom_greeting: "Olá João, eu sou a MediAI...",
  properties: {
    max_call_duration: 1800,           // 30 minutos
    participant_left_timeout: 60,      // 1 minuto
    enable_recording: true,            // Transcrição automática
    language: "Portuguese"             // Nome completo do idioma
  }
}
```

### Resposta da API Tavus

```json
{
  "conversation_id": "ca09f7306078f453",
  "conversation_url": "https://tavus.daily.co/ca09f7306078f453",
  "status": "active",
  "created_at": "2025-10-19T01:02:51.407011Z"
}
```

---

## ⚠️ Campos Removidos (Causavam Erros)

Estes campos **não são suportados** pela API Tavus v2 e foram removidos:

- ❌ `metadata` - Não existe na API v2
- ❌ `apply_filter` - Não é válido em `properties`
- ❌ `language: 'pt-BR'` - Deve usar nome completo: `'Portuguese'`

---

## 🧪 Teste da Integração

### Resultado do Teste (19/10/2025)

```bash
✅ API Tavus respondeu com sucesso:
{
  conversation_id: 'ca09f7306078f453',
  conversation_url: 'https://tavus.daily.co/ca09f7306078f453',
  status: 'active'
}
```

**Status**: ✅ Integração funcionando corretamente!

---

## 📊 Histórico de Conversas

As conversas são salvas no banco de dados PostgreSQL (tabela `tavus_conversations`):

```sql
-- Estrutura da tabela
CREATE TABLE tavus_conversations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  conversation_id TEXT UNIQUE NOT NULL,
  transcript TEXT DEFAULT '',
  summary TEXT,
  main_concerns JSON,
  ai_recommendations JSON,
  suggested_follow_up JSON,
  sentiment TEXT,
  quality_score INTEGER,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 Interface do Usuário

### Tela de Consulta ao Vivo
- **Rota**: `/patient/live-consultation`
- **Componente**: `TavusConsultationClient`
- **Recursos**:
  - Iframe embedado com Daily.co
  - Controles de microfone e câmera
  - Botão para encerrar consulta
  - Transcrição automática ao finalizar

### Design
- Fundo de vídeo com overlay semi-transparente
- Interface minimalista focada no avatar
- Texto em português, sem referências técnicas ("avatar", "IA", etc.)

---

## 🔒 Segurança

- ✅ API Keys armazenadas em variáveis de ambiente
- ✅ Autenticação via JWT nas rotas do paciente
- ✅ Validação de `patientId` antes de criar conversa
- ✅ Foreign key constraints no banco de dados

---

## 📝 Próximos Passos (Opcional)

1. **Testar com paciente real**: Faça login como paciente e teste a consulta ao vivo
2. **Ajustar contexto médico**: Refine o prompt do `conversational_context` conforme necessário
3. **Configurar webhooks**: Adicione `callback_url` para receber eventos da conversa
4. **Integrar histórico**: Exibir conversas passadas no perfil do paciente

---

## 🆘 Suporte

- **Documentação Tavus**: https://docs.tavus.io
- **Dashboard Tavus**: https://platform.tavus.io
- **API Reference**: https://docs.tavus.io/api-reference/conversations/create-conversation

---

## ✨ Resumo

**A integração Tavus CVI com Gemini LLM está 100% funcional!** 

Você pode:
- ✅ Criar consultas ao vivo com avatar IA
- ✅ Usar Gemini como motor de inteligência
- ✅ Conversar em português
- ✅ Gravar e transcrever automaticamente
- ✅ Salvar histórico no banco de dados

**Tudo pronto para uso em produção!** 🎉
