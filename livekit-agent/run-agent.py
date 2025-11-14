#!/usr/bin/env python3
"""
MediAI LiveKit Agent - Production Runner
Handles database setup, credential validation, and agent startup
"""

import os
import sys
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path, override=True)


def validate_credentials():
    """Validate all required environment variables"""
    print("\n🔍 Validando credenciais do arquivo .env...")

    required_vars = {
        'LIVEKIT_URL': os.getenv('LIVEKIT_URL'),
        'LIVEKIT_API_KEY': os.getenv('LIVEKIT_API_KEY'),
        'LIVEKIT_API_SECRET': os.getenv('LIVEKIT_API_SECRET'),
        'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY'),
        'DATABASE_URL': os.getenv('DATABASE_URL'),
    }

    # Check for missing variables
    missing = [var for var, value in required_vars.items() if not value]

    if missing:
        print(f"\n❌ Erro: Variáveis de ambiente ausentes no .env:")
        for var in missing:
            print(f"   • {var}")
        print("\n💡 Verifique o arquivo livekit-agent/.env")
        sys.exit(1)

    print("✅ Credenciais obrigatórias validadas:")
    print(f"   • LiveKit URL: {required_vars['LIVEKIT_URL'][:50]}...")
    print(f"   • LiveKit API Key: {required_vars['LIVEKIT_API_KEY'][:15]}...")
    print(f"   • Gemini API: ✅ Configurado")
    print(f"   • Database: ✅ Configurado")

    # Optional: Avatar configuration
    tavus_key = os.getenv('TAVUS_API_KEY')
    bey_key = os.getenv('BEY_API_KEY')

    avatar_providers = []
    if tavus_key:
        replica_id = os.getenv('TAVUS_REPLICA_ID')
        persona_id = os.getenv('TAVUS_PERSONA_ID')
        if replica_id:
            avatar_providers.append(f"Tavus: 🎭 CONFIGURADO\n      Replica ID: {replica_id}")
            if persona_id:
                avatar_providers.append(f"      Persona ID: {persona_id}")

    if bey_key:
        avatar_id = os.getenv('BEY_AVATAR_ID')
        if avatar_id:
            avatar_providers.append(f"Beyond Presence (BEY): 🎭 CONFIGURADO\n      Avatar ID: {avatar_id}")

    return required_vars, avatar_providers


def display_configuration(required_vars, avatar_providers):
    """Display the current configuration and status of the agent."""
    print("\n" + "=" * 60)
    print("🚀 MediAI LiveKit Agent - 100% Gemini Powered")
    print("=" * 60)
    print()
    print("✅ Configuração LiveKit Agent:")
    print(f"  • LiveKit URL: {required_vars['LIVEKIT_URL']}")
    print(f"  • LiveKit API Key: {required_vars['LIVEKIT_API_KEY'][:10]}...")
    print(f"  • Gemini API: ✅ Configurado")

    print("\n  • Avatar Providers Disponíveis:")
    if not avatar_providers:
        print("    Nenhum provedor de avatar configurado.")
    else:
        for provider_info in avatar_providers:
            print(f"    - {provider_info.replace('\n', '\n      ')}") # Indent sub-lines

    print("  • Avatar Ativo: Definido no Admin Panel (banco de dados)")
    print(f"  • Database: ✅ Configurado")
    print()
    print("=" * 60)
    print("🎭 Iniciando MediAI Agent...")
    print("   📡 Aguardando pacientes na sala LiveKit...")
    print("   🎥 O avatar Tavus aparecerá automaticamente quando")
    print("   🏥 um paciente iniciar uma consulta!")
    print("   🧠 100% Gemini API (STT + LLM + TTS)")
    print("=" * 60)
    print()


def run_agent():
    """Run the main agent script."""
    print("🚀 Iniciando o agente principal...")
    try:
        subprocess.run([sys.executable, "agent.py", "start"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Agent interrompido pelo usuário")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao executar agent: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Load environment variables (already done at the top)
    # os.environ.setdefault('ENV_VAR_NAME', 'default_value') # Example for setting defaults if needed

    # Validate credentials and get configuration
    try:
        required_vars, avatar_providers = validate_credentials()
        display_configuration(required_vars, avatar_providers)
        run_agent()
    except SystemExit as e:
        # Handle the sys.exit calls from validation
        if e.code != 0:
            print("\nFalha na inicialização do agente devido a credenciais inválidas.")
        sys.exit(e.code)
    except Exception as e:
        print(f"\n❌ Um erro inesperado ocorreu: {e}")
        sys.exit(1)