#!/bin/bash

# Script de inicialização para produção
# Inicia Next.js e Python LiveKit Agent em paralelo

echo "🚀 Iniciando MediAI Platform em Produção..."
echo "================================================"

# Função para cleanup quando o script terminar
cleanup() {
    echo ""
    echo "🛑 Encerrando serviços..."
    kill $NEXTJS_PID $AGENT_PID 2>/dev/null
    exit
}

trap cleanup SIGTERM SIGINT

# Iniciar Next.js em background
echo "📦 Iniciando servidor Next.js na porta 5000..."
npm run start &
NEXTJS_PID=$!
echo "✅ Next.js iniciado (PID: $NEXTJS_PID)"

# Aguardar Next.js estar pronto
sleep 5

# Iniciar Python LiveKit Agent em background
echo "🤖 Iniciando MediAI LiveKit Agent..."
cd livekit-agent
python run-agent.py &
AGENT_PID=$!
cd ..
echo "✅ LiveKit Agent iniciado (PID: $AGENT_PID)"

echo ""
echo "================================================"
echo "✅ MediAI Platform está rodando!"
echo "   • Next.js Web Server: http://0.0.0.0:5000"
echo "   • LiveKit Agent: Ativo e aguardando consultas"
echo "================================================"

# Manter o script rodando e monitorar os processos
while true; do
    # Verificar se Next.js ainda está rodando
    if ! kill -0 $NEXTJS_PID 2>/dev/null; then
        echo "❌ Next.js parou inesperadamente. Reiniciando..."
        npm run start &
        NEXTJS_PID=$!
    fi
    
    # Verificar se o Agent ainda está rodando
    if ! kill -0 $AGENT_PID 2>/dev/null; then
        echo "❌ LiveKit Agent parou inesperadamente. Reiniciando..."
        cd livekit-agent
        python run-agent.py &
        AGENT_PID=$!
        cd ..
    fi
    
    sleep 10
done
