#!/bin/bash

# =============================================================================
# MediAI LiveKit Agent - Setup Script
# =============================================================================
# Este script configura automaticamente o Python Agent com avatar Tavus
# =============================================================================

set -e  # Exit on error

echo "🚀 MediAI LiveKit Agent - Setup Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env já existe!${NC}"
    read -p "Deseja sobrescrever? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelado."
        exit 1
    fi
fi

# Copy .env.example to .env
echo "📋 Criando arquivo .env..."
cp .env.example .env
echo -e "${GREEN}✅ Arquivo .env criado${NC}"
echo ""

# Prompt for credentials
echo "🔑 Configurando credenciais..."
echo ""

# LiveKit
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  LiveKit Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "LIVEKIT_URL (ex: wss://seu-projeto.livekit.cloud): " livekit_url
read -p "LIVEKIT_API_KEY: " livekit_key
read -p "LIVEKIT_API_SECRET: " livekit_secret

# Gemini
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Gemini API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "GEMINI_API_KEY: " gemini_key

# Tavus
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Tavus Avatar (opcional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "TAVUS_API_KEY (Enter para pular): " tavus_key
if [ -n "$tavus_key" ]; then
    read -p "TAVUS_REPLICA_ID: " tavus_replica
    read -p "TAVUS_PERSONA_ID (Enter para pular): " tavus_persona
fi

# Database
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Database (Neon PostgreSQL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "DATABASE_URL: " database_url

# Write to .env
echo ""
echo "💾 Salvando configurações..."

cat > .env << EOF
# LiveKit Configuration
LIVEKIT_URL=$livekit_url
LIVEKIT_API_KEY=$livekit_key
LIVEKIT_API_SECRET=$livekit_secret

# Gemini API
GEMINI_API_KEY=$gemini_key

# Tavus Configuration
TAVUS_API_KEY=$tavus_key
TAVUS_REPLICA_ID=$tavus_replica
TAVUS_PERSONA_ID=$tavus_persona

# Database (Neon PostgreSQL)
DATABASE_URL=$database_url

# Application
NODE_ENV=development
EOF

echo -e "${GREEN}✅ Arquivo .env configurado${NC}"
echo ""

# Check Python version
echo "🐍 Verificando Python..."
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version)
    echo -e "${GREEN}✅ $python_version detectado${NC}"
else
    echo -e "${RED}❌ Python 3 não encontrado${NC}"
    echo "Por favor, instale Python 3.10 ou superior"
    exit 1
fi
echo ""

# Create virtual environment
echo "📦 Criando ambiente virtual..."
if [ -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Ambiente virtual já existe${NC}"
    read -p "Deseja recriar? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf venv
        python3 -m venv venv
        echo -e "${GREEN}✅ Ambiente virtual recriado${NC}"
    fi
else
    python3 -m venv venv
    echo -e "${GREEN}✅ Ambiente virtual criado${NC}"
fi
echo ""

# Activate virtual environment
echo "🔌 Ativando ambiente virtual..."
source venv/bin/activate
echo -e "${GREEN}✅ Ambiente virtual ativado${NC}"
echo ""

# Install dependencies
echo "📥 Instalando dependências..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Configuração:"
echo "  • LiveKit: ✅ Configurado"
echo "  • Gemini API: ✅ Configurado"
if [ -n "$tavus_key" ]; then
    echo "  • Tavus Avatar: 🎭 Ativado"
else
    echo "  • Tavus Avatar: ⚪ Desativado (apenas áudio)"
fi
echo "  • Database: ✅ Configurado"
echo "  • Ambiente Virtual: ✅ Criado e ativado"
echo "  • Dependências: ✅ Instaladas"
echo ""
echo "🚀 Para iniciar o agent:"
echo ""
echo "   source venv/bin/activate  # Se não estiver ativo"
echo "   python agent.py start"
echo ""
echo "📖 Documentação:"
echo "   • README.md - Documentação completa"
echo "   • TAVUS_AVATAR_SETUP.md - Guia do avatar Tavus"
echo ""
echo -e "${GREEN}Pronto para começar! 🎉${NC}"
