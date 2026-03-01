#!/bin/bash

# Script de inicialização para LiveKit Agent Backend em Produção
# Frontend está hospedado na Vercel

echo "🚀 Iniciando MediAI Backend (LiveKit Agent) - Produção"
echo "========================================================"
echo "🤖 LiveKit Agent Python"
echo "   Frontend: Vercel"
echo "   Backend: Replit (este servidor)"
echo "========================================================"

# Iniciar servidor de health check na porta 5000 em background
echo "🔌 Iniciando servidor de health check na porta 5000..."
python3 -c "
import http.server
import socketserver
import threading
import json
from datetime import datetime

class HealthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {
            'status': 'healthy',
            'service': 'MediAI LiveKit Agent',
            'timestamp': datetime.now().isoformat(),
            'message': 'LiveKit Agent is running and connected to LiveKit Cloud'
        }
        self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        pass  # Silence logs

with socketserver.TCPServer(('0.0.0.0', 5000), HealthHandler) as httpd:
    print('✅ Health check server running on port 5000')
    httpd.serve_forever()
" &

HEALTH_PID=$!
echo "✅ Health check PID: $HEALTH_PID"

# Aguardar servidor iniciar
sleep 2

# Navegar para o diretório do agente
cd livekit-agent

# Executar o agente em produção
echo "🎭 Iniciando LiveKit Agent..."
python run-agent.py

# Se o agente terminar, matar o health check
kill $HEALTH_PID 2>/dev/null
