"""
MediAI LiveKit Voice Agent with Tavus Avatar
Powered by 100% Gemini Live API (STT + LLM + TTS integrated)
Based on official LiveKit + Gemini Live example
"""

import logging
import json
import os
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli, RoomOutputOptions
from livekit.agents.voice import AgentSession
from livekit.plugins import tavus
from livekit.plugins.google import realtime

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

if 'GEMINI_API_KEY' in os.environ and 'GOOGLE_API_KEY' not in os.environ:
    os.environ['GOOGLE_API_KEY'] = os.environ['GEMINI_API_KEY']

logger = logging.getLogger("mediai-avatar")
logger.setLevel(logging.INFO)


async def get_patient_context(patient_id: str) -> str:
    """Get complete patient context for the AI."""
    import asyncpg
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return "Erro: Database não configurado"
    
    try:
        conn = await asyncpg.connect(database_url)
        
        patient = await conn.fetchrow("""
            SELECT name, email, age, reported_symptoms, doctor_notes, exam_results
            FROM patients WHERE id = $1
        """, patient_id)
        
        exams = await conn.fetch("""
            SELECT type, status, result, preliminary_diagnosis, created_at::text as date
            FROM exams 
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 3
        """, patient_id)
        
        wellness = await conn.fetchrow("""
            SELECT wellness_plan FROM patients WHERE id = $1
        """, patient_id)
        
        await conn.close()
        
        if not patient:
            return "Erro: Paciente não encontrado"
        
        context = f"""
INFORMAÇÕES DO PACIENTE:
- Nome: {patient['name']}
- Idade: {patient['age'] if patient['age'] else 'Não informada'} anos
- Sintomas Relatados: {patient['reported_symptoms'] if patient['reported_symptoms'] else 'Nenhum sintoma relatado'}
- Notas Médicas: {patient['doctor_notes'] if patient['doctor_notes'] else 'Não informado'}
- Resultados de Exames: {patient['exam_results'] if patient['exam_results'] else 'Não informado'}

EXAMES RECENTES ({len(exams)}):
"""
        
        for i, exam in enumerate(exams, 1):
            context += f"\n{i}. {exam['type']} - {exam['date']}"
            context += f"\n   Status: {exam['status']}"
            context += f"\n   Resultado: {exam['result']}"
            if exam['preliminary_diagnosis']:
                context += f"\n   Diagnóstico Preliminar: {exam['preliminary_diagnosis']}"
            context += "\n"
        
        if wellness and wellness['wellness_plan']:
            try:
                if isinstance(wellness['wellness_plan'], str):
                    import json
                    wp = json.loads(wellness['wellness_plan'])
                else:
                    wp = wellness['wellness_plan']
                    
                context += f"\n\nPLANO DE BEM-ESTAR:"
                if wp.get('dietaryPlan'):
                    context += f"\nDieta: {wp['dietaryPlan'][:200]}..."
                if wp.get('exercisePlan'):
                    context += f"\nExercícios: {wp['exercisePlan'][:200]}..."
            except:
                pass
        
        return context
        
    except Exception as e:
        logger.error(f"get_patient_context error: {e}")
        return f"Erro ao carregar contexto: {str(e)}"


async def entrypoint(ctx: JobContext):
    """Main entrypoint for the LiveKit agent with Tavus avatar."""
    
    await ctx.connect()
    
    room_metadata = ctx.room.metadata
    try:
        metadata = json.loads(room_metadata) if room_metadata else {}
        patient_id = metadata.get('patient_id')
    except:
        patient_id = None
    
    if not patient_id:
        logger.error("No patient_id in room metadata")
        return
    
    logger.info(f"[MediAI] 🎯 Starting agent for patient: {patient_id}")
    
    logger.info(f"[MediAI] 📋 Loading patient context...")
    patient_context = await get_patient_context(patient_id)
    logger.info(f"[MediAI] ✅ Patient context loaded ({len(patient_context)} chars)")
    
    logger.info(f"[MediAI] 🤖 Creating Gemini Live API model...")
    
    # Create Gemini Live API model with integrated STT + LLM + TTS
    model = realtime.RealtimeModel(
        model="gemini-2.0-flash-exp",
        voice="Aoede",  # Female voice (supports pt-BR)
        instructions=f"""Você é MediAI, uma assistente médica virtual especializada em triagem de pacientes e orientação de saúde.

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

IMPORTANTE: Mantenha suas respostas curtas e objetivas. Faça perguntas uma de cada vez e aguarde a resposta do paciente antes de continuar.

CONTEXTO DO PACIENTE:
{patient_context}
"""
    )
    
    logger.info(f"[MediAI] 🎙️ Creating agent session with Gemini Live API...")
    
    # Create AgentSession with integrated Gemini Live model
    session = AgentSession(
        model=model,
        # No separate STT/LLM/TTS needed - all integrated in RealtimeModel!
    )
    
    tavus_api_key = os.getenv('TAVUS_API_KEY')
    replica_id = os.getenv('TAVUS_REPLICA_ID')
    persona_id = os.getenv('TAVUS_PERSONA_ID')
    
    room_output_options = None
    
    if tavus_api_key and replica_id and persona_id:
        logger.info("[MediAI] 🎭 Initializing Tavus avatar...")
        
        try:
            avatar = tavus.AvatarSession(
                replica_id=replica_id,
                persona_id=persona_id,
                avatar_participant_name="MediAI Assistant"
            )
            
            logger.info("[MediAI] 🎥 Starting Tavus avatar session...")
            await avatar.start(session, room=ctx.room)
            
            room_output_options = RoomOutputOptions(audio_enabled=False)
            
            logger.info("[MediAI] ✅ Tavus avatar started successfully!")
            
        except Exception as e:
            logger.error(f"Failed to initialize Tavus avatar: {e}")
            logger.info("[MediAI] Continuing without avatar (audio only)")
    else:
        logger.warning("[WARN] Tavus credentials incomplete")
        logger.info("[MediAI] Running without avatar (audio only)")
    
    logger.info("[MediAI] 🏥 Starting medical consultation session...")
    
    await session.start(
        room=ctx.room,
        room_output_options=room_output_options
    )
    
    logger.info("[MediAI] ✅ Session started successfully!")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
