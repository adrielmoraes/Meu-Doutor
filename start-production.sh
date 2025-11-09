
#!/bin/bash

# Script de inicialização APENAS para LiveKit Agent Backend
# Frontend está na Vercel

echo "🚀 Iniciando MediAI Backend (LiveKit Agent)..."
echo "================================================"
echo "🤖 Iniciando LiveKit Agent Python..."
echo "   Frontend rodando em: Vercel"
echo "   Backend rodando em: Replit"
echo "================================================"

# Executar o agente
cd livekit-agent
exec python run-agent.py
