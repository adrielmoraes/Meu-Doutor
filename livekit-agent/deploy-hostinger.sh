
#!/bin/bash

# =============================================================================
# MediAI LiveKit Agent - Hostinger KVM2 Deploy Script
# =============================================================================

set -e

echo "🚀 MediAI Backend - Deploy para Hostinger KVM2"
echo "============================================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo bash deploy-hostinger.sh${NC}"
    exit 1
fi

# 1. Atualizar sistema
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

# 2. Instalar dependências do sistema
echo -e "${YELLOW}📦 Instalando dependências do sistema...${NC}"
apt install -y python3.11 python3.11-venv python3-pip git curl wget nginx

# 3. Criar diretório da aplicação
APP_DIR="/opt/mediai-agent"
echo -e "${YELLOW}📁 Criando diretório: $APP_DIR${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# 4. Configurar ambiente virtual Python
echo -e "${YELLOW}🐍 Configurando ambiente virtual Python...${NC}"
python3.11 -m venv venv
source venv/bin/activate

# 5. Copiar arquivos (assumindo que você fez upload via SFTP/Git)
echo -e "${YELLOW}📋 Arquivos do projeto devem estar em: $APP_DIR${NC}"
echo -e "${YELLOW}   Use: scp -r livekit-agent/* root@seu-vps:/opt/mediai-agent/${NC}"

# 6. Instalar dependências Python
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}📥 Instalando dependências Python...${NC}"
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo -e "${RED}❌ requirements.txt não encontrado!${NC}"
    exit 1
fi

# 7. Criar arquivo .env
echo -e "${YELLOW}📝 Configurando variáveis de ambiente...${NC}"
cat > .env << 'EOF'
# LiveKit Configuration
LIVEKIT_URL=wss://mediai-livikit-gmavbnbs.livekit.cloud
LIVEKIT_API_KEY=seu_api_key_aqui
LIVEKIT_API_SECRET=seu_api_secret_aqui

# Gemini API
GEMINI_API_KEY=seu_gemini_key_aqui

# Tavus Avatar
TAVUS_API_KEY=seu_tavus_key_aqui
TAVUS_REPLICA_ID=seu_replica_id_aqui
TAVUS_PERSONA_ID=seu_persona_id_aqui

# BEY Avatar
BEY_API_KEY=seu_bey_key_aqui
BEY_AVATAR_ID=seu_bey_avatar_id_aqui

# Database
DATABASE_URL=seu_database_url_aqui

# Agent Secret (para APIs)
AGENT_SECRET=seu_agent_secret_aqui
NEXT_PUBLIC_URL=https://seu-dominio.vercel.app
EOF

echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais:${NC}"
echo -e "${YELLOW}   nano $APP_DIR/.env${NC}"

# 8. Criar serviço systemd
echo -e "${YELLOW}⚙️  Configurando serviço systemd...${NC}"
cat > /etc/systemd/system/mediai-agent.service << EOF
[Unit]
Description=MediAI LiveKit Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/python run-agent.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 9. Habilitar e iniciar serviço
echo -e "${YELLOW}🚀 Habilitando serviço...${NC}"
systemctl daemon-reload
systemctl enable mediai-agent.service

echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}✅ INSTALAÇÃO COMPLETA!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "Próximos passos:"
echo -e "1. ${YELLOW}Edite as variáveis de ambiente:${NC}"
echo -e "   nano $APP_DIR/.env"
echo ""
echo -e "2. ${YELLOW}Inicie o serviço:${NC}"
echo -e "   systemctl start mediai-agent"
echo ""
echo -e "3. ${YELLOW}Verifique status:${NC}"
echo -e "   systemctl status mediai-agent"
echo ""
echo -e "4. ${YELLOW}Ver logs em tempo real:${NC}"
echo -e "   journalctl -u mediai-agent -f"
echo ""
echo -e "5. ${YELLOW}Reiniciar serviço:${NC}"
echo -e "   systemctl restart mediai-agent"
echo ""
echo -e "${GREEN}O backend estará rodando 24/7 e reiniciará automaticamente em caso de erro!${NC}"
