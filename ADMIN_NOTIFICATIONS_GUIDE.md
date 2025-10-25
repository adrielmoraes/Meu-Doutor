# Guia de Notificações do Administrador

## Visão Geral

O sistema de notificações do administrador permite que você seja notificado por email sobre eventos importantes na plataforma MediAI. Este sistema está integrado com o Resend e oferece rastreamento completo de todas as mudanças através de logs de auditoria.

## Funcionalidades Implementadas

### 1. **Persistência de Configurações**
- ✅ Tabela `admin_settings` criada no banco de dados
- ✅ Todas as configurações são salvas e carregadas automaticamente
- ✅ Interface de configuração com feedback em tempo real

### 2. **Integração de Email (Resend)**
- ✅ Integração Resend configurada e conectada
- ✅ Cliente Resend com autenticação automática
- ✅ Templates de email responsivos e modernos
- ✅ Suporte para múltiplos tipos de notificação

### 3. **Sistema de Auditoria**
- ✅ Tabela `audit_logs` para rastreamento de mudanças
- ✅ Registro automático de todas as alterações de configuração
- ✅ Rastreamento de IP e User Agent
- ✅ Logs detalhados com valores antigos e novos

## Como Usar

### Acessar as Configurações

1. Faça login como administrador em `/login`
   - Email: `admin@mediai.com`
   - Senha: `admin123`

2. Navegue até **Configurações** no menu lateral

3. Você verá 4 seções coloridas:
   - 🔒 **Segurança** (Cyan) - Alterar senha e informações de sessão
   - 💾 **Banco de Dados** (Purple) - Estatísticas e saúde do banco
   - 🔔 **Notificações** (Green) - Configurar alertas por email
   - ⚙️ **Geral** (Orange) - Configurações da plataforma

### Configurar Notificações

Na seção **Notificações**, você pode ativar/desativar:

- ✉️ **Novo Paciente**: Receber email quando um paciente se cadastrar
- 👨‍⚕️ **Novo Médico**: Receber email quando um médico se cadastrar
- 🔬 **Novo Exame**: Receber email quando um exame for enviado
- 💬 **Nova Consulta**: Receber email para cada consulta realizada
- ⚠️ **Alertas Críticos**: Erros do sistema e problemas críticos
- 📊 **Relatório Semanal**: Resumo semanal com estatísticas

Clique em **Salvar Configurações** para aplicar as mudanças.

### Configurações Gerais

Na seção **Geral**, você pode configurar:

- **Nome da Plataforma**: Nome exibido (padrão: "MediAI")
- **Descrição**: Descrição da plataforma
- **Email de Suporte**: Email para onde as notificações serão enviadas
- **Tamanho Máx. Arquivo**: Limite de upload em MB (padrão: 10MB)
- **Timeout Sessão**: Duração da sessão em dias (padrão: 7 dias)

## Como Enviar Notificações (Para Desenvolvedores)

### Importar o Serviço

```typescript
import { sendAdminNotification } from '@/lib/admin-notification-service';
```

### Exemplos de Uso

#### 1. Notificar Novo Paciente

```typescript
await sendAdminNotification({
  type: 'new_patient',
  subject: 'Novo Paciente Cadastrado - MediAI',
  data: {
    name: patient.name,
    email: patient.email,
    cpf: patient.cpf,
    age: patient.age,
    city: patient.city,
    state: patient.state,
  },
});
```

#### 2. Notificar Novo Médico

```typescript
await sendAdminNotification({
  type: 'new_doctor',
  subject: 'Novo Médico Cadastrado - MediAI',
  data: {
    name: doctor.name,
    email: doctor.email,
    crm: doctor.crm,
    specialty: doctor.specialty,
    city: doctor.city,
    state: doctor.state,
  },
});
```

#### 3. Notificar Novo Exame

```typescript
await sendAdminNotification({
  type: 'new_exam',
  subject: 'Novo Exame Enviado - MediAI',
  data: {
    type: exam.type,
    date: exam.date,
    status: exam.status,
    preliminaryDiagnosis: exam.preliminaryDiagnosis,
  },
});
```

#### 4. Alerta do Sistema

```typescript
await sendAdminNotification({
  type: 'system_alert',
  subject: 'Alerta do Sistema - MediAI',
  data: {
    message: 'Database connection error',
    severity: 'Alta',
  },
});
```

#### 5. Relatório Semanal

```typescript
await sendAdminNotification({
  type: 'weekly_report',
  subject: 'Relatório Semanal - MediAI',
  data: {
    newPatients: 45,
    newDoctors: 3,
    examsAnalyzed: 127,
    consultations: 89,
  },
});
```

## Logs de Auditoria

Todas as mudanças de configuração são automaticamente registradas na tabela `audit_logs` com:

- **Administrador**: Quem fez a mudança
- **Ação**: Tipo de mudança (ex: `update_notification_settings`)
- **Entidade**: Tipo de registro afetado
- **Mudanças**: Lista de campos alterados com valores antigos e novos
- **IP Address**: Endereço IP de onde a mudança foi feita
- **User Agent**: Navegador/dispositivo usado
- **Timestamp**: Data e hora da mudança

### Consultar Logs de Auditoria

```typescript
import { getAuditLogs, getAuditLogsByAdmin, getAuditLogsByAction } from '@/lib/db-adapter';

// Últimos 50 logs
const logs = await getAuditLogs(50);

// Logs de um admin específico
const adminLogs = await getAuditLogsByAdmin(adminId, 50);

// Logs de uma ação específica
const passwordChanges = await getAuditLogsByAction('change_password', 50);
```

## Estrutura do Banco de Dados

### Tabela `admin_settings`

```sql
CREATE TABLE admin_settings (
  id TEXT PRIMARY KEY,
  platform_name TEXT NOT NULL DEFAULT 'MediAI',
  platform_description TEXT NOT NULL DEFAULT 'Plataforma de saúde com IA',
  support_email TEXT NOT NULL DEFAULT 'suporte@mediai.com',
  max_file_size INTEGER NOT NULL DEFAULT 10,
  session_timeout INTEGER NOT NULL DEFAULT 7,
  notify_new_patient BOOLEAN NOT NULL DEFAULT true,
  notify_new_doctor BOOLEAN NOT NULL DEFAULT true,
  notify_new_exam BOOLEAN NOT NULL DEFAULT true,
  notify_new_consultation BOOLEAN NOT NULL DEFAULT false,
  notify_system_alerts BOOLEAN NOT NULL DEFAULT true,
  notify_weekly_report BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela `audit_logs`

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT REFERENCES admins(id) ON DELETE CASCADE,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Fluxo de Trabalho Completo

1. **Usuário acessa configurações** → Dados carregados do banco via `getSettings()`
2. **Usuário modifica configurações** → Estado local atualizado
3. **Usuário clica em Salvar** → Chamada para `updateGeneralSettings()` ou `updateNotificationSettings()`
4. **Server Action valida** → Compara valores antigos com novos
5. **Banco é atualizado** → `updateAdminSettings()` persiste as mudanças
6. **Auditoria é criada** → `createAuditLog()` registra a mudança com detalhes
7. **Resposta enviada** → Componente exibe mensagem de sucesso/erro

## Segurança

- ✅ Apenas administradores autenticados podem alterar configurações
- ✅ Senhas são hasheadas com bcrypt antes de serem salvas
- ✅ Logs de auditoria registram IP e User Agent
- ✅ Tokens de sessão JWT com expiração de 7 dias (configurável)
- ✅ Headers HTTP capturados para rastreamento de origem

## Próximos Passos Sugeridos

1. **Implementar Visualizador de Logs de Auditoria**
   - Criar página `/admin/audit-logs`
   - Filtros por data, admin, ação
   - Exportação para CSV

2. **Automatizar Relatório Semanal**
   - Cron job para enviar emails semanais
   - Dashboard com métricas da semana

3. **Notificações em Tempo Real**
   - Toast notifications no painel admin
   - WebSocket para updates ao vivo

4. **Backup de Configurações**
   - Exportar/importar configurações
   - Versionamento de configurações

## Troubleshooting

### Emails não estão sendo enviados

1. Verifique se a integração Resend está configurada
2. Confirme que o `from_email` está verificado no Resend
3. Verifique os logs do servidor para erros
4. Confirme que as notificações estão ativadas nas configurações

### Configurações não são salvas

1. Verifique se você está logado como administrador
2. Confira os logs do navegador para erros
3. Verifique se o banco de dados está acessível
4. Execute `npm run db:push` se houver problemas de schema

### Logs de auditoria não aparecem

1. Confirme que a tabela `audit_logs` existe
2. Verifique se `createAuditLog()` está sendo chamado
3. Confira os logs do servidor para erros de inserção

## Contato e Suporte

Para questões sobre o sistema de notificações, entre em contato com a equipe de desenvolvimento ou consulte a documentação técnica completa.
