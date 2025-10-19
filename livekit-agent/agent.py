"""
MediAI LiveKit Voice Agent with Tavus Avatar
Medical AI assistant with access to patient history and Gemini AI capabilities.
Fully compatible with LiveKit Agents 1.2.15+ and Tavus plugins.
"""

import asyncio
import os
import json
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import Agent, AgentSession, RoomOutputOptions
from livekit.plugins import tavus, openai, silero

# Load environment variables
load_dotenv()


# Custom Medical Tools
async def get_patient_info(patient_id: str) -> dict:
    """Get patient basic information."""
    import os
    import asyncpg
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return {"error": "Database not configured"}
    
    try:
        conn = await asyncpg.connect(database_url)
        
        row = await conn.fetchrow("""
            SELECT name, email, age, reported_symptoms, medical_history
            FROM patients 
            WHERE id = $1
        """, patient_id)
        
        await conn.close()
        
        if row:
            return dict(row)
        return {"error": "Patient not found"}
    except Exception as e:
        print(f"[ERROR] get_patient_info: {e}")
        return {"error": str(e)}


async def get_patient_exams(patient_id: str, limit: int = 3) -> list:
    """Get patient's recent exams."""
    import os
    import asyncpg
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return []
    
    try:
        conn = await asyncpg.connect(database_url)
        
        rows = await conn.fetch("""
            SELECT type, status, diagnosis, created_at::text as date
            FROM exams 
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        """, patient_id, limit)
        
        await conn.close()
        
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[ERROR] get_patient_exams: {e}")
        return []


async def get_wellness_plan(patient_id: str) -> dict:
    """Get patient's wellness plan."""
    import os
    import asyncpg
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return {}
    
    try:
        conn = await asyncpg.connect(database_url)
        
        row = await conn.fetchrow("""
            SELECT wellness_plan
            FROM patients 
            WHERE id = $1
        """, patient_id)
        
        await conn.close()
        
        if row and row['wellness_plan']:
            return row['wellness_plan']
        return {}
    except Exception as e:
        print(f"[ERROR] get_wellness_plan: {e}")
        return {}


async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint for the LiveKit agent with Tavus avatar."""
    
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
    
    print(f"[MediAI] Starting agent for patient: {patient_id}")
    
    # Load patient context
    print(f"[MediAI] Loading patient context...")
    patient_info = await get_patient_info(patient_id)
    exams = await get_patient_exams(patient_id, limit=3)
    wellness = await get_wellness_plan(patient_id)
    
    # Build context
    patient_context = f"""
INFORMAÇÕES DO PACIENTE:
- Nome: {patient_info.get('name', 'Não informado')}
- Idade: {patient_info.get('age', 'Não informada')} anos
- Sintomas Relatados: {patient_info.get('reported_symptoms', 'Nenhum sintoma relatado')}
- Histórico Médico: {patient_info.get('medical_history', 'Não informado')}

EXAMES RECENTES ({len(exams)}):
"""
    
    for i, exam in enumerate(exams, 1):
        patient_context += f"\n{i}. {exam.get('type')} - {exam.get('date')}"\
                           f"\n   Status: {exam.get('status')}"\
                           f"\n   Diagnóstico: {exam.get('diagnosis', 'Não informado')}\n"
    
    if wellness:
        patient_context += f"\n\nPLANO DE BEM-ESTAR:"
        if wellness.get('dietaryPlan'):
            patient_context += f"\nDieta: {wellness['dietaryPlan'][:200]}..."
        if wellness.get('exercisePlan'):
            patient_context += f"\nExercícios: {wellness['exercisePlan'][:200]}..."
    
    print(f"[MediAI] Patient context loaded ({len(patient_context)} chars)")
    
    # Define medical assistant instructions
    instructions = f"""Você é MediAI, uma assistente médica virtual especializada em triagem de pacientes e orientação de saúde.

PERSONALIDADE:
- Empática, calorosa e profissional
- Fala de forma clara e acessível, evitando jargão médico excessivo
- Tranquilizadora, mas honesta
- Demonstra genuíno cuidado pelo bem-estar do paciente

DIRETRIZES IMPORTANTES:
1. NUNCA faça diagnósticos definitivos - você faz avaliação preliminar
2. SEMPRE sugira consulta médica presencial quando apropriado
3. Em casos de emergência (dor no peito, falta de ar severa, etc.), instrua o paciente a procurar atendimento IMEDIATO
4. Seja clara sobre suas limitações como assistente virtual
5. Mantenha tom profissional mas acolhedor

PROTOCOLO DE CONVERSA:
1. Cumprimente o paciente pelo nome
2. Pergunte sobre o motivo da consulta de hoje
3. Investigue sintomas: quando começaram, intensidade, frequência
4. Relacione com histórico médico quando relevante
5. Ao final, resuma o que foi discutido e forneça orientações preliminares

CONTEXTO DO PACIENTE ATUAL:
{patient_context}
"""
    
    # Create AI agent
    agent = Agent(instructions=instructions)
    
    # Create agent session with voice components
    # Using OpenAI providers for now (can be replaced with Gemini when available)
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=openai.STT(model="whisper-1", language="pt"),  # Portuguese
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(voice="nova")  # Female voice
    )
    
    # Initialize Tavus Avatar
    tavus_api_key = os.getenv('TAVUS_API_KEY')
    replica_id = os.getenv('TAVUS_REPLICA_ID')
    persona_id = os.getenv('TAVUS_PERSONA_ID')
    
    avatar_active = False
    
    if tavus_api_key and replica_id and persona_id:
        print("[MediAI] Initializing Tavus avatar...")
        
        try:
            avatar = tavus.AvatarSession(
                replica_id=replica_id,
                persona_id=persona_id,
                avatar_participant_name="MediAI Assistant"
            )
            
            # Start avatar session
            await avatar.start(session, room=ctx.room)
            avatar_active = True
            print("[MediAI] ✅ Tavus avatar initialized successfully!")
            
        except Exception as e:
            print(f"[WARN] Failed to initialize Tavus avatar: {e}")
            print("[MediAI] Continuing without avatar (audio only)")
    else:
        print("[WARN] Tavus credentials not found, running without avatar")
        print(f"  TAVUS_API_KEY: {'✓' if tavus_api_key else '✗'}")
        print(f"  TAVUS_REPLICA_ID: {'✓' if replica_id else '✗'}")
        print(f"  TAVUS_PERSONA_ID: {'✓' if persona_id else '✗'}")
    
    # Start the agent session
    print("[MediAI] Starting voice session...")
    
    room_output_options = None
    if avatar_active:
        # Avatar handles audio, disable agent audio
        room_output_options = RoomOutputOptions(audio_enabled=False)
    
    await session.start(
        agent=agent,
        room=ctx.room,
        room_output_options=room_output_options
    )
    
    print("[MediAI] ✅ Agent session started successfully!")
    print(f"[MediAI] Avatar: {'🎭 ACTIVE' if avatar_active else '🔊 AUDIO ONLY'}")
    print(f"[MediAI] Aguardando interação do paciente...")


if __name__ == "__main__":
    # Run the agent
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=None
        )
    )
