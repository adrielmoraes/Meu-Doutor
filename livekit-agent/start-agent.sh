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

# Create .env from environment variables
echo "📝 Configurando variáveis de ambiente..."

cat > .env << EOF
# LiveKit Configuration (Auto-configured)
LIVEKIT_URL=${LIVEKIT_URL:-wss://mediai-9x9tdjm8.livekit.cloud}
LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}

# Gemini API
GEMINI_API_KEY=${GEMINI_API_KEY}

# Tavus Avatar Configuration
TAVUS_API_KEY=${TAVUS_API_KEY}
TAVUS_REPLICA_ID=${TAVUS_REPLICA_ID}
TAVUS_PERSONA_ID=${TAVUS_PERSONA_ID}

# Database
DATABASE_URL=${DATABASE_URL}

# Application
NODE_ENV=production
EOF

echo "✅ Variáveis configuradas"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python..."
    python -m venv venv
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

if [ -n "$LIVEKIT_API_KEY" ]; then
    echo "✅ LiveKit: Configurado"
else
    echo "❌ LiveKit: Não configurado"
    exit 1
fi

if [ -n "$GEMINI_API_KEY" ]; then
    echo "✅ Gemini API: Configurado"
else
    echo "❌ Gemini API: Não configurado"
    exit 1
fi

if [ -n "$TAVUS_API_KEY" ] && [ -n "$TAVUS_REPLICA_ID" ]; then
    echo "✅ Tavus Avatar: 🎭 ATIVADO"
else
    echo "⚪ Tavus Avatar: Desativado (apenas áudio)"
fi

if [ -n "$DATABASE_URL" ]; then
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
