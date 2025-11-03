# 📊 Guia de Configuração do Sentry - MediAI

## Visão Geral

O Sentry está totalmente integrado no MediAI para monitoramento de erros e performance em produção. Este guia mostra como configurar e ativar o Sentry.

## ✅ Já Implementado

- ✅ @sentry/nextjs instalado
- ✅ Configurações para client, server e edge runtimes
- ✅ ErrorBoundary component para capturar erros no React
- ✅ Helpers para captura manual: `captureException`, `captureMessage`, `addBreadcrumb`
- ✅ Filtros de privacidade automáticos (remove cookies, tokens, dados sensíveis)
- ✅ Desabilitado em desenvolvimento (a menos que DSN esteja configurado)

## 🚀 Como Ativar em Produção

### Passo 1: Criar Conta no Sentry

1. Acesse [sentry.io](https://sentry.io)
2. Crie uma conta gratuita
3. Crie um novo projeto do tipo "Next.js"

### Passo 2: Obter o DSN

Após criar o projeto, você receberá um **DSN** (Data Source Name) que se parece com:

```
https://abc123def456@o123456.ingest.sentry.io/789012
```

### Passo 3: Configurar no Replit

Adicione os seguintes secrets no Replit:

1. Clique em "Tools" → "Secrets"
2. Adicione os seguintes secrets:

```bash
# DSN para o servidor (obrigatório)
SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/789012

# DSN público para o cliente (obrigatório)
NEXT_PUBLIC_SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/789012

# Opcional: Configurar sample rate para produção
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Nota**: O DSN do servidor e do cliente geralmente são o mesmo.

### Passo 4: Reiniciar o Aplicativo

Após configurar os secrets, reinicie o workflow "Start Game" para que as mudanças tenham efeito.

## 📝 Como Usar no Código

### Capturar Exceções Automaticamente

O Sentry captura automaticamente:
- ✅ Erros não tratados no client
- ✅ Erros não tratados no server
- ✅ Erros capturados pelo ErrorBoundary
- ✅ Promise rejections

### Capturar Exceções Manualmente

```typescript
import { captureException } from '@/lib/sentry-helper';

try {
  // Código que pode falhar
  await processPayment(patientId);
} catch (error) {
  captureException(error, {
    tags: {
      feature: 'payment',
      severity: 'high'
    },
    extra: {
      patientId,
      amount: 100
    },
    user: {
      id: patientId,
      role: 'patient'
    }
  });
  throw error;
}
```

### Capturar Mensagens Customizadas

```typescript
import { captureMessage } from '@/lib/sentry-helper';

captureMessage('Limite de uso atingido', 'warning', {
  tags: {
    feature: 'usage-tracking'
  },
  extra: {
    patientId,
    limit: 100,
    current: 101
  }
});
```

### Adicionar Breadcrumbs (Rastros)

```typescript
import { addBreadcrumb } from '@/lib/sentry-helper';

addBreadcrumb('Iniciando análise de exame', 'ai-analysis', {
  examType: 'blood-test',
  patientId
});
```

### Wrapper para Funções Async

```typescript
import { withErrorTracking } from '@/lib/sentry-helper';

const analyzeExam = withErrorTracking(
  async (examData) => {
    // Lógica da análise
    return result;
  },
  {
    name: 'analyzeExam',
    tags: { feature: 'exam-analysis' }
  }
);
```

## 🔒 Privacidade e Segurança

O Sentry está configurado para **filtrar automaticamente**:

- ❌ Cookies (todos removidos)
- ❌ Headers de autenticação (`authorization`, `cookie`, `x-auth-token`)
- ❌ Informações do banco de dados
- ❌ JWT tokens
- ❌ Senhas e secrets

## 📊 Monitoramento de Performance

O Sentry também monitora performance:

- **Traces**: Rastreamento de requisições HTTP
- **Sample Rate**: 
  - Desenvolvimento: 100% (todos os traces)
  - Produção: 10% (configurable via `SENTRY_TRACES_SAMPLE_RATE`)

## 🎯 Ignorando Erros Comuns

Alguns erros são automaticamente ignorados:

- `ResizeObserver loop limit exceeded` (erro cosmético do browser)
- `NetworkError` e `Failed to fetch` (problemas de rede)
- `NEXT_REDIRECT` e `NEXT_NOT_FOUND` (redirecionamentos normais do Next.js)

## 🧪 Testar em Desenvolvimento

Para testar o Sentry em desenvolvimento:

1. Configure `NEXT_PUBLIC_SENTRY_DSN` nos secrets
2. O Sentry será ativado mesmo em dev mode
3. Teste forçando um erro:

```typescript
// Em qualquer página client component
throw new Error('Teste de Sentry!');
```

4. Verifique o erro no dashboard do Sentry

## 📈 Dashboards Recomendados

No Sentry, configure alertas para:

1. **Erros Críticos**: Alerta imediato para erros fatais
2. **High Error Rate**: Mais de 10 erros/min
3. **Performance Issues**: Requisições > 5s
4. **User Feedback**: Integrações com feedback de usuários

## 🔗 Links Úteis

- [Documentação Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Configurações Avançadas](https://docs.sentry.io/platforms/javascript/configuration/)
- [Filtrando Dados Sensíveis](https://docs.sentry.io/platforms/javascript/data-management/sensitive-data/)

## ✅ Checklist de Produção

Antes de ir para produção:

- [ ] DSN configurado nos secrets
- [ ] Testado em staging/preview
- [ ] Alertas configurados no Sentry
- [ ] Sample rate ajustado (recomendado: 10-20%)
- [ ] Time notificado sobre integração
- [ ] Dashboard do Sentry compartilhado com equipe

## 💡 Dicas

1. **Não abuse**: Use `captureMessage` apenas para eventos importantes
2. **Use tags**: Tags facilitam filtrar erros no dashboard
3. **Adicione contexto**: Quanto mais informação (sem dados sensíveis), melhor
4. **Monitore custos**: O plano gratuito tem limites de eventos/mês
5. **Configure releases**: Rastreie erros por versão do deploy

---

**Dúvidas?** Consulte a documentação oficial do Sentry ou o time de desenvolvimento.
