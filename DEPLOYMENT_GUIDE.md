# 🚀 Guia de Deployment - MediAI Platform

## ✅ Problema Resolvido

O deployment foi configurado corretamente para executar **ambos os serviços** necessários para a plataforma MediAI:

1. **Next.js Web Server** (porta 5000) - Interface principal da plataforma
2. **Python LiveKit Agent** - Sistema de consultas com avatar AI em tempo real

## 📋 Configuração Atual

### Tipo de Deployment: **Reserved VM**

A plataforma MediAI agora usa **Reserved VM** ao invés de Autoscale porque:

- ✅ Permite executar múltiplos serviços simultaneamente
- ✅ O LiveKit Agent precisa ficar sempre ativo aguardando consultas
- ✅ Mantém conexões WebRTC persistentes para as consultas com avatar
- ✅ Garante baixa latência para interações em tempo real

### Arquitetura de Deployment

```
┌─────────────────────────────────────────┐
│      Reserved VM (Replit)               │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Next.js Web Server             │  │
│  │   Porta: 5000                    │  │
│  │   - Interface do paciente        │  │
│  │   - Interface do médico          │  │
│  │   - Admin panel                  │  │
│  │   - APIs REST                    │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Python LiveKit Agent           │  │
│  │   - Consultas com avatar AI      │  │
│  │   - Gemini STT/LLM/TTS           │  │
│  │   - Tavus/BEY avatar             │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## 🔧 Arquivos de Configuração

### `.replit` (Configuração Principal)

```toml
[deployment]
deploymentTarget = "vm"
run = ["bash", "start-production.sh"]
build = ["npm", "run", "build"]
```

### `start-production.sh` (Script de Inicialização)

Script bash que:
- ✅ Inicia o Next.js na porta 5000
- ✅ Inicia o Python LiveKit Agent
- ✅ Monitora ambos os processos
- ✅ Reinicia automaticamente se algum processo falhar
- ✅ Gerencia graceful shutdown

## 📦 Como Fazer o Deploy

### 1. Verificar Dependências

Antes de fazer o deploy, certifique-se de que todos os secrets estão configurados:

```bash
# Secrets necessários:
- GEMINI_API_KEY
- LIVEKIT_API_KEY  
- LIVEKIT_API_SECRET
- LIVEKIT_URL
- DATABASE_URL
- JWT_SECRET
- STRIPE_SECRET_KEY (opcional)
- TAVUS_API_KEY (opcional)
```

### 2. Build Local (Opcional)

Teste o build localmente antes do deploy:

```bash
npm run build
```

### 3. Fazer Deploy

No Replit:

1. Clique no botão **"Deploy"** no painel lateral
2. Selecione **"Reserved VM"** como tipo de deployment
3. Clique em **"Deploy"**
4. Aguarde o build e a inicialização

### 4. Verificar Status

Após o deploy, verifique se ambos os serviços estão rodando:

- ✅ Acesse a URL do deployment para verificar o Next.js
- ✅ Verifique os logs para confirmar que o LiveKit Agent iniciou
- ✅ Teste uma consulta com avatar para validar a integração

## 🔍 Monitoramento

### Logs em Produção

Os logs mostrarão:

```
🚀 Iniciando MediAI Platform em Produção...
================================================
📦 Iniciando servidor Next.js na porta 5000...
✅ Next.js iniciado (PID: 1234)
🤖 Iniciando MediAI LiveKit Agent...
✅ LiveKit Agent iniciado (PID: 5678)
================================================
✅ MediAI Platform está rodando!
   • Next.js Web Server: http://0.0.0.0:5000
   • LiveKit Agent: Ativo e aguardando consultas
================================================
```

### Auto-Recovery

O script monitora continuamente ambos os serviços e reinicia automaticamente se detectar falha.

## 🎯 Diferenças entre Autoscale e VM

| Característica | Autoscale | Reserved VM (Atual) |
|----------------|-----------|---------------------|
| **Custo** | Paga por uso | Custo fixo mensal |
| **Escalabilidade** | Automática | Fixa |
| **Múltiplos Serviços** | ❌ Não | ✅ Sim |
| **Always-On** | ❌ Não | ✅ Sim |
| **WebRTC/WebSocket** | Limitado | ✅ Full support |
| **Ideal para** | Sites estáticos | Apps em tempo real |

## 🔄 Alternativas Consideradas

### Opção 1: Autoscale (Descartada)
- ❌ Só roda um serviço por vez
- ❌ Não suporta background workers
- ❌ Não ideal para WebRTC persistente

### Opção 2: Dois Deployments Separados (Não escolhida)
- ⚠️ Complexidade adicional
- ⚠️ Custo dobrado
- ⚠️ Necessita configuração de rede entre serviços

### Opção 3: Reserved VM (✅ Escolhida)
- ✅ Ambos os serviços em um único deployment
- ✅ Simplicidade de gerenciamento
- ✅ Melhor performance para tempo real
- ✅ Custo-benefício ideal para a aplicação

## 📝 Manutenção

### Atualizar o Deployment

1. Faça as alterações no código
2. Commit as mudanças
3. Clique em "Deploy" novamente
4. O Replit fará o rebuild e redeploy automaticamente

### Rollback

Se algo der errado, use o sistema de rollback do Replit:
1. Vá para a aba "Deployments"
2. Selecione uma versão anterior
3. Clique em "Rollback to this version"

## 🆘 Troubleshooting

### Deployment falha no build
- Verifique se `npm run build` funciona localmente
- Confirme que todas as dependências estão no package.json
- Veja os logs de build para identificar o erro

### Next.js não inicia
- Verifique se a porta 5000 está disponível
- Confirme que o comando `npm run start` funciona
- Veja os logs do script de produção

### LiveKit Agent não conecta
- Verifique se LIVEKIT_API_KEY e LIVEKIT_API_SECRET estão configurados
- Confirme que GEMINI_API_KEY está válida
- Teste a conexão com LiveKit Cloud

## 📚 Recursos Adicionais

- [Documentação Replit Deployments](https://docs.replit.com/hosting/deployments)
- [LiveKit Documentation](https://docs.livekit.io/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0  
**Plataforma**: Replit Reserved VM
