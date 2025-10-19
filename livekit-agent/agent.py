"""
MediAI LiveKit Voice Agent with Tavus Avatar
Medical AI assistant with access to patient history and Gemini AI capabilities.
"""

import asyncio
import os
from typing import Dict
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import voice, llm
from livekit.plugins import tavus

# Import custom Gemini providers
from gemini_provider import GeminiSTT, GeminiLLM, GeminiTTS

# Import medical tools
from medical_tools import (
    get_patient_info,
    get_patient_exams,
    get_consultation_history,
    get_wellness_plan,
    get_patient_full_context,
    get_wellness_summary
)

# Load environment variables
load_dotenv()


class MediAIAgent:
    """Medical AI Agent with Gemini and Tavus integration."""
    
    def __init__(self, patient_id: str):
        self.patient_id = patient_id
        self.patient_context = None
        self.session = None
        self.avatar_session = None
    
    async def load_patient_context(self):
        """Load complete patient medical context."""
        print(f"[MediAI] Loading context for patient: {self.patient_id}")
        
        # Get full patient context
        context = await get_patient_full_context(self.patient_id)
        wellness = await get_wellness_summary(self.patient_id)
        
        self.patient_context = f"{context}\n{wellness}"
        print(f"[MediAI] Patient context loaded ({len(self.patient_context)} chars)")
        
        return self.patient_context
    
    def get_instructions(self) -> str:
        """Generate system instructions for the medical AI assistant."""
        base_instructions = """Você é MediAI, uma assistente médica virtual especializada em triagem de pacientes e orientação de saúde.

PERSONALIDADE:
- Empática, calorosa e profissional
- Fala de forma clara e acessível, evitando jargão médico excessivo
- Tranquilizadora, mas honesta
- Demonstra genuíno cuidado pelo bem-estar do paciente

CAPACIDADES:
- Acesso completo ao histórico médico do paciente (exames, consultas anteriores)
- Conhecimento do plano de bem-estar atual do paciente
- Pode fazer perguntas de triagem detalhadas
- Pode sugerir exames ou consultas com especialistas

DIRETRIZES IMPORTANTES:
1. NUNCA faça diagnósticos definitivos - você faz avaliação preliminar
2. SEMPRE sugira consulta médica presencial quando apropriado
3. Em casos de emergência (dor no peito, falta de ar severa, etc.), instrua o paciente a procurar atendimento IMEDIATO
4. Seja clara sobre suas limitações como assistente virtual
5. Mantenha tom profissional mas acolhedor
6. Faça perguntas relevantes baseadas no histórico do paciente
7. Reforce o plano de bem-estar quando apropriado

PROTOCOLO DE CONVERSA:
1. Cumprimente o paciente pelo nome
2. Pergunte sobre o motivo da consulta de hoje
3. Investigue sintomas: quando começaram, intensidade, frequência
4. Relacione com histórico médico quando relevante
5. Faça perguntas de acompanhamento específicas
6. Ao final, resuma o que foi discutido
7. Forneça orientações preliminares
8. Sugira próximos passos (exames, consulta presencial, etc.)

CONTEXTO DO PACIENTE:
"""
        
        if self.patient_context:
            return base_instructions + "\n\n" + self.patient_context
        else:
            return base_instructions + "\n\nContexto do paciente ainda não carregado."
    
    @llm.ai_callable()
    async def get_latest_exams(self, limit: int = 3) -> str:
        """
        Buscar os últimos exames do paciente.
        
        Args:
            limit: Número de exames para retornar (padrão: 3)
        """
        exams = await get_patient_exams(self.patient_id, limit=limit)
        
        if not exams:
            return "Nenhum exame encontrado no histórico."
        
        result = f"Últimos {len(exams)} exames:\n\n"
        for i, exam in enumerate(exams, 1):
            result += f"{i}. {exam['type']} - {exam['date']}\n"
            result += f"   Status: {exam['status']}\n"
            if exam['diagnosis']:
                result += f"   Diagnóstico: {exam['diagnosis']}\n"
            result += "\n"
        
        return result
    
    @llm.ai_callable()
    async def get_patient_symptoms(self) -> str:
        """Buscar sintomas relatados pelo paciente no cadastro."""
        info = await get_patient_info(self.patient_id)
        
        if 'error' in info:
            return "Não foi possível acessar as informações do paciente."
        
        symptoms = info.get('reported_symptoms', 'Nenhum sintoma relatado previamente')
        return f"Sintomas relatados no cadastro: {symptoms}"
    
    @llm.ai_callable()
    async def check_wellness_plan(self) -> str:
        """Verificar o plano de bem-estar atual do paciente."""
        plan = await get_wellness_plan(self.patient_id)
        
        if not plan:
            return "Paciente ainda não possui um plano de bem-estar configurado."
        
        summary = "Plano de Bem-Estar Atual:\n\n"
        
        if plan.get('dietaryPlan'):
            summary += f"Dieta: {plan['dietaryPlan'][:300]}\n\n"
        
        if plan.get('exercisePlan'):
            summary += f"Exercícios: {plan['exercisePlan'][:300]}\n\n"
        
        return summary


async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint for the LiveKit agent."""
    
    # Get patient ID from room metadata
    await ctx.connect()
    room_metadata = ctx.room.metadata
    
    # Parse patient ID (you'll pass this from frontend)
    import json
    try:
        metadata = json.loads(room_metadata) if room_metadata else {}
        patient_id = metadata.get('patient_id')
    except:
        patient_id = None
    
    if not patient_id:
        print("[ERROR] No patient_id in room metadata")
        return
    
    print(f"[MediAI] Starting agent for patient: {patient_id}")
    
    # Initialize MediAI agent
    mediai = MediAIAgent(patient_id)
    await mediai.load_patient_context()
    
    # Create voice agent with Gemini providers
    agent = voice.Agent(
        instructions=mediai.get_instructions(),
        llm=GeminiLLM(
            model="gemini-2.0-flash-exp",
            instructions=mediai.get_instructions()
        ),
        tts=GeminiTTS(voice="Kore"),  # Female Portuguese voice
        stt=GeminiSTT(),
        
        # Register medical functions
        functions=[
            mediai.get_latest_exams,
            mediai.get_patient_symptoms,
            mediai.check_wellness_plan
        ]
    )
    
    # Initialize Tavus Avatar
    tavus_api_key = os.getenv('TAVUS_API_KEY')
    replica_id = os.getenv('TAVUS_REPLICA_ID')
    persona_id = os.getenv('TAVUS_PERSONA_ID')
    
    if tavus_api_key and replica_id:
        print("[MediAI] Initializing Tavus avatar...")
        
        avatar = tavus.AvatarSession(
            api_key=tavus_api_key,
            replica_id=replica_id,
            persona_id=persona_id,
            avatar_participant_name="MediAI Assistant"
        )
        
        # Start avatar session
        mediai.avatar_session = avatar
        await avatar.start(ctx.room)
        print("[MediAI] Tavus avatar initialized")
    else:
        print("[WARN] Tavus credentials not found, running without avatar")
    
    # Create agent session
    mediai.session = voice.AgentSession(
        agent=agent,
        allow_interruptions=True,
        min_endpointing_delay=0.5,
        preemptive_generation=False
    )
    
    # Start the session
    print("[MediAI] Starting voice session...")
    await mediai.session.start(
        ctx.room,
        room_output_options=rtc.RoomOutputOptions(
            audio_enabled=False  # Avatar handles audio
        ) if mediai.avatar_session else None
    )
    
    print("[MediAI] Agent session started successfully")
    
    # Keep agent running
    await mediai.session.wait_for_completion()
    print("[MediAI] Agent session completed")


if __name__ == "__main__":
    # Run the agent
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=None
        )
    )
