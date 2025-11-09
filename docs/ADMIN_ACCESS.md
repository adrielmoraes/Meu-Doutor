# 🔐 Acesso Administrativo - MediAI

## Credenciais de Acesso

### Usuário Admin Padrão
```
📧 Email:    admin@mediai.com
🔑 Senha:    admin123
🌐 URL:      /login
```

## Como Acessar

### Passo 1: Login
1. Navegue até a página de login: `/login`
2. Digite o email: `admin@mediai.com`
3. Digite a senha: `admin123`
4. Clique em "Entrar"

### Passo 2: Painel Administrativo
Após o login bem-sucedido, você será redirecionado automaticamente para `/admin`

## Funcionalidades do Painel Admin

### 📊 Dashboard Principal
- Estatísticas gerais da plataforma
- Visão consolidada de:
  - Total de pacientes (com status de validação)
  - Total de médicos (com status online)
  - Total de exames (com análise de IA)
  - Total de consultas realizadas
- Atividades recentes

### 👥 Gerenciar Pacientes (`/admin/patients`)
- Visualizar todos os pacientes cadastrados
- Filtrar por status (pendentes/validados)
- Ver detalhes completos de cada paciente
- Informações de contato e localização
- Histórico médico

### 🩺 Gerenciar Médicos (`/admin/doctors`)
- Listar todos os médicos cadastrados
- Ver especialidades e localização
- Acompanhar níveis e XP (gamificação)
- Badges e conquistas
- Status de validações realizadas

### 📋 Gerenciar Exames (`/admin/exams`)
- Visualizar todos os exames enviados
- Filtrar por status de validação
- Ver resultados de análise de IA
- Identificar exames pendentes

### 💬 Gerenciar Consultas (`/admin/consultations`)
- Monitorar todas as consultas
- Separar por tipo (vídeo/chat)
- Ver histórico completo
- Acompanhar duração e status

### 🔍 Busca Global (`/admin/search`)
- Pesquisar em toda a plataforma
- Buscar pacientes, médicos, exames e consultas
- (Em desenvolvimento)

### ⚙️ Configurações (`/admin/settings`)
- Segurança e autenticação
- Gerenciamento de banco de dados
- Notificações do sistema
- Configurações gerais
- (Em desenvolvimento)

## Criar Novos Administradores

### Método 1: Script de Linha de Comando
```bash
npx tsx scripts/create-admin.ts
```

Este script criará um novo admin com credenciais padrão.

### Método 2: Personalizado
Edite o arquivo `scripts/create-admin.ts` para personalizar:
- Nome do administrador
- Email
- Senha
- Avatar

## Segurança

### Boas Práticas
1. ⚠️ **IMPORTANTE**: Altere a senha padrão após o primeiro login
2. 🔒 Use senhas fortes e únicas
3. 👤 Crie admins individuais para cada pessoa
4. 🚫 Nunca compartilhe credenciais de admin
5. 📝 Mantenha registro de todos os acessos administrativos

### Proteção de Rotas
- Todas as rotas `/admin/*` são protegidas
- Requer autenticação via JWT
- Apenas usuários com role `admin` têm acesso
- Redirecionamento automático para `/login` se não autenticado

## Estrutura Técnica

### Banco de Dados
```sql
-- Tabelas relacionadas
admins          -- Informações do administrador
adminAuth       -- Credenciais de autenticação
```

### Autenticação
- Sistema de sessão JWT com cookies HTTP-only
- Validação em tempo real via middleware
- Logout seguro com limpeza de sessão

### Navegação Admin
Layout personalizado com:
- Sidebar com navegação completa
- Indicador de usuário logado
- Botão de logout
- Visual futurístico (tema cyan/blue)

## Suporte

Para questões sobre acesso administrativo:
1. Verifique as credenciais acima
2. Confirme que está usando a rota correta `/login`
3. Verifique o console do navegador para erros
4. Entre em contato com o suporte técnico se necessário

---

**Última atualização**: 24 de Outubro de 2025  
**Status**: ✅ PRODUCTION READY
