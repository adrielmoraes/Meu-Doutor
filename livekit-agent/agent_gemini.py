"""
MediAI LiveKit Voice Agent with Tavus Avatar
100% powered by Google Gemini API (STT, LLM, TTS)
"""

import os
import json
from dotenv import load_dotenv

from livekit import agents
from livekit.plugins import tavus, google, silero

# Load environment variables
load_dotenv()


# Simplified Medical Context Functions
async def get_patient_context(patient_id: str) -> str:
    """Get complete patient context for the AI."""
    import asyncpg
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return "Erro: Database não configurado"
    
    try:
        conn = await asyncpg.connect(database_url)
        
        # Get patient info
        patient = await conn.fetchrow("""
            SELECT name, email, age, reported_symptoms, medical_history
            FROM patients WHERE id = $1
        """, patient_id)
        
        # Get recent exams
        exams = await conn.fetch("""
            SELECT type, status, diagnosis, created_at::text as date
            FROM exams 
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 3
        """, patient_id)
        
        # Get wellness plan
        wellness = await conn.fetchrow("""
            SELECT wellness_plan FROM patients WHERE id = $1
        """, patient_id)
        
        await conn.close()
        
        if not patient:
            return "Erro: Paciente não encontrado"
        
        # Build context
        context = f"""
INFORMAÇÕES DO PACIENTE:
- Nome: {patient['name']}
- Idade: {patient['age'] if patient['age'] else 'Não informada'} anos
- Sintomas Relatados: {patient['reported_symptoms'] if patient['reported_symptoms'] else 'Nenhum sintoma relatado'}
- Histórico Médico: {patient['medical_history'] if patient['medical_history'] else 'Não informado'}

EXAMES RECENTES ({len(exams)}):
"""
        
        for i, exam in enumerate(exams, 1):
            context += f"\n{i}. {exam['type']} - {exam['date']}"
            context += f"\n   Status: {exam['status']}"
            if exam['diagnosis']:
                context += f"\n   Diagnóstico: {exam['diagnosis']}"
            context += "\n"
        
        if wellness and wellness['wellness_plan']:
            wp = wellness['wellness_plan']
            context += f"\n\nPLANO DE BEM-ESTAR:"
            if wp.get('dietaryPlan'):
                context += f"\nDieta: {wp['dietaryPlan'][:200]}..."
            if wp.get('exercisePlan'):
                context += f"\nExercícios: {wp['exercisePlan'][:200]}..."
        
        return context
        
    except Exception as e:
        print(f"[ERROR] get_patient_context: {e}")
        return f"Erro ao carregar contexto: {str(e)}"


async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint - 100% Gemini AI with Tavus avatar."""
    
    await ctx.connect()
    
    # Get patient ID from room metadata
    room_metadata = ctx.room.metadata
    try:
        metadata = json.loads(room_metadata) if room_metadata else {}
        patient_id = metadata.get('patient_id')
    except:
        patient_id = None
    
    if not patient_id:
        print("[ERROR] No patient_id in room metadata")
        return
    
    print(f"[MediAI] 🎯 Starting 100% Gemini-powered agent for patient: {patient_id}")
    
    # Load patient context
    print(f"[MediAI] 📋 Loading patient context...")
    patient_context = await get_patient_context(patient_id)
    print(f"[MediAI] ✅ Patient context loaded ({len(patient_context)} chars)")
    
    # Define medical assistant instructions
    instructions = f"""Você é MediAI, uma assistente médica virtual especializada em triagem de pacientes e orientação de saúde.

PERSONALIDADE:
- Empática, calorosa e profissional
- Fala de forma clara e acessível em português brasileiro
- Tranquilizadora mas honesta
- Demonstra genuíno cuidado pelo bem-estar do paciente

DIRETRIZES IMPORTANTES:
1. NUNCA faça diagnósticos definitivos - você faz avaliação preliminar
2. SEMPRE sugira consulta médica presencial quando apropriado
3. Em casos de emergência, instrua o paciente a procurar atendimento IMEDIATO
4. Seja clara sobre suas limitações como assistente virtual
5. Mantenha tom profissional mas acolhedor

PROTOCOLO DE CONVERSA:
1. Cumprimente o paciente pelo nome de forma calorosa
2. Pergunte sobre o motivo da consulta de hoje
3. Investigue sintomas: quando começaram, intensidade, frequência
4. Relacione com histórico médico quando relevante
5. Ao final, resuma o que foi discutido e forneça orientações preliminares

CONTEXTO DO PACIENTE:
{patient_context}
"""
    
    print(f"[MediAI] 🤖 Creating Gemini AI agent...")
    
    # Create voice assistant with Google Gemini
    from livekit.agents import voice
    
    assistant = voice.Agent(
        instructions=instructions,
        vad=silero.VAD.load(),
        stt=google.STT(languages=["pt-BR"]),  # Gemini STT em português
        llm=google.LLM(model="gemini-2.0-flash-exp"),  # Gemini LLM
        tts=google.TTS(voice="pt-BR-Standard-A")  # Gemini TTS em português
    )
    
    # Initialize Tavus Avatar
    tavus_api_key = os.getenv('TAVUS_API_KEY')
    replica_id = os.getenv('TAVUS_REPLICA_ID')
    persona_id = os.getenv('TAVUS_PERSONA_ID')
    
    avatar_active = False
    
    if tavus_api_key and replica_id and persona_id:
        print("[MediAI] 🎭 Initializing Tavus avatar...")
        
        try:
            avatar = tavus.AvatarSession(
                replica_id=replica_id,
                persona_id=persona_id,
                avatar_participant_name="MediAI Assistant"
            )
            
            # Start avatar with the assistant
            await avatar.start(assistant, room=ctx.room)
            avatar_active = True
            print("[MediAI] ✅ Tavus avatar initialized successfully!")
            
        except Exception as e:
            print(f"[WARN] Failed to initialize Tavus avatar: {e}")
            print("[MediAI] Continuing without avatar (audio only)")
    else:
        print("[WARN] Tavus credentials incomplete:")
        print(f"  TAVUS_API_KEY: {'✓' if tavus_api_key else '✗'}")
        print(f"  TAVUS_REPLICA_ID: {'✓' if replica_id else '✗'}")
        print(f"  TAVUS_PERSONA_ID: {'✓' if persona_id else '✗'}")
        print("[MediAI] Running without avatar (audio only)")
    
    # Start the assistant
    print("[MediAI] 🎙️ Starting 100% Gemini voice session...")
    
    await assistant.start(ctx.room)
    
    print("[MediAI] ✅ Gemini agent session started successfully!")
    print(f"[MediAI] Avatar: {'🎭 ACTIVE' if avatar_active else '🔊 AUDIO ONLY'}")
    print(f"[MediAI] 🏥 Ready for patient consultation!")
    print(f"[MediAI] 🧠 Powered by: Google Gemini 2.0 Flash")
    print()


if __name__ == "__main__":
    # Run the agent
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=None
        )
    )
