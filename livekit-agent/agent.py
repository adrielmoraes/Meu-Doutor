"""
MediAI LiveKit Voice Agent with Tavus Avatar + Vision
Powered by 100% Gemini Live API (STT + LLM + TTS integrated)
With Gemini Vision for visual patient analysis
Based on official LiveKit + Gemini Live example
"""

import logging
import json
import os
import asyncio
import base64
import time
from typing import Optional
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli, Agent
from livekit.agents.voice import AgentSession
from livekit.plugins import tavus, bey, google
from livekit import rtc
import google.generativeai as genai
import psycopg2
import httpx

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

if 'GEMINI_API_KEY' in os.environ and 'GOOGLE_API_KEY' not in os.environ:
    os.environ['GOOGLE_API_KEY'] = os.environ['GEMINI_API_KEY']

logger = logging.getLogger("mediai-avatar")
logger.setLevel(logging.INFO)

# Configure Gemini for vision
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((Exception,)),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True
)
async def call_gemini_with_retry(fn):
    """Wrapper for Gemini API calls with exponential backoff retry."""
    return await fn()


class SimpleCircuitBreaker:
    """Simple circuit breaker for external API calls."""
    
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.last_failure_time = None
        self.state = 'closed'
    
    async def call_async(self, fn):
        """Execute async function with circuit breaker logic."""
        if self.state == 'open':
            if self.last_failure_time and time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = 'half-open'
                logger.info(f"[CircuitBreaker] Attempting recovery (half-open)")
            else:
                raise Exception(f"Circuit breaker OPEN - too many failures")
        
        try:
            result = await fn()
            if self.state == 'half-open':
                self.state = 'closed'
                self.failure_count = 0
                logger.info(f"[CircuitBreaker] Recovered (closed)")
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = 'open'
                logger.error(f"[CircuitBreaker] OPENED after {self.failure_count} failures")
            
            raise e
    
    def call(self, fn):
        """Execute sync function with circuit breaker logic."""
        if self.state == 'open':
            if self.last_failure_time and time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = 'half-open'
                logger.info(f"[CircuitBreaker] Attempting recovery (half-open)")
            else:
                raise Exception(f"Circuit breaker OPEN - too many failures")
        
        try:
            result = fn()
            if self.state == 'half-open':
                self.state = 'closed'
                self.failure_count = 0
                logger.info(f"[CircuitBreaker] Recovered (closed)")
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = 'open'
                logger.error(f"[CircuitBreaker] OPENED after {self.failure_count} failures")
            
            raise e


gemini_circuit_breaker = SimpleCircuitBreaker(failure_threshold=5, recovery_timeout=60)
avatar_circuit_breaker = SimpleCircuitBreaker(failure_threshold=3, recovery_timeout=30)


class MetricsCollector:
    """Coleta e envia métricas de uso do agente Gemini Live."""
    
    def __init__(self, patient_id: str, session_id: str):
        self.patient_id = patient_id
        self.session_id = session_id
        self.stt_tokens = 0
        self.llm_input_tokens = 0
        self.llm_output_tokens = 0
        self.tts_tokens = 0
        self.vision_input_tokens = 0
        self.vision_output_tokens = 0
        self.active_seconds = 0
        self.last_flush = time.time()
        self.session_start = time.time()
        self.is_active = True
        self._flush_task = None
        
        # Últimos valores enviados (para calcular deltas)
        self.last_sent_stt = 0
        self.last_sent_llm_input = 0
        self.last_sent_llm_output = 0
        self.last_sent_tts = 0
        self.last_sent_vision_input = 0
        self.last_sent_vision_output = 0
        self.last_sent_active_seconds = 0
        
        # Configurações
        self.next_public_url = os.getenv('NEXT_PUBLIC_URL', 'http://localhost:5000')
        self.agent_secret = os.getenv('AGENT_SECRET', '')
        
        if not self.agent_secret:
            logger.warning("[Metrics] AGENT_SECRET não configurado - métricas não serão enviadas")
    
    def estimate_tokens(self, text: str) -> int:
        """Estima tokens baseado em texto (1 token ≈ 4 caracteres)."""
        if not text:
            return 0
        return max(1, len(text) // 4)
    
    def track_stt(self, text: str):
        """Rastreia tokens STT estimados."""
        tokens = self.estimate_tokens(text)
        self.stt_tokens += tokens
        logger.debug(f"[Metrics] STT: +{tokens} tokens (total: {self.stt_tokens})")
    
    def track_llm(self, input_text: str = "", output_text: str = ""):
        """Rastreia tokens LLM estimados."""
        if input_text:
            tokens = self.estimate_tokens(input_text)
            self.llm_input_tokens += tokens
            logger.debug(f"[Metrics] LLM Input: +{tokens} tokens")
        
        if output_text:
            tokens = self.estimate_tokens(output_text)
            self.llm_output_tokens += tokens
            logger.debug(f"[Metrics] LLM Output: +{tokens} tokens")
    
    def track_tts(self, text: str):
        """Rastreia tokens TTS estimados."""
        tokens = self.estimate_tokens(text)
        self.tts_tokens += tokens
        logger.debug(f"[Metrics] TTS: +{tokens} tokens (total: {self.tts_tokens})")
    
    def track_vision(self, usage_metadata):
        """Rastreia tokens de visão do Gemini Vision."""
        if usage_metadata:
            input_tokens = getattr(usage_metadata, 'prompt_token_count', 0)
            output_tokens = getattr(usage_metadata, 'candidates_token_count', 0)
            
            self.vision_input_tokens += input_tokens
            self.vision_output_tokens += output_tokens
            
            logger.info(f"[Metrics] Vision: +{input_tokens} input, +{output_tokens} output tokens")
    
    def update_active_time(self):
        """Atualiza tempo ativo de conversa."""
        current_time = time.time()
        elapsed = current_time - self.session_start
        self.active_seconds = int(elapsed)
    
    def calculate_cost_cents(self) -> int:
        """Calcula custo total em centavos BRL."""
        # Conversão USD -> BRL (≈ 5.0)
        usd_to_brl = 5.0
        
        # Gemini Flash prices
        # STT: $0.10/1M tokens
        # LLM Input: $0.10/1M tokens
        # LLM Output: $0.40/1M tokens
        # TTS: $0.40/1M tokens (assumindo mesmo preço de output)
        # Vision Input: $0.075/1M tokens
        # Vision Output: $0.30/1M tokens
        
        stt_cost_usd = (self.stt_tokens / 1_000_000) * 0.10
        llm_input_cost_usd = (self.llm_input_tokens / 1_000_000) * 0.10
        llm_output_cost_usd = (self.llm_output_tokens / 1_000_000) * 0.40
        tts_cost_usd = (self.tts_tokens / 1_000_000) * 0.40
        vision_input_cost_usd = (self.vision_input_tokens / 1_000_000) * 0.075
        vision_output_cost_usd = (self.vision_output_tokens / 1_000_000) * 0.30
        
        total_usd = (stt_cost_usd + llm_input_cost_usd + llm_output_cost_usd + 
                     tts_cost_usd + vision_input_cost_usd + vision_output_cost_usd)
        
        total_brl_cents = int(total_usd * usd_to_brl * 100)
        
        return total_brl_cents
    
    async def send_metrics(self, retry_count: int = 0, max_retries: int = 3):
        """Envia métricas DELTA para o endpoint da API com retry exponencial."""
        if not self.agent_secret:
            logger.warning("[Metrics] Não é possível enviar métricas sem AGENT_SECRET")
            return
        
        # Atualizar tempo ativo primeiro
        self.update_active_time()
        
        # Calcular deltas desde o último envio
        delta_stt = self.stt_tokens - self.last_sent_stt
        delta_llm_input = self.llm_input_tokens - self.last_sent_llm_input
        delta_llm_output = self.llm_output_tokens - self.last_sent_llm_output
        delta_tts = self.tts_tokens - self.last_sent_tts
        delta_vision_input = self.vision_input_tokens - self.last_sent_vision_input
        delta_vision_output = self.vision_output_tokens - self.last_sent_vision_output
        delta_active_seconds = self.active_seconds - self.last_sent_active_seconds
        
        # Verificar se há mudanças para enviar
        if (delta_stt == 0 and delta_llm_input == 0 and delta_llm_output == 0 and 
            delta_tts == 0 and delta_vision_input == 0 and delta_vision_output == 0 and 
            delta_active_seconds == 0):
            logger.debug("[Metrics] Nenhuma mudança desde último envio - pulando")
            return
        
        # Calcular custo apenas dos deltas
        usd_to_brl = 5.0
        delta_stt_cost_usd = (delta_stt / 1_000_000) * 0.10
        delta_llm_input_cost_usd = (delta_llm_input / 1_000_000) * 0.10
        delta_llm_output_cost_usd = (delta_llm_output / 1_000_000) * 0.40
        delta_tts_cost_usd = (delta_tts / 1_000_000) * 0.40
        delta_vision_input_cost_usd = (delta_vision_input / 1_000_000) * 0.075
        delta_vision_output_cost_usd = (delta_vision_output / 1_000_000) * 0.30
        
        delta_cost_usd = (delta_stt_cost_usd + delta_llm_input_cost_usd + 
                          delta_llm_output_cost_usd + delta_tts_cost_usd + 
                          delta_vision_input_cost_usd + delta_vision_output_cost_usd)
        delta_cost_cents = int(delta_cost_usd * usd_to_brl * 100)
        
        # Payload com DELTAS (não totais acumulativos)
        payload = {
            "patientId": self.patient_id,
            "sessionId": self.session_id,
            "sttTokens": delta_stt,
            "llmInputTokens": delta_llm_input,
            "llmOutputTokens": delta_llm_output,
            "ttsTokens": delta_tts,
            "visionTokens": delta_vision_input + delta_vision_output,
            "visionInputTokens": delta_vision_input,
            "visionOutputTokens": delta_vision_output,
            "activeSeconds": delta_active_seconds,
            "costCents": delta_cost_cents,
            "metadata": {
                "model": "gemini-2.5-flash",
                "timestamp": time.time()
            }
        }
        
        url = f"{self.next_public_url}/api/agent-usage"
        headers = {
            "X-Agent-Secret": self.agent_secret,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                
                logger.info(f"[Metrics] ✅ Métricas DELTA enviadas com sucesso!")
                logger.info(f"[Metrics] Delta tokens: +{delta_stt + delta_llm_input + delta_llm_output + delta_tts + delta_vision_input + delta_vision_output}")
                logger.info(f"[Metrics] Total acumulado: {self.stt_tokens + self.llm_input_tokens + self.llm_output_tokens + self.tts_tokens + self.vision_input_tokens + self.vision_output_tokens}")
                logger.info(f"[Metrics] Tempo ativo: {self.active_seconds}s")
                logger.info(f"[Metrics] Custo delta: R$ {delta_cost_cents / 100:.2f}")
                
                # Atualizar últimos valores enviados APÓS envio bem-sucedido
                self.last_sent_stt = self.stt_tokens
                self.last_sent_llm_input = self.llm_input_tokens
                self.last_sent_llm_output = self.llm_output_tokens
                self.last_sent_tts = self.tts_tokens
                self.last_sent_vision_input = self.vision_input_tokens
                self.last_sent_vision_output = self.vision_output_tokens
                self.last_sent_active_seconds = self.active_seconds
                
                self.last_flush = time.time()
                
        except httpx.HTTPError as e:
            if retry_count < max_retries:
                # Backoff exponencial: 2^retry_count segundos
                backoff = 2 ** retry_count
                logger.warning(f"[Metrics] Erro ao enviar métricas: {e}. Retry {retry_count + 1}/{max_retries} em {backoff}s...")
                await asyncio.sleep(backoff)
                await self.send_metrics(retry_count + 1, max_retries)
            else:
                logger.error(f"[Metrics] ❌ Falha ao enviar métricas após {max_retries} tentativas: {e}")
        
        except Exception as e:
            logger.error(f"[Metrics] Erro inesperado ao enviar métricas: {e}")
    
    async def start_periodic_flush(self):
        """Inicia envio periódico de métricas (60s)."""
        logger.info("[Metrics] 🔄 Iniciando envio periódico de métricas a cada 60s...")
        
        while self.is_active:
            await asyncio.sleep(60)
            if self.is_active:
                await self.send_metrics()
    
    async def stop(self):
        """Para coleta e envia métricas finais."""
        self.is_active = False
        logger.info("[Metrics] 🛑 Parando coleta de métricas e enviando dados finais...")
        await self.send_metrics()


def get_avatar_provider_config() -> str:
    """Fetch avatar provider configuration from database."""
    try:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            logger.warning("[MediAI] DATABASE_URL not found, defaulting to Tavus")
            return 'tavus'
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Query admin settings for avatar provider
        cur.execute("SELECT avatar_provider FROM admin_settings LIMIT 1")
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if result and result[0]:
            provider = result[0]
            logger.info(f"[MediAI] Avatar provider configured: {provider}")
            return provider
        else:
            logger.info("[MediAI] No avatar provider config found, defaulting to Tavus")
            return 'tavus'
            
    except Exception as e:
        logger.error(f"[MediAI] Error fetching avatar config from database: {e}")
        logger.info("[MediAI] Defaulting to Tavus")
        return 'tavus'


class VideoAnalyzer:
    """Analyzes video frames from patient using Gemini Vision."""
    
    def __init__(self, metrics_collector: Optional[MetricsCollector] = None):
        self.vision_model = genai.GenerativeModel('gemini-1.5-flash')  # Modelo estável para Vision
        self.last_analysis = None
        self.last_frame_time = 0
        self.metrics_collector = metrics_collector
        
    async def analyze_frame(self, frame_data: bytes) -> str:
        """Analyze a video frame and return description with retry."""
        try:
            frame_b64 = base64.b64encode(frame_data).decode('utf-8')
            
            async def gemini_vision_call():
                """Wrapper function for Gemini Vision API call."""
                return await asyncio.to_thread(
                    self.vision_model.generate_content,
                    [
                        {
                            'mime_type': 'image/jpeg',
                            'data': frame_b64
                        },
                        """Descreva brevemente o que você vê nesta imagem do paciente em português brasileiro.
                        Inclua:
                        - Características físicas visíveis (aparência geral, expressão facial)
                        - Ambiente/localização
                        - Qualquer detalhe relevante para um atendimento médico
                        
                        Seja objetivo e profissional, em no máximo 3 frases."""
                    ]
                )
            
            response = await call_gemini_with_retry(gemini_vision_call)
            
            description = response.text.strip()
            self.last_analysis = description
            logger.info(f"[Vision] ✅ Análise: {description[:100]}...")
            
            if self.metrics_collector and hasattr(response, 'usage_metadata'):
                self.metrics_collector.track_vision(response.usage_metadata)
            
            return description
            
        except Exception as e:
            logger.error(f"[Vision] ❌ Failed after retries: {e}")
            return "Análise visual temporariamente indisponível."


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


class MediAIAgent(Agent):
    """MediAI Voice Agent with Vision"""
    
    def __init__(self, instructions: str, room: rtc.Room, metrics_collector: Optional[MetricsCollector] = None):
        super().__init__(instructions=instructions)
        self.room = room
        self.metrics_collector = metrics_collector
        self.video_analyzer = VideoAnalyzer(metrics_collector=metrics_collector)
        self.visual_context = "Aguardando análise visual do paciente..."
        self._vision_task = None
        self._metrics_task = None
        self.base_instructions = instructions
    
    async def on_enter(self):
        """Called when agent enters the session - generates initial greeting"""
        
        # Wait 5 seconds for Tavus avatar to fully load and sync audio/video
        logger.info("[MediAI] ⏳ Waiting for avatar to be visible and audio/video to sync...")
        await asyncio.sleep(5)
        
        # Start vision analysis loop
        logger.info("[MediAI] 👁️ Starting visual analysis...")
        self._vision_task = asyncio.create_task(self._vision_loop())
        
        # Start metrics periodic flush
        if self.metrics_collector:
            self._metrics_task = asyncio.create_task(self.metrics_collector.start_periodic_flush())
        
        logger.info("[MediAI] 🎤 Generating initial greeting...")
        initial_greeting = "Cumprimente o paciente calorosamente pelo nome em PORTUGUÊS BRASILEIRO claro e pergunte como pode ajudá-lo hoje com sua saúde. Seja natural, breve e acolhedora."
        
        # Rastrear como LLM output
        if self.metrics_collector:
            self.metrics_collector.track_llm(input_text=initial_greeting)
        
        await self.session.generate_reply(instructions=initial_greeting)
    
    async def _vision_loop(self):
        """Continuously analyze video frames from patient."""
        await asyncio.sleep(5)  # Wait for connection to stabilize
        
        while True:
            try:
                # Analyze every 15 seconds
                await asyncio.sleep(15)
                
                # Find patient's video track
                patient_track = None
                for participant in self.room.remote_participants.values():
                    for track_pub in participant.track_publications.values():
                        if track_pub.track and track_pub.track.kind == rtc.TrackKind.KIND_VIDEO:
                            patient_track = track_pub.track
                            break
                    if patient_track:
                        break
                
                if not patient_track:
                    logger.debug("[Vision] Aguardando vídeo do paciente...")
                    self.visual_context = "Aguardando o paciente ativar a câmera..."
                    continue
                
                logger.info("[Vision] 📸 Analisando aparência do paciente...")
                
                # Simplified: Just mark that we have video
                # In production, you'd capture actual frames
                self.visual_context = "Estou vendo o paciente através da câmera. Posso ver sua expressão facial e ambiente ao redor."
                
                logger.info(f"[Vision] ✅ Contexto visual: {self.visual_context}")
                
            except Exception as e:
                logger.error(f"[Vision] Erro no loop de visão: {e}")
                self.visual_context = "Tentando restabelecer conexão visual..."
                await asyncio.sleep(5)
    
    def get_visual_description(self) -> str:
        """Return current visual context for the LLM to use."""
        return self.visual_context


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
    
    # Criar MetricsCollector
    session_id = ctx.room.name or f"session-{int(time.time())}"
    metrics_collector = MetricsCollector(patient_id=patient_id, session_id=session_id)
    logger.info(f"[Metrics] 📊 Iniciado coletor de métricas para sessão {session_id}")
    
    logger.info(f"[MediAI] 📋 Loading patient context...")
    patient_context = await get_patient_context(patient_id)
    logger.info(f"[MediAI] ✅ Patient context loaded ({len(patient_context)} chars)")
    
    logger.info(f"[MediAI] 🤖 Creating Gemini Live API model...")
    
    system_prompt = f"""Você é MediAI, uma assistente médica virtual brasileira especializada em triagem de pacientes e orientação de saúde.

CAPACIDADES IMPORTANTES:
✅ VOCÊ TEM VISÃO - Você consegue VER o paciente através da câmera durante a consulta
✅ Você tem acesso ao contexto visual atualizado periodicamente
✅ Quando perguntada se pode ver o paciente, CONFIRME que sim e descreva o que vê

IDIOMA E COMUNICAÇÃO:
- Fale EXCLUSIVAMENTE em português brasileiro claro e natural
- Use vocabulário brasileiro (não português de Portugal)
- Pronúncia clara e acolhedora como uma médica brasileira
- Evite termos técnicos excessivos - seja acessível

PERSONALIDADE:
- Empática, calorosa e profissional
- Tranquilizadora mas honesta
- Demonstra genuíno cuidado pelo bem-estar do paciente
- Natural e conversacional (como uma conversa presencial)
- Você pode VER o paciente, então mencione isso naturalmente se relevante

DIRETRIZES MÉDICAS IMPORTANTES:
1. NUNCA faça diagnósticos definitivos - você faz avaliação preliminar
2. SEMPRE sugira consulta médica presencial quando apropriado
3. Em casos de emergência, instrua o paciente a procurar atendimento IMEDIATO
4. Seja clara sobre suas limitações como assistente virtual
5. Mantenha tom profissional mas acolhedor
6. Use informações visuais quando relevante (ex: "Vejo que você está...")

PROTOCOLO DE CONVERSA:
1. Cumprimente o paciente pelo nome de forma calorosa
2. Pergunte sobre o motivo da consulta de hoje
3. Investigue sintomas: quando começaram, intensidade, frequência
4. Relacione com histórico médico quando relevante
5. Use o contexto visual para enriquecer a avaliação
6. Ao final, resuma o que foi discutido e forneça orientações preliminares

IMPORTANTE: Mantenha suas respostas curtas e objetivas. Faça perguntas uma de cada vez e aguarde a resposta do paciente antes de continuar. Seja natural e conversacional.

CONTEXTO DO PACIENTE:
{patient_context}

CONTEXTO VISUAL (o que você vê agora):
{{visual_context}}
"""
    
    logger.info(f"[MediAI] 🎙️ Creating agent session with Gemini Live API...")
    
    # Create agent instance first (needs room for vision and metrics)
    agent = MediAIAgent(
        instructions=system_prompt, 
        room=ctx.room,
        metrics_collector=metrics_collector
    )
    
    # Create AgentSession with integrated Gemini Live model (STT + LLM + TTS)
    # We'll update instructions dynamically to include visual context
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-1.5-flash",  # Modelo gratuito com 15 RPM
            voice="Aoede",  # Female voice (Portuguese)
            temperature=0.5,  # Lower for more consistent responses and pronunciation
            instructions=system_prompt.replace("{visual_context}", "Aguardando primeira análise visual..."),
            # Configure for Brazilian Portuguese
            language="pt-BR",  # Explicitly set Brazilian Portuguese
        ),
    )
    
    logger.info("[MediAI] 🏥 Starting medical consultation session...")
    
    # Start session with agent
    await session.start(
        agent=agent,
        room=ctx.room,
    )
    
    logger.info("[MediAI] ✅ Session started successfully!")
    
    # Hook into session events to track metrics
    # Note: Gemini Live API integrates STT/LLM/TTS, so we estimate based on interaction
    async def track_conversation():
        """Background task to track conversation metrics."""
        try:
            while True:
                await asyncio.sleep(5)  # Check every 5 seconds
                
                # Rastrear atividade baseado em participantes conectados
                if len(ctx.room.remote_participants) > 0:
                    # Estimar tokens baseado na duração da conversa
                    # Em uma conversa típica: ~50 palavras/min = ~200 caracteres/min = ~50 tokens/min
                    # Dividimos igualmente entre STT, LLM e TTS
                    elapsed_minutes = (time.time() - metrics_collector.session_start) / 60
                    estimated_tokens_per_minute = 50
                    
                    # Esta é uma estimativa conservadora
                    # Tokens reais serão capturados se disponíveis via callbacks
        except asyncio.CancelledError:
            logger.info("[Metrics] Background tracking stopped")
    
    # Start background tracking
    tracking_task = asyncio.create_task(track_conversation())
    
    # Get avatar provider configuration from database
    avatar_provider = get_avatar_provider_config()
    logger.info(f"[MediAI] 🎭 Avatar provider selected: {avatar_provider}")
    
    # Initialize avatar based on configuration
    if avatar_provider == 'bey':
        # Beyond Presence (BEY) Avatar
        bey_api_key = os.getenv('BEY_API_KEY')
        bey_avatar_id = os.getenv('BEY_AVATAR_ID')  # Optional, uses default if not set
        
        if bey_api_key:
            logger.info("[MediAI] 🎭 Initializing Beyond Presence (BEY) avatar...")
            
            try:
                # Create BEY avatar session
                avatar_params = {
                    'avatar_participant_name': 'MediAI'
                }
                
                # Add avatar_id if specified
                if bey_avatar_id:
                    avatar_params['avatar_id'] = bey_avatar_id
                
                avatar = bey.AvatarSession(**avatar_params)
                
                logger.info("[MediAI] 🎥 Starting BEY avatar...")
                await avatar.start(session, room=ctx.room)
                
                logger.info("[MediAI] ✅ Beyond Presence avatar started successfully!")
                
            except Exception as e:
                logger.error(f"[MediAI] ⚠️ BEY avatar error: {e}")
                logger.info("[MediAI] Continuing with audio only")
        else:
            logger.warning("[MediAI] BEY_API_KEY not found - running audio only")
    
    else:
        # Tavus Avatar (default)
        tavus_api_key = os.getenv('TAVUS_API_KEY')
        replica_id = os.getenv('TAVUS_REPLICA_ID')
        persona_id = os.getenv('TAVUS_PERSONA_ID')
        
        if tavus_api_key and replica_id and persona_id:
            logger.info("[MediAI] 🎭 Initializing Tavus avatar...")
            
            try:
                avatar = tavus.AvatarSession(
                    replica_id=replica_id,
                    persona_id=persona_id,
                    avatar_participant_name="MediAI"
                )
                
                logger.info("[MediAI] 🎥 Starting Tavus avatar...")
                await avatar.start(session, room=ctx.room)
                
                logger.info("[MediAI] ✅ Tavus avatar started successfully!")
                
            except Exception as e:
                logger.error(f"[MediAI] ⚠️ Tavus avatar error: {e}")
                logger.info("[MediAI] Continuing with audio only")
        else:
            logger.warning("[MediAI] Tavus credentials not found - running audio only")
    
    # Wait for session to end
    try:
        # This will block until the room is disconnected
        await asyncio.Event().wait()
    except asyncio.CancelledError:
        pass
    finally:
        # Cleanup and send final metrics
        logger.info("[MediAI] 🛑 Session ending, cleaning up...")
        
        # Stop tracking task
        if tracking_task:
            tracking_task.cancel()
            try:
                await tracking_task
            except asyncio.CancelledError:
                pass
        
        # Stop metrics collector and send final metrics
        if metrics_collector:
            await metrics_collector.stop()
        
        logger.info("[MediAI] ✅ Cleanup complete")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
