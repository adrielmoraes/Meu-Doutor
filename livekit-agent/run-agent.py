#!/usr/bin/env python
"""
MediAI LiveKit Agent - Launcher
100% Gemini API powered medical voice assistant with Tavus avatar.
"""

import os
import subprocess
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables: check local .env first, then parent project root .env
agent_env = Path(__file__).parent / '.env'
root_env = Path(__file__).parent.parent / '.env'
if agent_env.exists():
    load_dotenv(dotenv_path=agent_env)
if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=False)

LIVEKIT_URL = os.getenv('LIVEKIT_URL', 'wss://mediai-livikit-gmavbnbs.livekit.cloud')
LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
TAVUS_API_KEY = os.getenv('TAVUS_API_KEY')
TAVUS_REPLICA_ID = os.getenv('TAVUS_REPLICA_ID')
TAVUS_PERSONA_ID = os.getenv('TAVUS_PERSONA_ID')
BEY_API_KEY = os.getenv('BEY_API_KEY')
BEY_AVATAR_ID = os.getenv('BEY_AVATAR_ID')
DATABASE_URL = os.getenv('DATABASE_URL')

print("🚀 MediAI LiveKit Agent - 100% Gemini Powered")
print("=" * 60)
print()

# Validate required credentials
errors = []
if not LIVEKIT_API_KEY:
    errors.append("❌ LIVEKIT_API_KEY não configurado")
if not LIVEKIT_API_SECRET:
    errors.append("❌ LIVEKIT_API_SECRET não configurado")
if not GEMINI_API_KEY:
    errors.append("❌ GEMINI_API_KEY não configurado")

if errors:
    print("⚠️  Erro: Credenciais ausentes:")
    for error in errors:
        print(f"  {error}")
    print()
    print("Configure as variáveis de ambiente no Replit.")
    sys.exit(1)

# Display configuration
print("✅ Configuração LiveKit Agent:")
print(f"  • LiveKit URL: {LIVEKIT_URL}")
if LIVEKIT_API_KEY:
    print(f"  • LiveKit API Key: {LIVEKIT_API_KEY[:10]}...")
else:
    print("  • LiveKit API Key: Não configurado")
print(f"  • Gemini API: ✅ Configurado (100% Gemini powered)")

print("  • Avatar Providers Disponíveis:")

# Tavus status
if TAVUS_API_KEY and TAVUS_REPLICA_ID and TAVUS_PERSONA_ID:
    print(f"    - Tavus: 🎭 CONFIGURADO")
    print(f"      Replica ID: {TAVUS_REPLICA_ID}")
    print(f"      Persona ID: {TAVUS_PERSONA_ID}")
else:
    print("    - Tavus: ⚪ Não configurado")
    print(f"      API Key: {'✓' if TAVUS_API_KEY else '✗'}")
    print(f"      Replica ID: {'✓' if TAVUS_REPLICA_ID else '✗'}")
    print(f"      Persona ID: {'✓' if TAVUS_PERSONA_ID else '✗'}")

# BEY status
if BEY_API_KEY:
    print(f"    - Beyond Presence (BEY): 🎭 CONFIGURADO")
    if BEY_AVATAR_ID:
        print(f"      Avatar ID: {BEY_AVATAR_ID}")
    else:
        print(f"      Avatar ID: usando padrão")
else:
    print("    - Beyond Presence (BEY): ⚪ Não configurado")

print("  • Avatar Ativo: Definido no Admin Panel (banco de dados)")

if DATABASE_URL:
    print("  • Database: ✅ Configurado")
else:
    print("  • Database: ⚠️  Não configurado")

print()
print("=" * 60)
print("🎭 Iniciando MediAI Agent...")
print("   📡 Aguardando pacientes na sala LiveKit...")
print("   🎥 O avatar Tavus aparecerá automaticamente quando")
print("   🏥 um paciente iniciar uma consulta!")
print("   🧠 100% Gemini API (STT + LLM + TTS)")
print("=" * 60)
print()

# Run the agent
try:
    subprocess.run([sys.executable, "agent.py", "start"], check=True)
except KeyboardInterrupt:
    print("\n🛑 Agent interrompido pelo usuário")
except subprocess.CalledProcessError as e:
    print(f"❌ Erro ao executar agent: {e}")
    sys.exit(1)
