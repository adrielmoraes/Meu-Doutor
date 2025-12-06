# MediAI LiveKit Agent

Agente de IA médica em tempo real usando LiveKit + Google Gemini para consultas por voz/vídeo com avatar virtual.

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Paciente      │────▶│  LiveKit Cloud  │◀────│  MediAI Agent   │
│   (Browser)     │     │  (WebRTC SFU)   │     │  (Este Projeto) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Avatar (BEY/   │     │  Gemini 2.5     │
                        │  Tavus)         │     │  Flash API      │
                        └─────────────────┘     └─────────────────┘
```

## Funcionalidades

- **Consulta médica por voz** com IA em português brasileiro
- **Avatar virtual hiper-realista** (Beyond Presence ou Tavus)
- **Visão por câmera** - IA pode observar o paciente quando solicitado
- **Busca de médicos** em tempo real no banco de dados
- **Agendamento de consultas** via voz
- **Métricas de uso** para billing (tokens, minutos de vídeo/áudio)

---

## Indice

- [Modos de Visao](#modos-de-visao)
- [Desenvolvimento Local Windows](#desenvolvimento-local-windows--docker)
- [Producao em VPS Linux](#producao-em-vps-linux)
- [Variaveis de Ambiente](#variaveis-de-ambiente)
- [Troubleshooting](#troubleshooting)
- [Instalacao Manual sem Docker](#instalacao-manual-sem-docker)

---

## Modos de Visao

| Modo | Variaveis | Comportamento |
|------|-----------|---------------|
| **On-Demand** (Padrao) | `ENABLE_VISION=true` + `ENABLE_VISION_STREAMING=false` | IA usa tool `look_at_patient` quando precisa ver o paciente |
| **Streaming** (Experimental) | `ENABLE_VISION_STREAMING=true` | Frame continuo a cada 4s (requer CPU com AVX) |
| **Desabilitado** | `ENABLE_VISION=false` | Apenas audio, sem visao |

**Importante**: Se voce ver erro `exit code -4` (SIGILL), desabilite o streaming: `ENABLE_VISION_STREAMING=false`

---

## Desenvolvimento Local Windows + Docker

### Pre-requisitos

1. **Docker Desktop** - https://www.docker.com/products/docker-desktop/
   - Durante instalacao, marque **"Use WSL 2 instead of Hyper-V"**
   - Apos instalar, reinicie o computador
   
2. **Git** - https://git-scm.com/download/win

3. **Credenciais** (obtenha antes de comecar):
   - LiveKit Cloud: https://cloud.livekit.io
   - Google Gemini API: https://aistudio.google.com/app/apikey
   - Beyond Presence: https://beyondpresence.ai (ou Tavus)

### Passo 1: Clonar e Configurar

Abra o **PowerShell** ou **Terminal** e execute:

```powershell
# Clonar repositorio
git clone <seu-repositorio>
cd livekit-agent

# Copiar arquivo de exemplo
copy .env.example .env

# Abrir .env para editar (use seu editor preferido)
notepad .env
```

### Passo 2: Preencher Variaveis de Ambiente

Edite o arquivo `.env` com suas credenciais:

```env
# LiveKit Cloud (obtenha em https://cloud.livekit.io > Settings > Keys)
LIVEKIT_URL=wss://seu-projeto.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini API (obtenha em https://aistudio.google.com/app/apikey)
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx

# Avatar Provider - Beyond Presence (obtenha em beyondpresence.ai)
BEY_API_KEY=sua_chave_bey
BEY_AVATAR_ID=seu_avatar_id

# OU Tavus (alternativa)
# TAVUS_API_KEY=sua_chave_tavus
# TAVUS_REPLICA_ID=seu_replica_id

# Database PostgreSQL (seu banco Neon ou outro)
DATABASE_URL=postgresql://user:password@host:5432/mediai?sslmode=require

# Backend MediAI (URL onde o Next.js roda)
NEXT_PUBLIC_URL=http://localhost:5000
AGENT_SECRET=seu_secret_para_metricas

# Visao - Recomendado: on-demand (estavel)
ENABLE_VISION=true
ENABLE_VISION_STREAMING=false

# Modelo Gemini (opcional - padrao: gemini-2.5-flash)
# GEMINI_LLM_MODEL=gemini-2.5-flash-native-audio-preview-09-2025
```

### Passo 3: Build da Imagem Docker

```powershell
# Build da imagem (primeira vez demora alguns minutos)
docker build -t mediai-agent .

# Verificar se foi criada
docker images | findstr mediai-agent
```

### Passo 4: Executar o Container

```powershell
# Modo interativo (ver logs em tempo real) - RECOMENDADO para debug
docker run --rm -it --env-file .env mediai-agent

# OU modo background (daemon)
docker run -d --name mediai-agent --env-file .env mediai-agent

# Ver logs do container em background
docker logs -f mediai-agent
```

### Passo 5: Verificar Conexao

Quando o agente iniciar corretamente, voce vera:

```
============================================================
  MediAI LiveKit Agent - 100% Gemini Powered
============================================================
  Configuracao LiveKit Agent:
  * LiveKit URL: wss://seu-projeto.livekit.cloud
  * Gemini API: Configurado
  * Avatar Ativo: bey
  * Visao: ON-DEMAND (look_at_patient tool)
============================================================
  Iniciando MediAI Agent...
  Aguardando pacientes na sala LiveKit...
```

### Comandos Uteis Windows

```powershell
# Parar o container
docker stop mediai-agent

# Remover o container
docker rm mediai-agent

# Rebuild apos alteracoes no codigo
docker build -t mediai-agent . --no-cache

# Entrar no container para debug
docker exec -it mediai-agent bash

# Ver uso de recursos (CPU, memoria)
docker stats mediai-agent

# Limpar imagens/containers nao usados
docker system prune -f
```

---

## Producao em VPS Linux

### Requisitos do Servidor

| Recurso | Minimo | Recomendado |
|---------|--------|-------------|
| **OS** | Ubuntu 20.04 | Ubuntu 22.04 LTS |
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Disco** | 10 GB SSD | 20 GB SSD |
| **Rede** | Porta 443 outbound | - |

**Provedores recomendados**: DigitalOcean, Vultr, Hetzner, AWS Lightsail, Oracle Cloud

### Passo 1: Preparar o Servidor

Conecte via SSH e execute:

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker (script oficial)
curl -fsSL https://get.docker.com | sudo sh

# Adicionar usuario ao grupo docker (evita usar sudo)
sudo usermod -aG docker $USER

# Aplicar grupo (ou reconecte via SSH)
newgrp docker

# Verificar instalacao
docker --version
docker compose version
```

### Passo 2: Clonar o Projeto

```bash
# Criar diretorio
sudo mkdir -p /opt/mediai-agent
sudo chown $USER:$USER /opt/mediai-agent
cd /opt/mediai-agent

# Clonar repositorio
git clone <seu-repositorio> .

# Criar arquivo de ambiente
nano .env
```

Cole as mesmas variaveis da secao anterior (adaptando URLs para producao).

### Passo 3: Criar docker-compose.yml

```bash
nano docker-compose.yml
```

Cole o seguinte conteudo:

```yaml
version: '3.8'

services:
  mediai-agent:
    build: .
    container_name: mediai-agent
    restart: unless-stopped
    env_file:
      - .env
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
    deploy:
      resources:
        limits:
          cpus: '3'
          memory: 6G
        reservations:
          cpus: '1'
          memory: 2G
    healthcheck:
      test: ["CMD", "python", "-c", "print('ok')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
```

### Passo 4: Deploy

```bash
# Build e iniciar
docker compose up -d --build

# Ver logs em tempo real
docker compose logs -f

# Verificar status
docker compose ps
```

### Passo 5: Configurar Reinicio Automatico

O `restart: unless-stopped` ja garante que o container reinicia automaticamente.
Para garantir que Docker inicia no boot:

```bash
sudo systemctl enable docker
```

### Script de Deploy Automatizado

Crie o arquivo `/opt/mediai-agent/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "=== Deploying MediAI Agent ==="

cd /opt/mediai-agent

# Baixar ultimas alteracoes
echo "Pulling latest changes..."
git pull origin main

# Parar container atual
echo "Stopping current container..."
docker compose down

# Rebuild e iniciar
echo "Building and starting new container..."
docker compose up -d --build

# Aguardar container iniciar
echo "Waiting for container to start..."
sleep 15

# Verificar status
if docker compose ps | grep -q "running"; then
    echo "=== Deploy successful! ==="
    echo ""
    echo "Recent logs:"
    docker compose logs --tail 30
else
    echo "=== Deploy FAILED! ==="
    echo ""
    echo "Error logs:"
    docker compose logs --tail 50
    exit 1
fi
```

Tornar executavel e rodar:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Monitoramento

```bash
# Ver logs em tempo real
docker compose logs -f --tail 100

# Ver uso de recursos
docker stats mediai-agent

# Ver status do container
docker compose ps

# Reiniciar manualmente
docker compose restart

# Parar tudo
docker compose down
```

### Configurar Logs Persistentes (Opcional)

Para salvar logs em disco:

```bash
# Criar diretorio de logs
sudo mkdir -p /var/log/mediai-agent
sudo chown $USER:$USER /var/log/mediai-agent
```

Adicione ao `docker-compose.yml`:

```yaml
    volumes:
      - /var/log/mediai-agent:/app/logs
```

---

## Variaveis de Ambiente

### Obrigatorias

| Variavel | Descricao | Como obter |
|----------|-----------|------------|
| `LIVEKIT_URL` | URL WebSocket do LiveKit | cloud.livekit.io > Settings > Keys |
| `LIVEKIT_API_KEY` | API Key do LiveKit | cloud.livekit.io > Settings > Keys |
| `LIVEKIT_API_SECRET` | API Secret do LiveKit | cloud.livekit.io > Settings > Keys |
| `GOOGLE_API_KEY` | Chave API do Gemini | aistudio.google.com/app/apikey |
| `DATABASE_URL` | Connection string PostgreSQL | neon.tech ou seu provedor |
| `NEXT_PUBLIC_URL` | URL do backend MediAI | Seu dominio |
| `AGENT_SECRET` | Secret para API de metricas | Gere com `openssl rand -hex 32` |

### Avatar (pelo menos um)

| Variavel | Descricao |
|----------|-----------|
| `BEY_API_KEY` | Chave Beyond Presence |
| `BEY_AVATAR_ID` | ID do avatar BEY |
| `TAVUS_API_KEY` | Chave Tavus (alternativa) |
| `TAVUS_REPLICA_ID` | ID da replica Tavus |

### Opcionais

| Variavel | Padrao | Descricao |
|----------|--------|-----------|
| `ENABLE_VISION` | `true` | Habilitar visao da camera |
| `ENABLE_VISION_STREAMING` | `false` | Streaming continuo (experimental) |
| `GEMINI_LLM_MODEL` | `gemini-2.5-flash` | Modelo Gemini a usar |

---

## Troubleshooting

### Erros Comuns

| Erro | Causa | Solucao |
|------|-------|---------|
| `exit code -4` (SIGILL) | CPU sem suporte AVX | `ENABLE_VISION_STREAMING=false` |
| `Connection refused` | Credenciais incorretas | Verificar LIVEKIT_URL e API keys |
| `Database connection error` | PostgreSQL inacessivel | Verificar DATABASE_URL e SSL |
| `Avatar not loading` | API key invalida | Verificar BEY_API_KEY ou TAVUS |
| `generate_reply timed out` | Versao antiga do codigo | Atualizar e rebuildar |

### Debug Detalhado

```bash
# Ver logs completos
docker compose logs --tail 200

# Entrar no container
docker compose exec mediai-agent bash

# Testar conexao com banco
docker compose exec mediai-agent python -c "import psycopg2; print('DB OK')"

# Verificar variaveis de ambiente
docker compose exec mediai-agent env | grep -E "(LIVEKIT|GEMINI|DATABASE)"
```

### Rebuild Completo

Quando precisar reconstruir do zero:

```bash
# Parar e remover tudo
docker compose down --rmi all --volumes

# Rebuild do zero
docker compose up -d --build --force-recreate
```

---

## Instalacao Manual sem Docker

### Pre-requisitos

- Python 3.11+
- pip

### Passos

```bash
# Criar ambiente virtual
python -m venv venv

# Ativar (Linux/Mac)
source venv/bin/activate

# Ativar (Windows)
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar ambiente
cp .env.example .env
nano .env  # editar com suas credenciais

# Executar
python agent.py start
```

---

## Arquitetura do Codigo

```
livekit-agent/
├── agent.py           # Agente principal (MediAIAgent class)
├── requirements.txt   # Dependencias Python
├── Dockerfile         # Build container
├── docker-compose.yml # Orquestracao producao
├── .env.example       # Template de variaveis
├── .env               # Suas credenciais (NAO commitar!)
└── README.md          # Esta documentacao
```

### Componentes Principais

- **MediAIAgent**: Classe principal com gerenciamento de sessao
- **FunctionTools**: Ferramentas que a IA pode chamar (buscar medicos, agendar, etc)
- **VisionSystem**: Captura e processamento de frames da camera
- **MetricsCollector**: Coleta metricas de uso para billing

---

## Seguranca

- **Nunca commite o arquivo `.env`** - ja esta no .gitignore
- **Use secrets diferentes** para dev e producao
- **Rotacione API keys** periodicamente
- **Monitore logs** para detectar anomalias
- **Limite recursos** do container para evitar DoS
- **Use HTTPS** para o backend em producao

---

## Recursos Adicionais

- **LiveKit Docs**: https://docs.livekit.io/agents/
- **Gemini API**: https://ai.google.dev/docs
- **Beyond Presence**: https://docs.bey.ai/
- **Tavus**: https://docs.tavus.io/
- **Docker Docs**: https://docs.docker.com/

---

## Changelog

- **v2.1** - Dual vision modes (on-demand/streaming), dynamic tools
- **v2.0** - Docker support, BEY Avatar, Gemini Vision
- **v1.0** - Versao inicial com Tavus e Gemini
