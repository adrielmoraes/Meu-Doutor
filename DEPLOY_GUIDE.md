# 🚀 Guia Completo de Deploy - MediAI

## 📋 Visão Geral da Arquitetura

Este projeto tem 2 componentes que devem ser deployados separadamente:

1. **Frontend Next.js** → Deploy na **Vercel**
2. **Backend Python LiveKit Agent** → Deploy no **Replit** (ou LiveKit Cloud/Railway/Render)

## 🎯 PARTE 1: Deploy do Frontend na Vercel

### Passo 1: Preparar o Repositório

1. Certifique-se de que seu código está no GitHub/GitLab/Bitbucket
2. O arquivo `vercel.json` já está configurado na raiz do projeto

### Passo 2: Conectar com a Vercel

#### Opção A: Via Interface Web (Mais Fácil)

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Add New Project"**
4. Selecione o repositório `MediAI`
5. Configure conforme a captura de tela que você enviou:

**Build Settings:**
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (ou deixe em branco para usar o padrão)
- **Output Directory:** `.next` (deixe em branco)
- **Install Command:** `npm install` (ou deixe em branco)
- **Development Command:** `next` (deixe em branco)

#### Opção B: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy (modo interativo)
vercel

# Deploy em produção
vercel --prod
```

### Passo 3: Configurar Variáveis de Ambiente

Na Vercel Dashboard > Settings > Environment Variables, adicione:

```env
# Banco de Dados
DATABASE_URL=postgresql://neondb_owner:...@ep-cool-sunset-ac6pwhwc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Google Gemini AI
GEMINI_API_KEY=AIza...

# LiveKit (para gerar tokens)
LIVEKIT_API_KEY=APIrY...
LIVEKIT_API_SECRET=seu_secret
LIVEKIT_URL=wss://mediai-livikit-gmavbnbs.livekit.cloud

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Auth
JWT_SECRET=seu_jwt_secret_super_secreto
NEXTAUTH_SECRET=seu_nextauth_secret

# Outros
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

**⚠️ IMPORTANTE:** 
- Variáveis com `NEXT_PUBLIC_` são expostas no navegador
- Variáveis sem prefixo ficam apenas no servidor

### Passo 4: Deploy

Após conectar o repositório:
1. A Vercel fará o primeiro deploy automaticamente
2. Cada `git push` dispara um novo deploy
3. Branches criam preview deployments

---

## 🐍 PARTE 2: Deploy do Backend Python (LiveKit Agent)

### Opção 1: Manter no Replit (RECOMENDADO para você)

**Vantagens:**
- ✅ Já está configurado
- ✅ Roda 24/7 automaticamente
- ✅ Fácil de gerenciar
- ✅ Logs em tempo real

**Configuração:**

1. **Certifique-se de que o workflow está ativo:**
   - Workflow "MediAI Avatar Agent" deve estar rodando
   - Porta não importa (LiveKit Cloud gerencia a comunicação)

2. **Variáveis de ambiente no Replit:**
   ```env
   LIVEKIT_API_KEY=APIrY...
   LIVEKIT_API_SECRET=seu_secret
   LIVEKIT_URL=wss://mediai-livikit-gmavbnbs.livekit.cloud
   GEMINI_API_KEY=AIza...
   DATABASE_URL=postgresql://...
   TAVUS_API_KEY=seu_tavus_key
   BEY_API_KEY=seu_bey_key
   ```

3. **Manter o agente rodando:**
   - O Replit já tem o workflow configurado
   - Certifique-se de que está em "Always On" (plano pago) ou use [UptimeRobot](https://uptimerobot.com) para fazer ping

### Opção 2: Deploy no LiveKit Cloud

```bash
# Instalar LiveKit CLI
curl -sSL https://get.livekit.io | bash

# Fazer login
lk cloud auth

# Deploy do agente
cd livekit-agent
lk cloud deploy
```

### Opção 3: Deploy no Railway/Render/Fly.io

Posso criar um `Dockerfile` se você preferir essa opção.

---

## 🔗 PARTE 3: Conectar Frontend e Backend

**A mágica:** Eles se comunicam via **LiveKit Cloud**, não precisam estar no mesmo servidor!

### Como Funciona:

```
Usuário → Frontend (Vercel) → Solicita token
Frontend → LiveKit Cloud → Cria sala
LiveKit Cloud → Backend (Replit) → Chama agente Python
Agente Python → LiveKit Cloud → Conecta na sala
LiveKit Cloud → Frontend → Transmite áudio/vídeo
```

### Configuração no Frontend:

No seu código Next.js (já está implementado):

```typescript
// app/patient/live-consultation/page.tsx
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://mediai-livikit-gmavbnbs.livekit.cloud';

// Gera token via API route
const response = await fetch('/api/livekit-token', {
  method: 'POST',
  body: JSON.stringify({ roomName, participantName })
});
```

**Não é necessário** saber onde o agente Python está rodando! O LiveKit Cloud gerencia tudo.

---

## ✅ CHECKLIST DE DEPLOY

### Frontend (Vercel):
- [ ] Código no GitHub
- [ ] Conectado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Build passou sem erros
- [ ] Site acessível

### Backend (Replit):
- [ ] Workflow "MediAI Avatar Agent" rodando
- [ ] Variáveis de ambiente configuradas
- [ ] Logs mostram "registered worker"
- [ ] Sem erros de conexão

### Testes:
- [ ] Acessar frontend na Vercel
- [ ] Login funciona
- [ ] Iniciar consulta ao vivo
- [ ] Avatar aparece e responde

---

## 🐛 TROUBLESHOOTING

### Erro: "Agent não conecta"
- Verifique se o workflow Python está rodando
- Confirme LIVEKIT_API_KEY e SECRET no Replit
- Veja logs em `/tmp/logs/MediAI_Avatar_Agent_*.log`

### Erro: "Build falhou na Vercel"
- Verifique os 71 erros de TypeScript
- Considere manter `ignoreBuildErrors: true` temporariamente

### Erro: "Database connection failed"
- Confirme DATABASE_URL nas variáveis da Vercel
- Certifique-se de que o IP da Vercel está permitido no Neon

---

## 📊 MONITORAMENTO

### Vercel:
- Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- Logs: Vercel Dashboard > Deployments > View Function Logs
- Analytics: Vercel Dashboard > Analytics

### Replit:
- Logs: Ferramenta de logs do Replit
- Status: Verificar se workflow está "Running"

---

## 💰 CUSTOS ESTIMADOS

- **Vercel:** Grátis até 100GB de bandwidth (depois ~$20/mês)
- **Replit:** ~$20/mês (Always On)
- **LiveKit Cloud:** Grátis até 50 participantes simultâneos
- **Neon PostgreSQL:** Grátis até 10GB

**Total estimado:** $40-60/mês para começar

---

## 🎓 PRÓXIMOS PASSOS

1. Faça deploy do frontend na Vercel primeiro
2. Mantenha o backend no Replit rodando
3. Teste a integração completa
4. Configure domínio customizado (opcional)
5. Configure monitoramento (Sentry já configurado)

---

## 📞 SUPORTE

Se tiver problemas:
1. Verifique os logs (Vercel + Replit)
2. Confira variáveis de ambiente
3. Teste conexão LiveKit separadamente
4. Revise este guia

**Boa sorte com o deploy! 🚀**
