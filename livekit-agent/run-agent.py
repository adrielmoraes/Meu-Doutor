#!/usr/bin/env python
"""
MediAI LiveKit Agent - Simplified Launcher
Displays configuration and runs the agent.
"""

import os
import subprocess
import sys

# Load environment variables
LIVEKIT_URL = os.getenv('LIVEKIT_URL', 'wss://mediai-livikit-gmavbnbs.livekit.cloud')
LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
TAVUS_API_KEY = os.getenv('TAVUS_API_KEY')
TAVUS_REPLICA_ID = os.getenv('TAVUS_REPLICA_ID')
TAVUS_PERSONA_ID = os.getenv('TAVUS_PERSONA_ID')
DATABASE_URL = os.getenv('DATABASE_URL')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

print("🚀 MediAI LiveKit Agent Launcher")
print("=" * 50)
print()

# Validate required credentials
errors = []
if not LIVEKIT_API_KEY:
    errors.append("❌ LIVEKIT_API_KEY não configurado")
if not LIVEKIT_API_SECRET:
    errors.append("❌ LIVEKIT_API_SECRET não configurado")
if not OPENAI_API_KEY:
    print("⚠️  OPENAI_API_KEY não configurado - necessário para STT/LLM/TTS")
    errors.append("❌ OPENAI_API_KEY não configurado")

if errors:
    print("Erro: Credenciais ausentes:")
    for error in errors:
        print(f"  {error}")
    print()
    print("Configure as variáveis de ambiente no Replit.")
    print()
    print("Para obter uma OPENAI_API_KEY:")
    print("  1. Acesse https://platform.openai.com/api-keys")
    print("  2. Crie uma nova API key")
    print("  3. Adicione aos Secrets do Replit")
    sys.exit(1)

# Display configuration
print("✅ Configuração:")
print(f"  • LiveKit URL: {LIVEKIT_URL}")
print(f"  • LiveKit API Key: {LIVEKIT_API_KEY[:10]}...")
print(f"  • OpenAI API: {'✅ Configurado' if OPENAI_API_KEY else '❌ Ausente'}")

if TAVUS_API_KEY and TAVUS_REPLICA_ID:
    print(f"  • Tavus Avatar: 🎭 ATIVADO (Replica: {TAVUS_REPLICA_ID})")
else:
    print("  • Tavus Avatar: ⚪ Desativado (apenas áudio)")

if DATABASE_URL:
    print("  • Database: ✅ Configurado")
else:
    print("  • Database: ⚠️  Não configurado")

print()
print("=" * 50)
print("🎭 Aguardando pacientes na sala LiveKit...")
print("   O avatar Tavus entrará automaticamente quando")
print("   um paciente iniciar uma consulta.")
print("=" * 50)
print()

# Run the agent directly
try:
    subprocess.run([sys.executable, "agent.py", "start"], check=True)
except KeyboardInterrupt:
    print("\n🛑 Agent interrompido pelo usuário")
except subprocess.CalledProcessError as e:
    print(f"❌ Erro ao executar agent: {e}")
    sys.exit(1)
