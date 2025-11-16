
# 🚀 Deploy do Backend MediAI na Hostinger KVM2

## 📋 Pré-requisitos

- VPS Hostinger KVM2 contratado
- Acesso SSH ao servidor
- Domínio apontado para o VPS (opcional, mas recomendado)
- Credenciais de todos os serviços (LiveKit, Gemini, Tavus, etc.)

## 🏗️ Arquitetura Final

```
Frontend (Vercel)
       ↓
 LiveKit Cloud
       ↓
Backend Python (Hostinger KVM2)
       ↓
PostgreSQL (Neon)
```

## 📦 Passo a Passo

### 1. Conectar ao VPS via SSH

```bash
ssh root@seu-vps-ip
```

### 2. Fazer Upload dos Arquivos

**Opção A: Via SCP (do seu computador)**

```bash
# Na sua máquina local (dentro da pasta do projeto)
scp -r livekit-agent root@seu-vps-ip:/opt/mediai-agent-temp
```

**Opção B: Via Git**

```bash
# No servidor VPS
cd /opt
git clone https://github.com/seu-usuario/mediai.git mediai-agent
cd mediai-agent/livekit-agent
```

### 3. Executar Script de Deploy

```bash
# No servidor VPS
cd /opt/mediai-agent
chmod +x deploy-hostinger.sh
sudo bash deploy-hostinger.sh
```

### 4. Configurar Variáveis de Ambiente

```bash
nano /opt/mediai-agent/.env
```

Cole suas credenciais reais:

```env
LIVEKIT_URL=wss://mediai-livikit-gmavbnbs.livekit.cloud
LIVEKIT_API_KEY=APIrYvWHxL...
LIVEKIT_API_SECRET=...
GEMINI_API_KEY=AIza...
TAVUS_API_KEY=...
TAVUS_REPLICA_ID=r3a47ce45e68
TAVUS_PERSONA_ID=p62f611e6898
BEY_API_KEY=...
DATABASE_URL=postgresql://...
AGENT_SECRET=seu_secret_super_seguro
NEXT_PUBLIC_URL=https://seu-dominio.vercel.app
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`

### 5. Iniciar Serviço

```bash
systemctl start mediai-agent
systemctl status mediai-agent
```

Você deve ver:

```
● mediai-agent.service - MediAI LiveKit Agent
   Loaded: loaded (/etc/systemd/system/mediai-agent.service; enabled)
   Active: active (running) since ...
```

### 6. Verificar Logs

```bash
# Logs em tempo real
journalctl -u mediai-agent -f

# Últimas 100 linhas
journalctl -u mediai-agent -n 100
```

Procure por:

```
✅ Configuração LiveKit Agent:
  • LiveKit URL: wss://mediai-livikit-gmavbnbs.livekit.cloud
  • LiveKit API Key: APIrYvWHxL...
  • Gemini API: ✅ Configurado
```

### 7. Configurar Firewall (Importante!)

```bash
# Permitir tráfego LiveKit (portas UDP/TCP do WebRTC)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (opcional)
ufw allow 443/tcp   # HTTPS (opcional)
ufw allow 7880:7881/tcp  # LiveKit WebRTC
ufw allow 7882/tcp       # LiveKit TURN
ufw allow 50000:60000/udp  # WebRTC media
ufw enable
```

## 🔄 Atualizar Backend

```bash
# 1. Parar serviço
systemctl stop mediai-agent

# 2. Atualizar código (via Git ou SCP)
cd /opt/mediai-agent
git pull  # ou fazer upload via SCP

# 3. Atualizar dependências
source venv/bin/activate
pip install -r requirements.txt

# 4. Reiniciar serviço
systemctl start mediai-agent
```

## 🔍 Monitoramento

### Ver Status

```bash
systemctl status mediai-agent
```

### Ver Logs em Tempo Real

```bash
journalctl -u mediai-agent -f
```

### Reiniciar Serviço

```bash
systemctl restart mediai-agent
```

### Parar Serviço

```bash
systemctl stop mediai-agent
```

## 🆘 Troubleshooting

### Serviço não inicia

```bash
# Ver logs de erro
journalctl -u mediai-agent -n 50

# Verificar permissões
ls -la /opt/mediai-agent

# Testar manualmente
cd /opt/mediai-agent
source venv/bin/activate
python run-agent.py
```

### Erro de conexão com LiveKit

```bash
# Verificar variáveis
cat /opt/mediai-agent/.env | grep LIVEKIT

# Testar conectividade
curl -I https://mediai-livikit-gmavbnbs.livekit.cloud
```

### Erro de dependências Python

```bash
cd /opt/mediai-agent
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

## 💰 Custos Estimados

| Item | Custo Mensal |
|------|--------------|
| Hostinger KVM2 | R$ 24-60 |
| LiveKit Cloud | Grátis (até 50 users) |
| Neon PostgreSQL | Grátis (até 10GB) |
| Gemini API | Pay-as-you-go (~R$ 10-30) |
| **TOTAL** | **R$ 34-90/mês** |

## ✅ Checklist Final

- [ ] VPS configurado e acessível via SSH
- [ ] Script de deploy executado com sucesso
- [ ] Arquivo `.env` configurado com credenciais reais
- [ ] Serviço `mediai-agent` rodando (status = active)
- [ ] Logs mostrando conexão com LiveKit Cloud
- [ ] Firewall configurado
- [ ] Frontend Vercel apontando para o backend correto

## 🎯 Próximos Passos

1. **Configurar domínio personalizado** (opcional)
2. **Configurar SSL/HTTPS** com Certbot
3. **Configurar backups automáticos**
4. **Configurar monitoramento** (Uptime Robot, etc.)

---

**🎉 Pronto! Seu backend está rodando 24/7 na Hostinger KVM2!**
