
#!/bin/bash

# Script de inicialização para LiveKit Agent Backend em Produção
# Frontend está hospedado na Vercel

echo "🚀 Iniciando MediAI Backend (LiveKit Agent) - Produção"
echo "========================================================"
echo "🤖 LiveKit Agent Python"
echo "   Frontend: Vercel"
echo "   Backend: Replit (este servidor)"
echo "========================================================"

# Navegar para o diretório do agente
cd livekit-agent

# Executar o agente em produção
echo "🎭 Iniciando LiveKit Agent..."
exec python run-agent.py
