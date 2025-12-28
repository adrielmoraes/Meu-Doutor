#!/bin/bash

# =============================================================================
# MediAI LiveKit Agent - Auto Start Script
# =============================================================================
# Este script inicia automaticamente o Python Agent com avatar Tavus
# =============================================================================

set -e

echo "🚀 Iniciando MediAI LiveKit Agent..."
echo ""

# Navigate to agent directory
cd "$(dirname "$0")"

if [ -f ".env" ]; then
    echo "📝 Arquivo .env encontrado - usando configuração existente"
    echo ""
else
    echo "📝 Criando arquivo .env a partir de variáveis de ambiente..."
    echo ""

    cat > .env << EOF
# LiveKit Configuration (Auto-configured)
LIVEKIT_URL=${LIVEKIT_URL:-wss://mediai-livikit-gmavbnbs.livekit.cloud}
LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}

# Gemini API
GEMINI_API_KEY=${GEMINI_API_KEY}

# Tavus Avatar Configuration
TAVUS_API_KEY=${TAVUS_API_KEY}
TAVUS_REPLICA_ID=${TAVUS_REPLICA_ID}
TAVUS_PERSONA_ID=${TAVUS_PERSONA_ID}

# BEY Avatar
BEY_API_KEY=${BEY_API_KEY}
BEY_AVATAR_ID=${BEY_AVATAR_ID}

# Database
DATABASE_URL=${DATABASE_URL}

# Agent Tools / Metrics
AGENT_SECRET=${AGENT_SECRET}
NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

# Application
NODE_ENV=production
EOF
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python..."
    if command -v python3.11 >/dev/null 2>&1; then
        python3.11 -m venv venv
    elif command -v python3 >/dev/null 2>&1; then
        python3 -m venv venv
    else
        python -m venv venv
    fi
    echo "✅ Ambiente virtual criado"
    echo ""
fi

# Activate virtual environment
echo "🔌 Ativando ambiente virtual..."
source venv/bin/activate

# Install/upgrade dependencies
echo "📥 Instalando dependências..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1
echo "✅ Dependências instaladas"
echo ""

# Check configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  Configuração do Agent"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -Eq '^LIVEKIT_API_KEY=.+$' .env; then
    echo "✅ LiveKit: Configurado"
else
    echo "❌ LiveKit: Não configurado"
    exit 1
fi

if grep -Eq '^LIVEKIT_API_SECRET=.+$' .env; then
    echo "✅ LiveKit Secret: Configurado"
else
    echo "❌ LiveKit Secret: Não configurado"
    exit 1
fi

if grep -Eq '^GEMINI_API_KEY=.+$' .env; then
    echo "✅ Gemini API: Configurado"
else
    echo "❌ Gemini API: Não configurado"
    exit 1
fi

if grep -Eq '^TAVUS_API_KEY=.+$' .env && grep -Eq '^TAVUS_REPLICA_ID=.+$' .env; then
    echo "✅ Tavus Avatar: 🎭 ATIVADO"
else
    echo "⚪ Tavus Avatar: Desativado (apenas áudio)"
fi

if grep -Eq '^DATABASE_URL=.+$' .env; then
    echo "✅ Database: Configurado"
else
    echo "⚠️  Database: Não configurado (algumas funções podem não funcionar)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the agent
echo "🎭 Iniciando Agent com Avatar Tavus..."
echo ""
echo "Aguardando pacientes na sala LiveKit..."
echo ""

# Run the agent
python agent.py start
