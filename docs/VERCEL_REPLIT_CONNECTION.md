# Conexão Frontend (Vercel) com Backend (Replit)

## Arquitetura do Sistema

```
┌─────────────────────────┐     ┌────────────────────────┐     ┌─────────────────────────┐
│   Frontend (Vercel)     │────▶│   LiveKit Cloud        │◀────│   Backend (Replit)      │
│   appmediai.com         │     │   livekit.cloud        │     │   LiveKit Agent         │
│                         │     │                        │     │                         │
│   • Next.js App         │     │   • WebSocket Server   │     │   • Gemini AI           │
│   • API Routes          │     │   • Room Management    │     │   • Avatar (BEY/Tavus)  │
│   • Database Access     │     │   • Media Routing      │     │   • Vision Processing   │
└─────────────────────────┘     └────────────────────────┘     └─────────────────────────┘
          │                                                              │
          │                                                              │
          ▼                                                              ▼
┌─────────────────────────┐                                  ┌─────────────────────────┐
│   PostgreSQL (Neon)     │◀─────────────────────────────────│   Database Access       │
│   DATABASE_URL          │                                  │   via DATABASE_URL      │
└─────────────────────────┘                                  └─────────────────────────┘
```

## Variáveis de Ambiente Necessárias na Vercel

### 1. Banco de Dados (OBRIGATÓRIO)
```
DATABASE_URL=postgresql://...
```
- Mesmo valor usado no Replit
- Necessário para: autenticação, dados de usuários, consultas

### 2. LiveKit (OBRIGATÓRIO para consultas ao vivo)
```
LIVEKIT_URL=wss://mediai-livikit-gmavbnbs.livekit.cloud
LIVEKIT_API_KEY=APIrYvWHxL...
LIVEKIT_API_SECRET=...
```
- Usados pela API route `/api/livekit/token`
- Gera tokens para pacientes entrarem nas salas

### 3. Autenticação/Sessão (OBRIGATÓRIO)
```
JWT_SECRET=...
SESSION_SECRET=...
```
- Necessário para validar sessões de login
- Mesmo valor usado no Replit

### 4. Stripe (para pagamentos)
```
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_TRIAL_PRICE_ID=...
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=...
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=...
NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID=...
```

### 5. Gemini AI (para APIs de áudio/texto)
```
GEMINI_API_KEY=...
```
- Usado pelas API routes de speech-to-text e TTS

### 6. URLs Base
```
NEXT_PUBLIC_BASE_URL=https://www.appmediai.com
NEXT_PUBLIC_APP_URL=https://www.appmediai.com
```

### 7. Comunicação Agent-Frontend (OBRIGATÓRIO)
```
AGENT_SECRET=...
```
- Usado para autenticar chamadas entre o Agent (Replit) e APIs do frontend
- Deve ser o MESMO valor no Replit e na Vercel

### 8. Email (Resend)
```
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
```

### 9. Firebase (opcional, para storage)
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
```

### 10. Cloudinary (para upload de imagens)
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_URL=...
```

## Como a Conexão Funciona

### Fluxo de Consulta ao Vivo:

1. **Paciente acessa Vercel** → Login validado via JWT/SESSION
2. **Paciente inicia consulta** → Frontend chama `/api/livekit/token`
3. **API Route (Vercel)** → Gera token usando LIVEKIT_API_KEY/SECRET
4. **Frontend conecta ao LiveKit Cloud** → Usando o token gerado
5. **LiveKit Cloud notifica Agent (Replit)** → Novo participante na sala
6. **Agent inicia consulta** → Gemini AI + Avatar BEY
7. **Comunicação em tempo real** → Através do LiveKit Cloud

### Fluxo de Comunicação Agent ↔ APIs:

O Agent no Replit precisa chamar APIs do frontend para:
- Atualizar dados do paciente
- Agendar consultas
- Salvar métricas

Essas chamadas usam:
```
NEXT_PUBLIC_BASE_URL=https://www.appmediai.com
AGENT_SECRET=...  (para autenticação)
```

## Checklist de Configuração

### Na Vercel:

- [ ] Configurar DATABASE_URL (mesmo do Replit)
- [ ] Configurar LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
- [ ] Configurar JWT_SECRET, SESSION_SECRET (mesmo do Replit)
- [ ] Configurar GEMINI_API_KEY
- [ ] Configurar STRIPE_* variáveis
- [ ] Configurar AGENT_SECRET (mesmo do Replit)
- [ ] Configurar NEXT_PUBLIC_BASE_URL=https://www.appmediai.com
- [ ] Configurar RESEND_API_KEY, RESEND_FROM_EMAIL

### No Replit (Agent):

- [ ] Verificar LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
- [ ] Verificar DATABASE_URL (mesmo da Vercel)
- [ ] Configurar NEXT_PUBLIC_BASE_URL=https://www.appmediai.com
- [ ] Configurar AGENT_SECRET (mesmo da Vercel)
- [ ] Verificar BEY_API_KEY, BEY_AVATAR_ID
- [ ] Verificar GEMINI_API_KEY

## Problemas Comuns

### 1. "Serviço de consulta ao vivo temporariamente indisponível"
**Causa:** LIVEKIT_URL, LIVEKIT_API_KEY ou LIVEKIT_API_SECRET não configurados na Vercel
**Solução:** Adicionar essas variáveis no painel da Vercel

### 2. Erro de autenticação/sessão
**Causa:** JWT_SECRET ou SESSION_SECRET diferentes entre Vercel e Replit
**Solução:** Garantir que são iguais em ambos os ambientes

### 3. Agent não recebe jobs
**Causa:** Agent não está rodando ou não conectou ao LiveKit Cloud
**Solução:** Verificar logs do workflow "Avatar AI Agent" no Replit

### 4. Dados não salvos no banco
**Causa:** DATABASE_URL não configurado ou diferente
**Solução:** Usar exatamente a mesma DATABASE_URL em ambos

### 5. Chamadas do Agent falham
**Causa:** AGENT_SECRET diferente ou NEXT_PUBLIC_BASE_URL errado
**Solução:** Verificar que ambos estão corretos e iguais

## Verificando a Conexão

### No Replit:
```bash
# Verificar se Agent está conectado
# Nos logs deve aparecer:
# "registered worker" com URL do LiveKit
```

### Na Vercel:
```bash
# Verificar variáveis configuradas
# No painel Settings > Environment Variables
```

### Teste de ponta a ponta:
1. Fazer login como paciente
2. Iniciar consulta ao vivo
3. Verificar se o avatar aparece
4. Verificar logs no Replit
