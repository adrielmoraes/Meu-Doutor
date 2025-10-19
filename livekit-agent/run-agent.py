#!/usr/bin/env python
"""
MediAI LiveKit Agent - Launcher
Displays configuration and runs the agent with Tavus avatar.
"""

import os
import subprocess
import sys

# Load environment variables
LIVEKIT_URL = os.getenv('LIVEKIT_URL', 'wss://mediai-livikit-gmavbnbs.livekit.cloud')
LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')
TAVUS_API_KEY = os.getenv('TAVUS_API_KEY')
TAVUS_REPLICA_ID = os.getenv('TAVUS_REPLICA_ID')
TAVUS_PERSONA_ID = os.getenv('TAVUS_PERSONA_ID')
DATABASE_URL = os.getenv('DATABASE_URL')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

print("🚀 MediAI LiveKit Agent")
print("=" * 60)
print()

# Validate required credentials
errors = []
if not LIVEKIT_API_KEY:
    errors.append("❌ LIVEKIT_API_KEY não configurado")
if not LIVEKIT_API_SECRET:
    errors.append("❌ LIVEKIT_API_SECRET não configurado")
if not OPENAI_API_KEY:
    errors.append("❌ OPENAI_API_KEY não configurado (temporário)")

if errors:
    print("⚠️  Erro: Credenciais ausentes:")
    for error in errors:
        print(f"  {error}")
    print()
    print("NOTA: O sistema usa Gemini API mas temporariamente precisa")
    print("de OpenAI para STT/TTS até implementarmos os providers Gemini.")
    print()
    print("Solicite OPENAI_API_KEY ao usuário.")
    sys.exit(1)

# Display configuration
print("✅ Configuração LiveKit Agent:")
print(f"  • LiveKit URL: {LIVEKIT_URL}")
print(f"  • LiveKit API Key: {LIVEKIT_API_KEY[:10]}...")
print(f"  • OpenAI API: ✅ Configurado (temporário)")

if TAVUS_API_KEY and TAVUS_REPLICA_ID and TAVUS_PERSONA_ID:
    print(f"  • Tavus Avatar: 🎭 ATIVADO")
    print(f"    - Replica ID: {TAVUS_REPLICA_ID}")
    print(f"    - Persona ID: {TAVUS_PERSONA_ID}")
else:
    print("  • Tavus Avatar: ⚪ Desativado (apenas áudio)")
    print(f"    - API Key: {'✓' if TAVUS_API_KEY else '✗'}")
    print(f"    - Replica ID: {'✓' if TAVUS_REPLICA_ID else '✗'}")
    print(f"    - Persona ID: {'✓' if TAVUS_PERSONA_ID else '✗'}")

if DATABASE_URL:
    print("  • Database: ✅ Configurado")
else:
    print("  • Database: ⚠️  Não configurado")

print()
print("=" * 60)
print("🎭 Iniciando LiveKit Agent...")
print("   Aguardando pacientes na sala LiveKit...")
print("   O avatar Tavus aparecerá automaticamente quando")
print("   um paciente iniciar uma consulta!")
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
