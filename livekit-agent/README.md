# MediAI LiveKit Agent

Servidor Python que executa o agente de voz MediAI com integração de Avatar (BEY/Tavus) e Gemini API.

## 🏗️ Arquitetura

```
Frontend (Next.js) 
    ↓ WebRTC
LiveKit Room
    ↓
Python Agent (este servidor)
    ├── Gemini API (STT, LLM, TTS)
    ├── Avatar Provider (BEY ou Tavus)
    ├── Gemini Vision (análise visual do paciente)
    ├── Medical Tools (acesso ao banco de dados)
    └── Functions (ferramentas para o LLM)
```

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Instalação com Docker](#-instalação-com-docker-recomendado)
- [Instalação Manual](#-instalação-manual)
- [Configuração de Variáveis de Ambiente](#-configuração-de-variáveis-de-ambiente)
- [Como Executar](#-como-executar)
- [Estrutura do Código](#-estrutura-do-código)
- [Troubleshooting](#-troubleshooting)

---

## 📋 Pré-requisitos

### Credenciais Necessárias

Antes de começar, você precisa das seguintes credenciais:

| Serviço | Obrigatório | Como obter |
|---------|-------------|------------|
| LiveKit | ✅ Sim | [cloud.livekit.io](https://cloud.livekit.io) |
| Gemini API | ✅ Sim | [ai.google.dev](https://ai.google.dev) |
| PostgreSQL | ✅ Sim | [neon.tech](https://neon.tech) (recomendado) |
| BEY Avatar | ❌ Opcional | [beyondpresence.ai](https://beyondpresence.ai) |
| Tavus Avatar | ❌ Opcional | [platform.tavus.io](https://platform.tavus.io) |

---

## 🐳 Instalação com Docker (Recomendado)

### Passo 1: Instalar Docker

**Ubuntu/Debian:**
```bash
# Atualizar pacotes
sudo apt update

# Instalar Docker
sudo apt install -y docker.io docker-compose

# Adicionar usuário ao grupo docker (evita usar sudo)
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar:
newgrp docker

# Verificar instalação
docker --version
docker-compose --version
```

**macOS:**
```bash
# Instalar Docker Desktop via Homebrew
brew install --cask docker

# Abrir Docker Desktop (necessário estar rodando)
open /Applications/Docker.app

# Verificar instalação
docker --version
```

**Windows:**
1. Baixe o [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Execute o instalador
3. Reinicie o computador
4. Abra o Docker Desktop
5. Verifique no PowerShell: `docker --version`

### Passo 2: Clonar/Baixar o Projeto

```bash
# Se ainda não tem o projeto
git clone <seu-repositorio>
cd livekit-agent
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env  # ou use seu editor preferido
```

Preencha as variáveis obrigatórias (veja seção [Configuração](#-configuração-de-variáveis-de-ambiente) abaixo).

### Passo 4: Construir a Imagem Docker

```bash
# Construir imagem
docker-compose build

# Ou com Docker puro:
docker build -t mediai-agent .
```

### Passo 5: Executar o Container

```bash
# Iniciar em modo background (daemon)
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Parar o container
docker-compose down
```

**Comandos úteis Docker:**

```bash
# Ver status do container
docker-compose ps

# Reiniciar o container
docker-compose restart

# Ver logs das últimas 100 linhas
docker-compose logs --tail=100

# Entrar no container (debug)
docker-compose exec mediai-agent bash

# Reconstruir após mudanças no código
docker-compose up -d --build

# Limpar containers e imagens não usados
docker system prune -f
```

### Passo 6: Verificar se está funcionando

```bash
# Ver logs do agent
docker-compose logs -f mediai-agent
```

Você deve ver algo como:
```
🚀 MediAI LiveKit Agent - 100% Gemini Powered
============================================================
✅ Configuração LiveKit Agent:
  • LiveKit URL: wss://seu-projeto.livekit.cloud
  • Gemini API: ✅ Configurado
  • Avatar Ativo: bey
============================================================
🎭 Iniciando MediAI Agent...
   📡 Aguardando pacientes na sala LiveKit...
```

---

## 🔧 Instalação Manual

### Passo 1: Verificar Python

```bash
python --version  # Precisa ser 3.10+
```

Se não tiver Python 3.10+:

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
```

**macOS:**
```bash
brew install python@3.11
```

### Passo 2: Criar Ambiente Virtual

```bash
# Criar venv
python -m venv venv

# Ativar (Linux/Mac)
source venv/bin/activate

# Ativar (Windows)
venv\Scripts\activate
```

### Passo 3: Instalar Dependências

```bash
pip install -r requirements.txt
```

### Passo 4: Configurar Variáveis de Ambiente

```bash
cp .env.example .env
nano .env  # Editar com suas credenciais
```

### Passo 5: Executar

```bash
# Modo produção (conecta ao LiveKit Cloud)
python run-agent.py

# Ou modo desenvolvimento (console local)
python agent.py dev
```

---

## ⚙️ Configuração de Variáveis de Ambiente

### Variáveis Obrigatórias

```env
# LiveKit - Obtenha em https://cloud.livekit.io
LIVEKIT_URL=wss://seu-projeto.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=seu_secret_aqui

# Gemini API - Obtenha em https://ai.google.dev
GEMINI_API_KEY=AIzaSy...

# Database PostgreSQL - Obtenha em https://neon.tech
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### Variáveis Opcionais (Avatar)

```env
# Beyond Presence (BEY) - Avatar hiper-realista
BEY_API_KEY=sua_chave_bey
BEY_AVATAR_ID=id_do_avatar

# OU Tavus - Alternativa de avatar
TAVUS_API_KEY=sua_chave_tavus
TAVUS_REPLICA_ID=id_da_replica
TAVUS_PERSONA_ID=id_da_persona
```

### Variáveis Opcionais (Integração)

```env
# URL do backend Next.js (para ferramentas do agent)
NEXT_PUBLIC_BASE_URL=https://seu-dominio.com

# Secret para autenticação de API entre agent e backend
AGENT_SECRET=seu_secret_seguro
```

### Como obter cada credencial:

#### 1. LiveKit
1. Acesse [cloud.livekit.io](https://cloud.livekit.io)
2. Crie um projeto
3. Vá em **Settings** > **Keys**
4. Copie a URL, API Key e API Secret

#### 2. Gemini API
1. Acesse [ai.google.dev](https://ai.google.dev)
2. Clique em "Get API Key"
3. Crie um projeto no Google Cloud
4. Copie a API Key gerada

#### 3. Neon PostgreSQL
1. Acesse [neon.tech](https://neon.tech)
2. Crie um projeto
3. Copie a connection string (com `?sslmode=require`)

#### 4. Beyond Presence (BEY)
1. Acesse [beyondpresence.ai](https://beyondpresence.ai)
2. Crie uma conta
3. Crie ou selecione um avatar
4. Copie API Key e Avatar ID

---

## 🎯 Como Executar

### Com Docker

```bash
# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

### Sem Docker

```bash
# Modo Production (LiveKit Room)
python run-agent.py

# Modo Development (Console/Terminal)
python agent.py dev
```

---

## 🧰 Estrutura do Código

```
livekit-agent/
├── agent.py                 # Agent principal com lógica médica
├── run-agent.py            # Entry point para produção
├── gemini_provider.py       # Providers Gemini (STT, LLM, TTS)
├── medical_tools/           # Ferramentas médicas
│   ├── __init__.py
│   ├── patient_data.py     # Acesso a dados do paciente
│   └── wellness.py         # Planos de bem-estar
├── Dockerfile              # Configuração Docker
├── docker-compose.yml      # Orquestração de containers
├── .dockerignore          # Arquivos ignorados no build
├── requirements.txt        # Dependências Python
├── .env.example           # Template de variáveis
└── README.md              # Esta documentação
```

---

## 🛠️ Funcionalidades do Agent

### Gemini Live API (100% Integrado)
- **STT (Speech-to-Text)**: Transcrição em tempo real em português
- **LLM**: Conversação contextual com histórico médico
- **TTS (Text-to-Speech)**: Voz natural e fluente
- **Vision**: Análise visual do paciente pela câmera

### Medical Tools (Funções do LLM)

| Função | Descrição |
|--------|-----------|
| `get_latest_exams()` | Busca últimos exames do paciente |
| `get_patient_symptoms()` | Retorna sintomas do cadastro |
| `check_wellness_plan()` | Verifica plano de bem-estar |
| `capture_and_analyze_patient()` | Análise visual pela câmera |

### Provedores de Avatar

| Provider | Descrição |
|----------|-----------|
| **BEY** | Avatar hiper-realista, baixa latência |
| **Tavus** | Avatar realista, lip-sync avançado |

---

## 🔧 Troubleshooting

### Erros Comuns

#### "GEMINI_API_KEY not found"
```bash
# Verificar se .env existe
cat .env | grep GEMINI

# Se não existir, criar:
cp .env.example .env
nano .env
```

#### "DATABASE_URL not found"
```bash
# Verificar conexão com banco
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT 1"
```

#### "Connection refused" no Docker
```bash
# Verificar se container está rodando
docker-compose ps

# Ver logs de erro
docker-compose logs mediai-agent

# Reconstruir se necessário
docker-compose down
docker-compose up -d --build
```

#### Import errors
```bash
# Reinstalar dependências
pip install -r requirements.txt --force-reinstall
```

#### "LiveKit connection failed"
1. Verifique se as credenciais LiveKit estão corretas
2. Confirme que o projeto LiveKit está ativo
3. Verifique firewalls/proxies que podem bloquear WebSocket

### Logs de Debug

```bash
# Docker - ver logs detalhados
docker-compose logs -f --tail=200

# Manual - aumentar verbosidade
LOG_LEVEL=DEBUG python run-agent.py
```

---

## 📊 Monitoramento em Produção

### Health Check

O container Docker inclui health check automático. Verifique:

```bash
docker inspect mediai-livekit-agent | grep -A 5 "Health"
```

### Limites de Recursos

O `docker-compose.yml` define limites de recursos:
- **CPU**: máximo 2 cores
- **Memória**: máximo 2GB

Ajuste conforme necessário para seu servidor.

### Logs Persistentes

Os logs são salvos com rotação automática:
- Máximo 3 arquivos
- 10MB por arquivo

---

## 📚 Recursos Adicionais

- **LiveKit Docs**: https://docs.livekit.io/agents
- **Gemini API**: https://ai.google.dev/gemini-api/docs
- **Beyond Presence**: https://docs.beyondpresence.ai
- **Tavus Integration**: https://docs.livekit.io/agents/integrations/avatar/tavus/
- **Docker Docs**: https://docs.docker.com

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique todas as variáveis de ambiente
2. Confira os logs para erros específicos
3. Teste primeiro sem Docker para isolar problemas
4. Verifique a documentação do LiveKit para atualizações

---

## ✨ Deploy em Produção

### Opção 1: VPS/Cloud (Docker)

```bash
# No servidor
git pull origin main
docker-compose up -d --build
```

### Opção 2: LiveKit Cloud Deploy

```bash
lk deploy
```

### Opção 3: Kubernetes

Use o Dockerfile para criar imagem e faça deploy no seu cluster K8s.

---

## 📝 Changelog

- **v2.0** - Suporte a Docker, BEY Avatar, Gemini Vision
- **v1.0** - Versão inicial com Tavus e Gemini
