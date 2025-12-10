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
import io
import gc
from typing import Optional
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli, Agent, llm, function_tool, RunContext
from livekit.agents.voice import AgentSession
from livekit.plugins import tavus, bey, google
from livekit import rtc
from livekit.rtc import VideoBufferType
import google.generativeai as genai
from google.genai import types
import httpx

# Note: PIL is optional - vision can work without it using base64 raw frames
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    Image = None

from tenacity import (retry, stop_after_attempt, wait_exponential,
                      retry_if_exception_type, before_sleep_log)

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

# Fail-fast validation: Check critical environment variables before starting
# Note: Only GEMINI_API_KEY is truly required; DATABASE_URL is optional (agent can run without metrics)
required_vars = ['GEMINI_API_KEY']
missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    raise RuntimeError(
        f"CRITICAL: Missing required environment variables: {', '.join(missing)}"
    )

if 'GEMINI_API_KEY' in os.environ and 'GOOGLE_API_KEY' not in os.environ:
    os.environ['GOOGLE_API_KEY'] = os.environ['GEMINI_API_KEY']

logger = logging.getLogger("mediai-avatar")
logger.setLevel(logging.INFO)

# Configure Gemini for vision
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# API configuration for agent tools
NEXT_PUBLIC_URL = os.getenv('NEXT_PUBLIC_BASE_URL') or os.getenv(
    'NEXT_PUBLIC_URL', 'http://localhost:5000')
AGENT_SECRET = os.getenv('AGENT_SECRET', '')

if not AGENT_SECRET:
    logger.warning(
        "[AI Tools] ⚠️ AGENT_SECRET não configurado - funcionalidades de agendamento desabilitadas"
    )
else:
    logger.info(f"[AI Tools] ✅ API configurada: {NEXT_PUBLIC_URL}")

_current_agent_instance: Optional['MediAIAgent'] = None


@retry(stop=stop_after_attempt(3),
       wait=wait_exponential(multiplier=1, min=1, max=10),
       retry=retry_if_exception_type((Exception, )),
       before_sleep=before_sleep_log(logger, logging.WARNING),
       reraise=True)
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
            if self.last_failure_time and time.time(
            ) - self.last_failure_time > self.recovery_timeout:
                self.state = 'half-open'
                logger.info(
                    f"[CircuitBreaker] Attempting recovery (half-open)")
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
                logger.error(
                    f"[CircuitBreaker] OPENED after {self.failure_count} failures"
                )

            raise e

    def call(self, fn):
        """Execute sync function with circuit breaker logic."""
        if self.state == 'open':
            if self.last_failure_time and time.time(
            ) - self.last_failure_time > self.recovery_timeout:
                self.state = 'half-open'
                logger.info(
                    f"[CircuitBreaker] Attempting recovery (half-open)")
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
                logger.error(
                    f"[CircuitBreaker] OPENED after {self.failure_count} failures"
                )

            raise e


gemini_circuit_breaker = SimpleCircuitBreaker(failure_threshold=5,
                                              recovery_timeout=60)
avatar_circuit_breaker = SimpleCircuitBreaker(failure_threshold=3,
                                              recovery_timeout=30)


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
        
        # Avatar tracking (custo separado do Gemini)
        self.avatar_provider = None  # 'bey' ou 'tavus'
        self.avatar_start_time = None
        self.avatar_seconds = 0

        # Últimos valores enviados (para calcular deltas)
        self.last_sent_stt = 0
        self.last_sent_llm_input = 0
        self.last_sent_llm_output = 0
        self.last_sent_tts = 0
        self.last_sent_vision_input = 0
        self.last_sent_vision_output = 0
        self.last_sent_active_seconds = 0
        self.last_sent_avatar_seconds = 0

        # Configurações
        self.next_public_url = os.getenv('NEXT_PUBLIC_BASE_URL') or os.getenv(
            'NEXT_PUBLIC_URL', 'http://localhost:5000')
        self.agent_secret = os.getenv('AGENT_SECRET', '')

        if not self.agent_secret:
            logger.warning(
                "[Metrics] AGENT_SECRET não configurado - métricas não serão enviadas"
            )

    def estimate_tokens(self, text: str) -> int:
        """
        Estima tokens com mais precisão que antes.
        UPDATED: Usar ~3.2 chars per token (mais preciso que 4).
        Para contagem REAL, usar track_actual_tokens() com resposta da API.
        """
        if not text:
            return 0
        # Melhorado: 3.2 chars por token (melhor que 4)
        return max(1, int(len(text) / 3.2))

    def track_actual_tokens(self, usage_metadata):
        """
        Extrai tokens REAIS da resposta do Gemini Live API.
        CRÍTICO: Usar isso ao invés de estimar quando possível.
        """
        if not usage_metadata:
            return False
        
        try:
            # Gemini Live API retorna tokens reais na resposta
            input_tokens = getattr(usage_metadata, 'prompt_token_count', None)
            output_tokens = getattr(usage_metadata, 'candidates_token_count', None)
            
            if input_tokens is not None:
                self.llm_input_tokens += input_tokens
                logger.info(
                    f"[Metrics] ✅ REAL LLM Input tokens: +{input_tokens} (total: {self.llm_input_tokens})"
                )
            
            if output_tokens is not None:
                self.llm_output_tokens += output_tokens
                logger.info(
                    f"[Metrics] ✅ REAL LLM Output tokens: +{output_tokens} (total: {self.llm_output_tokens})"
                )
            
            return True
        except Exception as e:
            logger.warning(f"[Metrics] Erro ao extrair tokens reais: {e}")
            return False

    def track_stt(self, text: str):
        """Rastreia tokens STT estimados."""
        tokens = self.estimate_tokens(text)
        self.stt_tokens += tokens
        logger.debug(
            f"[Metrics] STT: +{tokens} tokens (total: {self.stt_tokens})")

    def track_stt_audio(self, duration_seconds: float):
        """
        Rastreia tokens STT baseado em duração de áudio.
        UPDATED: 180 tokens/segundo (antes era 25 = 85% subestimação)
        """
        # Gemini 2.5 Flash Native Audio: ~180 tokens per second
        tokens = int(duration_seconds * 180)
        self.stt_tokens += tokens
        logger.info(
            f"[Metrics] STT (audio): +{tokens} tokens for {duration_seconds:.1f}s (total: {self.stt_tokens})"
        )

    def track_llm(self, input_text: str = "", output_text: str = ""):
        """Rastreia tokens LLM estimados. DEPRECATED: use track_actual_tokens quando possível."""
        if input_text:
            tokens = self.estimate_tokens(input_text)
            self.llm_input_tokens += tokens
            logger.debug(f"[Metrics] LLM Input: +{tokens} tokens (estimated)")

        if output_text:
            tokens = self.estimate_tokens(output_text)
            self.llm_output_tokens += tokens
            logger.debug(f"[Metrics] LLM Output: +{tokens} tokens (estimated)")

    def track_tts(self, text: str):
        """Rastreia tokens TTS estimados."""
        tokens = self.estimate_tokens(text)
        self.tts_tokens += tokens
        logger.debug(
            f"[Metrics] TTS (text): +{tokens} tokens (total: {self.tts_tokens})")

    def track_tts_audio(self, duration_seconds: float):
        """
        Rastreia tokens TTS baseado em duração de áudio.
        UPDATED: 50 tokens/segundo (antes era 25 = 50% subestimação)
        TTS output audio: ~45-60 tokens per second
        """
        tokens = int(duration_seconds * 50)
        self.tts_tokens += tokens
        logger.info(
            f"[Metrics] TTS (audio): +{tokens} tokens for {duration_seconds:.1f}s (total: {self.tts_tokens})"
        )

    def track_vision(self, usage_metadata):
        """Rastreia tokens de visão do Gemini Vision - EXTRAI VALORES REAIS."""
        if not usage_metadata:
            return
            
        try:
            input_tokens = getattr(usage_metadata, 'prompt_token_count', 0)
            output_tokens = getattr(usage_metadata, 'candidates_token_count', 0)

            if input_tokens > 0:
                self.vision_input_tokens += input_tokens
            if output_tokens > 0:
                self.vision_output_tokens += output_tokens

            logger.info(
                f"[Metrics] Vision: +{input_tokens} input, +{output_tokens} output tokens (total: {self.vision_input_tokens + self.vision_output_tokens})"
            )
        except Exception as e:
            logger.warning(f"[Metrics] Erro ao rastrear vision tokens: {e}")

    def update_active_time(self):
        """Atualiza tempo ativo de conversa (exclui tempo de avatar)."""
        current_time = time.time()
        total_elapsed = current_time - self.session_start
        
        # Atualiza tempo do avatar se estiver ativo
        if self.avatar_start_time:
            self.avatar_seconds = int(current_time - self.avatar_start_time)
        
        # active_seconds = tempo total - tempo do avatar (são mutuamente exclusivos)
        # Isso evita dupla contagem no custo
        self.active_seconds = max(0, int(total_elapsed) - self.avatar_seconds)

    def start_avatar_tracking(self, provider: str):
        """Inicia rastreamento do tempo de avatar."""
        self.avatar_provider = provider.lower()  # 'bey' ou 'tavus'
        self.avatar_start_time = time.time()
        logger.info(f"[Metrics] Avatar tracking started: {provider}")

    def stop_avatar_tracking(self):
        """Para rastreamento do avatar."""
        if self.avatar_start_time:
            self.avatar_seconds = int(time.time() - self.avatar_start_time)
            logger.info(f"[Metrics] Avatar tracking stopped: {self.avatar_seconds}s total")
        self.avatar_start_time = None

    def calculate_cost_cents(self) -> int:
        """Calcula custo total em centavos BRL (Gemini + Avatar)."""
        # Conversão USD -> BRL (atualizado: R$5,42 por $1 USD)
        usd_to_brl = 5.42

        # ========================================
        # GEMINI 2.5 Flash Native Audio (Live API) 
        # Official Pricing Dec 2025 (Updated from Google AI Studio)
        # https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-native-audio
        # ========================================
        # Text Input: $0.50/1M tokens
        # Text Output: $12.00/1M tokens
        # Audio/Video Input (STT): $3.00/1M tokens
        # Audio/Video Output (TTS): $2.00/1M tokens
        # Vision/Image Input: $0.50/1M tokens (same as text for native audio)
        # Vision Output: $12.00/1M tokens (same as text for native audio)

        stt_cost_usd = (self.stt_tokens / 1_000_000) * 3.00       # Audio/Video input
        llm_input_cost_usd = (self.llm_input_tokens / 1_000_000) * 0.50    # Text input
        llm_output_cost_usd = (self.llm_output_tokens / 1_000_000) * 12.00  # Text output
        tts_cost_usd = (self.tts_tokens / 1_000_000) * 2.00       # Audio/Video output
        vision_input_cost_usd = (self.vision_input_tokens / 1_000_000) * 0.50  # Same as text input
        vision_output_cost_usd = (self.vision_output_tokens / 1_000_000) * 12.00  # Same as text output

        gemini_total_usd = (stt_cost_usd + llm_input_cost_usd + llm_output_cost_usd +
                           tts_cost_usd + vision_input_cost_usd +
                           vision_output_cost_usd)

        # ========================================
        # AVATAR COST (adicional, cobrado por minuto)
        # ========================================
        # BeyondPresence (BEY): $0.17/minuto (fixo)
        # Tavus CVI: $0.10/minuto (estimado)
        
        avatar_minutes = self.avatar_seconds / 60.0
        if self.avatar_provider == 'bey':
            avatar_cost_usd = avatar_minutes * 0.17  # BeyondPresence (fixo)
        elif self.avatar_provider == 'tavus':
            avatar_cost_usd = avatar_minutes * 0.10   # Tavus (estimado)
        else:
            avatar_cost_usd = 0.0

        total_usd = gemini_total_usd + avatar_cost_usd
        total_brl_cents = int(total_usd * usd_to_brl * 100)

        return total_brl_cents

    async def send_metrics(self, retry_count: int = 0, max_retries: int = 3):
        """Envia métricas DELTA para o endpoint da API com retry exponencial."""
        if not self.agent_secret:
            logger.warning(
                "[Metrics] Não é possível enviar métricas sem AGENT_SECRET")
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
        delta_avatar_seconds = self.avatar_seconds - self.last_sent_avatar_seconds

        # Verificar se há mudanças para enviar
        if (delta_stt == 0 and delta_llm_input == 0 and delta_llm_output == 0
                and delta_tts == 0 and delta_vision_input == 0
                and delta_vision_output == 0 and delta_active_seconds == 0
                and delta_avatar_seconds == 0):
            logger.debug(
                "[Metrics] Nenhuma mudança desde último envio - pulando")
            return

        # ========================================
        # Calcular custo Gemini (Gemini 2.5 Flash Native Audio - Dec 2025 Updated)
        # ========================================
        usd_to_brl = 5.42  # R$5,42 por $1 USD
        delta_stt_cost_usd = (delta_stt / 1_000_000) * 3.00       # Audio/Video input: $3.00/1M
        delta_llm_input_cost_usd = (delta_llm_input / 1_000_000) * 0.50    # Text input: $0.50/1M
        delta_llm_output_cost_usd = (delta_llm_output / 1_000_000) * 12.00  # Text output: $12.00/1M
        delta_tts_cost_usd = (delta_tts / 1_000_000) * 2.00       # Audio/Video output: $2.00/1M
        delta_vision_input_cost_usd = (delta_vision_input / 1_000_000) * 0.50  # Image: $0.50/1M
        delta_vision_output_cost_usd = (delta_vision_output / 1_000_000) * 12.00  # Vision: $12.00/1M

        delta_gemini_cost_usd = (delta_stt_cost_usd + delta_llm_input_cost_usd +
                                 delta_llm_output_cost_usd + delta_tts_cost_usd +
                                 delta_vision_input_cost_usd +
                                 delta_vision_output_cost_usd)

        # ========================================
        # Calcular custo Avatar (separado, cobrado por minuto)
        # ========================================
        # BeyondPresence (BEY): $0.17/minuto (fixo)
        # Tavus CVI: $0.10/minuto (estimado)
        delta_avatar_minutes = delta_avatar_seconds / 60.0
        if self.avatar_provider == 'bey':
            delta_avatar_cost_usd = delta_avatar_minutes * 0.17  # BeyondPresence (fixo)
        elif self.avatar_provider == 'tavus':
            delta_avatar_cost_usd = delta_avatar_minutes * 0.10
        else:
            delta_avatar_cost_usd = 0.0

        delta_cost_usd = delta_gemini_cost_usd + delta_avatar_cost_usd
        delta_cost_cents = int(delta_cost_usd * usd_to_brl * 100)

        # Payload com DELTAS (não totais acumulativos)
        # Map avatar provider names to expected enum values
        avatar_provider_map = {
            'bey': 'beyondpresence',
            'tavus': 'tavus',
            'beyondpresence': 'beyondpresence'
        }
        api_avatar_provider = avatar_provider_map.get(self.avatar_provider, 'beyondpresence')
        
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
            "avatarSeconds": delta_avatar_seconds,
            "avatarProvider": api_avatar_provider,
            "costCents": delta_cost_cents,
            "metadata": {
                "model": "gemini-2.5-flash",
                "avatarProvider": self.avatar_provider,
                "timestamp": time.time()
            }
        }

        url = f"{self.next_public_url}/api/agent-usage"
        headers = {
            "x-agent-secret": self.agent_secret,
            "content-type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url,
                                             json=payload,
                                             headers=headers)
                response.raise_for_status()

                logger.info(
                    f"[Metrics] ✅ Métricas DELTA enviadas com sucesso!")
                logger.info(
                    f"[Metrics] Delta tokens: +{delta_stt + delta_llm_input + delta_llm_output + delta_tts + delta_vision_input + delta_vision_output}"
                )
                logger.info(
                    f"[Metrics] Total acumulado: {self.stt_tokens + self.llm_input_tokens + self.llm_output_tokens + self.tts_tokens + self.vision_input_tokens + self.vision_output_tokens}"
                )
                logger.info(f"[Metrics] Tempo ativo: {self.active_seconds}s")
                logger.info(
                    f"[Metrics] Custo delta: R$ {delta_cost_cents / 100:.2f}")

                # Atualizar últimos valores enviados APÓS envio bem-sucedido
                self.last_sent_stt = self.stt_tokens
                self.last_sent_llm_input = self.llm_input_tokens
                self.last_sent_llm_output = self.llm_output_tokens
                self.last_sent_tts = self.tts_tokens
                self.last_sent_vision_input = self.vision_input_tokens
                self.last_sent_vision_output = self.vision_output_tokens
                self.last_sent_active_seconds = self.active_seconds
                self.last_sent_avatar_seconds = self.avatar_seconds

                self.last_flush = time.time()

        except httpx.HTTPError as e:
            if retry_count < max_retries:
                # Backoff exponencial: 2^retry_count segundos
                backoff = 2**retry_count
                logger.warning(
                    f"[Metrics] Erro ao enviar métricas: {e}. Retry {retry_count + 1}/{max_retries} em {backoff}s..."
                )
                await asyncio.sleep(backoff)
                await self.send_metrics(retry_count + 1, max_retries)
            else:
                logger.error(
                    f"[Metrics] ❌ Falha ao enviar métricas após {max_retries} tentativas: {e}"
                )

        except Exception as e:
            logger.error(f"[Metrics] Erro inesperado ao enviar métricas: {e}")

    async def start_periodic_flush(self):
        """Inicia envio periódico de métricas (60s)."""
        logger.info(
            "[Metrics] 🔄 Iniciando envio periódico de métricas a cada 60s...")

        while self.is_active:
            await asyncio.sleep(60)
            if self.is_active:
                await self.send_metrics()

    async def stop(self):
        """Para coleta e envia métricas finais."""
        self.is_active = False
        logger.info(
            "[Metrics] 🛑 Parando coleta de métricas e enviando dados finais..."
        )
        await self.send_metrics()


async def get_avatar_provider_config(pool) -> str:
    """Fetch avatar provider configuration from database using connection pool.
    
    Args:
        pool: asyncpg connection pool (shared across all operations)
    """
    if not pool:
        logger.warning(
            "[MediAI] No database pool available, defaulting to Tavus")
        return 'tavus'

    try:
        async with pool.acquire() as conn:
            # Query admin settings for avatar provider
            result = await conn.fetchrow(
                "SELECT avatar_provider FROM admin_settings LIMIT 1")

            if result and result['avatar_provider']:
                provider = result['avatar_provider']
                logger.info(f"[MediAI] Avatar provider configured: {provider}")
                return provider
            else:
                logger.info(
                    "[MediAI] No avatar provider config found, defaulting to Tavus"
                )
                return 'tavus'

    except Exception as e:
        logger.error(
            f"[MediAI] Error fetching avatar config from database: {e}")
        logger.info("[MediAI] Defaulting to Tavus")
        return 'tavus'


# =========================================
# FUNCTION TOOLS - LiveKit Official Pattern
# =========================================
# Seguindo padrão oficial: https://docs.livekit.io/agents/build/tools/


async def get_patient_context(pool, patient_id: str) -> str:
    """Get complete patient context for the AI.
    
    Args:
        pool: asyncpg connection pool (shared across all operations)
        patient_id: Patient ID to fetch context for
    """
    if not pool:
        logger.warning("[MediAI] No database pool - returning default context")
        return "Paciente não identificado no banco de dados. Pergunte o nome do paciente."

    try:
        logger.info(f"[MediAI] 🔍 Acquiring database connection for patient {patient_id}...")
        
        # Add timeout to prevent hanging
        async with asyncio.timeout(15):
            async with pool.acquire() as conn:
                logger.info("[MediAI] ✅ Database connection acquired")
                
                patient = await conn.fetchrow(
                    """
                    SELECT name, email, age, reported_symptoms, doctor_notes, exam_results
                    FROM patients WHERE id = $1
                    """, patient_id)

                logger.info(f"[MediAI] 📋 Patient query result: {patient is not None}")

                exams = await conn.fetch(
                    """
                    SELECT type, status, result, preliminary_diagnosis, created_at::text as date
                    FROM exams 
                    WHERE patient_id = $1
                    ORDER BY created_at DESC
                    LIMIT 3
                    """, patient_id)

                wellness = await conn.fetchrow(
                    """
                    SELECT wellness_plan FROM patients WHERE id = $1
                    """, patient_id)

                if not patient:
                    logger.warning(f"[MediAI] ⚠️ Patient not found: {patient_id}")
                    return "Paciente não encontrado no sistema. Pergunte o nome do paciente."

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

                logger.info(f"[MediAI] ✅ Patient context built: {len(context)} chars")
                return context

    except asyncio.TimeoutError:
        logger.error(f"[MediAI] ⏱️ Database query timeout for patient {patient_id}")
        return "Erro de timeout ao carregar dados. Pergunte o nome do paciente."
        
    except Exception as e:
        logger.error(f"[MediAI] ❌ get_patient_context error: {e}")
        return f"Erro ao carregar contexto: {str(e)}"


async def _search_doctors_impl(specialty: str = None, limit: int = 5) -> dict:
    """
    Implementação da busca de médicos disponíveis na plataforma.
    IMPORTANTE: Esta função retorna médicos REAIS do banco de dados - NUNCA invente nomes!
    
    Args:
        specialty: Especialidade médica (ex: "Cardiologia", "Pediatria", etc.)
        limit: Número máximo de médicos a retornar (padrão: 5, máximo: 20)
    
    Returns:
        Lista de médicos com informações relevantes
    """
    if not AGENT_SECRET:
        logger.warning(
            "[AI Tools] Cannot search doctors - AGENT_SECRET not configured")
        return {
            "success": False,
            "error": "Configuração ausente",
            "doctors": []
        }

    try:
        async with httpx.AsyncClient() as client:
            url = f"{NEXT_PUBLIC_URL}/api/ai-agent/doctors"
            params = {"limit": str(limit)}
            if specialty:
                params["specialty"] = specialty

            # Header padronizado em minúsculas para compatibilidade com Next.js
            headers = {
                "x-agent-secret": AGENT_SECRET,
                "Content-Type": "application/json"
            }

            logger.info(
                f"[AI Tools] Buscando médicos: {url} (especialidade={specialty})"
            )
            logger.info(
                f"[AI Tools] Headers: x-agent-secret presente: {bool(AGENT_SECRET)}"
            )

            response = await client.get(url,
                                        params=params,
                                        headers=headers,
                                        timeout=10.0)
            response.raise_for_status()

            data = response.json()
            logger.info(
                f"[AI Tools] ✅ Encontrados {data.get('count', 0)} médicos")
            return data

    except httpx.HTTPStatusError as e:
        logger.error(
            f"[AI Tools] ❌ HTTP Error {e.response.status_code}: {e.response.text}"
        )
        return {
            "success": False,
            "error": f"HTTP {e.response.status_code}",
            "doctors": []
        }
    except Exception as e:
        logger.error(f"[AI Tools] ❌ Erro ao buscar médicos: {e}")
        return {"success": False, "error": str(e), "doctors": []}


def _is_valid_uuid(value: str) -> bool:
    """Verifica se uma string é um UUID válido."""
    import re
    uuid_pattern = re.compile(
        r'^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
    )
    return bool(uuid_pattern.match(value))


def _normalize_doctor_name(name: str) -> str:
    """
    Normaliza o nome do médico removendo prefixos e variações.
    
    Trata: "Dr.", "Dr", "Dra.", "Dra", "Doutor", "Doutora", "Doctor" etc.
    """
    import re

    normalized = name.lower().strip()

    prefixes = [
        r'\bdra?\.\s*',
        r'\bdra?\s+',
        r'\bdoutor[a]?\s*',
        r'\bdoctor\s*',
    ]

    for prefix in prefixes:
        normalized = re.sub(prefix, '', normalized, flags=re.IGNORECASE)

    normalized = re.sub(r'\s+', ' ', normalized).strip()

    return normalized


async def _resolve_doctor_id(doctor_name_or_id: str) -> tuple[str, str]:
    """
    Resolve o nome do médico para seu ID real.
    
    Args:
        doctor_name_or_id: Nome do médico (ex: "Mizael", "Dr. Mizael", "Dr Mizael") ou ID UUID
        
    Returns:
        Tuple (doctor_id, doctor_name) ou (None, error_message)
    """
    if _is_valid_uuid(doctor_name_or_id):
        return (doctor_name_or_id, None)

    logger.info(
        f"[AI Tools] Resolvendo nome do médico '{doctor_name_or_id}' para ID..."
    )

    search_name = _normalize_doctor_name(doctor_name_or_id)

    if len(search_name) < 3:
        logger.warning(
            f"[AI Tools] Nome muito curto ou apenas prefixo: '{doctor_name_or_id}'"
        )
        return (
            None,
            "Por favor, informe o nome do médico. Exemplo: 'Dr. Mizael' ou apenas 'Mizael'."
        )

    result = await _search_doctors_impl(specialty=None, limit=50)

    if not result.get('doctors'):
        return (None, "Não encontrei médicos cadastrados no sistema.")

    logger.info(f"[AI Tools] Nome normalizado para busca: '{search_name}'")

    for doctor in result['doctors']:
        db_name = _normalize_doctor_name(doctor.get('name', ''))

        if search_name in db_name or db_name in search_name:
            doctor_id = doctor.get('id')
            doctor_full_name = doctor.get('name')
            logger.info(
                f"[AI Tools] ✅ Encontrado: {doctor_full_name} (ID: {doctor_id})"
            )
            return (doctor_id, doctor_full_name)

        search_parts = search_name.split()
        db_parts = db_name.split()
        for s_part in search_parts:
            for d_part in db_parts:
                if len(s_part) >= 3 and len(d_part) >= 3:
                    if s_part in d_part or d_part in s_part:
                        doctor_id = doctor.get('id')
                        doctor_full_name = doctor.get('name')
                        logger.info(
                            f"[AI Tools] ✅ Encontrado (parcial): {doctor_full_name} (ID: {doctor_id})"
                        )
                        return (doctor_id, doctor_full_name)

    available_names = [d.get('name') for d in result['doctors']]
    logger.warning(
        f"[AI Tools] ❌ Médico '{doctor_name_or_id}' não encontrado. Disponíveis: {available_names}"
    )
    return (
        None,
        f"Não encontrei o médico '{doctor_name_or_id}' no sistema. Médicos disponíveis: {', '.join(available_names[:5])}"
    )


async def _get_available_slots_impl(doctor_id: str, date: str) -> dict:
    """
    Busca horários disponíveis de um médico para uma data específica.
    Use esta função após o paciente escolher um médico e antes de agendar.
    
    Args:
        doctor_id: ID do médico escolhido OU nome do médico (será resolvido automaticamente)
        date: Data desejada no formato YYYY-MM-DD (ex: 2025-11-20)
    
    Returns:
        Lista de horários disponíveis
    """
    if not AGENT_SECRET:
        logger.warning(
            "[AI Tools] Cannot get available slots - AGENT_SECRET not configured"
        )
        return {
            "success": False,
            "error": "Configuração ausente",
            "availableSlots": []
        }

    resolved_id, doctor_name_or_error = await _resolve_doctor_id(doctor_id)

    if not resolved_id:
        return {
            "success": False,
            "error": doctor_name_or_error,
            "availableSlots": []
        }

    actual_doctor_id = resolved_id

    try:
        async with httpx.AsyncClient() as client:
            url = f"{NEXT_PUBLIC_URL}/api/ai-agent/schedule"
            params = {"doctorId": actual_doctor_id, "date": date}
            headers = {"x-agent-secret": AGENT_SECRET}

            logger.info(
                f"[AI Tools] Buscando horários: {url} (médico_id={actual_doctor_id}, data={date})"
            )
            response = await client.get(url,
                                        params=params,
                                        headers=headers,
                                        timeout=10.0)
            response.raise_for_status()

            data = response.json()

            if doctor_name_or_error:
                data['doctorName'] = doctor_name_or_error

            logger.info(
                f"[AI Tools] ✅ Encontrados {data.get('totalAvailable', 0)} horários disponíveis"
            )
            return data

    except Exception as e:
        logger.error(f"[AI Tools] ❌ Erro ao buscar horários: {e}")
        return {"success": False, "error": str(e), "availableSlots": []}


async def _schedule_appointment_impl(doctor_id: str,
                                     patient_id: str,
                                     patient_name: str,
                                     date: str,
                                     start_time: str,
                                     end_time: str,
                                     notes: str = "") -> dict:
    """
    Agenda uma consulta com um médico específico.
    Use SOMENTE após:
    1. Buscar médicos disponíveis com search_doctors
    2. Paciente confirmar qual médico deseja
    3. Paciente confirmar data e horário desejados
    NUNCA agende sem confirmação explícita do paciente!
    
    Args:
        doctor_id: ID do médico escolhido (obtido da busca anterior)
        patient_id: ID do paciente (já disponível no contexto)
        patient_name: Nome completo do paciente
        date: Data da consulta no formato YYYY-MM-DD (ex: 2025-11-20)
        start_time: Horário de início no formato HH:MM em formato 24h (ex: 14:30)
        end_time: Horário de término no formato HH:MM em formato 24h (ex: 15:00)
        notes: Notas ou motivo da consulta (opcional)
    
    Returns:
        Confirmação do agendamento
    """
    # Validação de entrada para prevenir erros
    try:
        from datetime import datetime as dt
        # Validar formato de data
        parsed_date = dt.strptime(date, '%Y-%m-%d')

        # Validar que a data não é no passado
        today = dt.now().date()
        if parsed_date.date() < today:
            logger.warning(
                f"[Schedule] Tentativa de agendar no passado: {date}")
            return {
                "success":
                False,
                "error":
                "Não é possível agendar consultas em datas passadas. Por favor, escolha uma data futura."
            }

        # Validar formato de horários
        dt.strptime(start_time, '%H:%M')
        dt.strptime(end_time, '%H:%M')

        # Validar que end_time é após start_time
        start_dt = dt.strptime(start_time, '%H:%M')
        end_dt = dt.strptime(end_time, '%H:%M')
        if end_dt <= start_dt:
            logger.warning(
                f"[Schedule] Horário de término antes do início: {start_time} - {end_time}"
            )
            return {
                "success":
                False,
                "error":
                "O horário de término deve ser posterior ao horário de início."
            }

    except ValueError as ve:
        logger.error(f"[Schedule] Validação de entrada falhou: {ve}")
        return {
            "success":
            False,
            "error":
            f"Formato de data ou horário inválido. Use YYYY-MM-DD para data e HH:MM para horários."
        }

    if not AGENT_SECRET:
        logger.warning(
            "[AI Tools] Cannot schedule appointment - AGENT_SECRET not configured"
        )
        return {"success": False, "error": "Configuração ausente"}

    try:
        async with httpx.AsyncClient() as client:
            url = f"{NEXT_PUBLIC_URL}/api/ai-agent/schedule"
            headers = {
                "x-agent-secret": AGENT_SECRET,
                "Content-Type": "application/json"
            }

            payload = {
                "doctorId": doctor_id,
                "patientId": patient_id,
                "patientName": patient_name,
                "date": date,
                "startTime": start_time,
                "endTime": end_time,
                "type": "consultation",
                "notes": notes
            }

            logger.info(
                f"[AI Tools] Agendando consulta: paciente={patient_name}, médico={doctor_id}, data={date} {start_time}"
            )
            response = await client.post(url,
                                         json=payload,
                                         headers=headers,
                                         timeout=10.0)
            response.raise_for_status()

            data = response.json()
            logger.info(
                f"[AI Tools] ✅ Consulta agendada: {data.get('appointmentId')}")
            return data

    except Exception as e:
        logger.error(f"[AI Tools] ❌ Erro ao agendar consulta: {e}")
        return {"success": False, "error": str(e)}


# =========================================
# FUNCTION TOOLS - LiveKit Official Pattern
# =========================================
# Seguindo padrão oficial: https://docs.livekit.io/agents/build/tools/


@function_tool()
async def search_doctors(context: RunContext,
                         specialty: str = None,
                         limit: int = 5) -> dict:
    """Busca médicos disponíveis no sistema MediAI.
    
    Use quando o paciente solicitar:
    - Encontrar um médico ou especialista
    - Agendar uma consulta (primeiro busque médicos, depois agende)
    - Informações sobre médicos disponíveis
    
    IMPORTANTE: Esta função retorna médicos REAIS do banco de dados - NUNCA invente nomes!
    
    Args:
        specialty: Especialidade médica desejada. Opções: Cardiologia, Pediatria, Dermatologia, 
                  Psiquiatria, Ortopedia, Ginecologia, Neurologia, Oftalmologia, Clínico Geral.
        limit: Número máximo de médicos a retornar (padrão: 5, máximo: 20)
    """
    return await _search_doctors_impl(specialty=specialty, limit=limit)


@function_tool()
async def get_available_slots(context: RunContext, doctor_id: str,
                              date: str) -> dict:
    """Busca horários disponíveis de um médico para uma data específica.
    
    Use após o paciente escolher um médico e antes de agendar, para mostrar os horários livres.
    
    Args:
        doctor_id: ID do médico escolhido
        date: Data desejada no formato YYYY-MM-DD (ex: 2025-11-20)
    """
    return await _get_available_slots_impl(doctor_id=doctor_id, date=date)


@function_tool()
async def schedule_appointment(context: RunContext,
                               doctor_id: str,
                               patient_name: str,
                               date: str,
                               start_time: str,
                               end_time: str,
                               notes: str = "") -> dict:
    """Agenda uma consulta com um médico específico.
    
    Use SOMENTE após:
    1. Buscar médicos disponíveis com search_doctors
    2. Paciente confirmar qual médico deseja
    3. Paciente confirmar data e horário desejados
    
    NUNCA agende sem confirmação explícita do paciente!
    
    Após o agendamento, confirme verbalmente ao paciente:
    - Nome do médico escolhido
    - Data e horário da consulta
    - Como se preparar para a consulta (se aplicável)
    
    Args:
        doctor_id: ID do médico escolhido (obtido da busca de médicos)
        patient_name: Nome completo do paciente
        date: Data da consulta no formato YYYY-MM-DD (ex: 2025-11-20)
        start_time: Horário de início no formato HH:MM em formato 24h (ex: 14:30)
        end_time: Horário de término no formato HH:MM em formato 24h (ex: 15:00)
        notes: Notas ou motivo da consulta fornecidas pelo paciente (opcional)
    """
    global _current_agent_instance
    
    patient_id = None
    
    try:
        agent = _current_agent_instance
        
        if agent is not None:
            patient_id = agent.patient_id
            if patient_id:
                logger.info(f"[Schedule] Using patient_id from agent instance: {patient_id}")
        
        if not patient_id and agent is not None and hasattr(agent, 'room'):
            try:
                import json
                room_metadata = agent.room.metadata
                if room_metadata:
                    metadata = json.loads(room_metadata)
                    patient_id = metadata.get('patient_id')
                    if patient_id:
                        logger.info(f"[Schedule] Using patient_id from room metadata: {patient_id}")
            except (json.JSONDecodeError, Exception) as json_err:
                logger.debug(f"[Schedule] Could not parse room metadata: {json_err}")
        
        if not patient_id:
            raise ValueError("Patient ID not found in agent or room metadata")

    except (AttributeError, ValueError) as e:
        logger.error(f"[Tools] Patient ID not available: {e}")
        return {
            "success": False,
            "error": "Erro interno: ID do paciente não disponível. Por favor, tente novamente."
        }

    return await _schedule_appointment_impl(doctor_id=doctor_id,
                                            patient_id=patient_id,
                                            patient_name=patient_name,
                                            date=date,
                                            start_time=start_time,
                                            end_time=end_time,
                                            notes=notes)


@function_tool()
async def get_visual_observation(context: RunContext) -> dict:
    """Obtém a observação visual mais recente do paciente (modo streaming).
    
    Use quando o modo de visão contínua está habilitado para acessar as observações
    visuais mais recentes do paciente coletadas pelo streaming de vídeo.
    
    IMPORTANTE: Esta ferramenta é para quando frames são analisados automaticamente.
    Use look_at_patient para capturar uma nova imagem sob demanda.
    """
    global _current_agent_instance
    
    agent = _current_agent_instance
    if agent is None:
        logger.warning("[Vision] Agent instance not available")
        return {
            "success": False,
            "error": "Sistema de visão não disponível",
            "observation": None
        }
    
    try:
        observation = getattr(agent, '_latest_vision_observation', None)
        obs_time = getattr(agent, '_vision_observation_time', 0)
        
        if not observation:
            return {
                "success": False,
                "error": "Nenhuma observação visual disponível ainda",
                "observation": None
            }
        
        age_seconds = time.time() - obs_time if obs_time > 0 else 0
        
        return {
            "success": True,
            "observation": observation,
            "age_seconds": round(age_seconds, 1),
            "message": f"Observação de {round(age_seconds)}s atrás: {observation}"
        }
        
    except Exception as e:
        logger.error(f"[Vision] Error getting observation: {e}")
        return {
            "success": False,
            "error": str(e),
            "observation": None
        }


@function_tool()
async def look_at_patient(context: RunContext, observation_focus: str = "geral") -> dict:
    """Olha para o paciente através da câmera para fazer observações visuais.
    
    Use quando precisar:
    - Observar a aparência física do paciente
    - Ver sinais visíveis de desconforto ou dor
    - Verificar postura, coloração da pele, ou sinais vitais visíveis
    - Avaliar visualmente ferimentos ou condições descritas pelo paciente
    
    IMPORTANTE: Use de forma profissional e respeitosa. Não faça comentários sobre
    aparência que não sejam relevantes para a saúde do paciente.
    
    Args:
        observation_focus: O que você quer observar (ex: "geral", "face", "postura", "pele", "olhos")
    """
    global _current_agent_instance
    
    agent = _current_agent_instance
    if agent is None:
        logger.warning("[Vision] Agent instance not available")
        return {
            "success": False,
            "error": "Sistema de visão não disponível",
            "observation": None
        }
    
    # Check if vision is enabled
    if not os.getenv('ENABLE_VISION', 'false').lower() == 'true':
        logger.info("[Vision] Vision is disabled (ENABLE_VISION=false)")
        return {
            "success": False,
            "error": "Visão não habilitada nesta sessão",
            "observation": None
        }
    
    try:
        logger.info(f"[Vision] 👁️ Looking at patient (focus: {observation_focus})")
        
        # Find patient video track
        video_track = None
        patient_identity = None
        avatar_identities = ['bey-avatar-agent', 'tavus-avatar', 'avatar-agent']
        
        for participant in agent.room.remote_participants.values():
            # Skip avatar agents
            if participant.identity.lower() in avatar_identities or 'avatar' in participant.identity.lower():
                continue
            
            # Find video track
            for track_pub in participant.track_publications.values():
                if track_pub.kind == rtc.TrackKind.KIND_VIDEO and track_pub.subscribed:
                    video_track = track_pub.track
                    patient_identity = participant.identity
                    logger.info(f"[Vision] Found video track from: {patient_identity}")
                    break
            if video_track:
                break
        
        if not video_track:
            logger.warning("[Vision] No video track available from patient")
            return {
                "success": False,
                "error": "Câmera do paciente não disponível",
                "observation": None
            }
        
        # Capture a single frame using VideoStream - grab first frame and close immediately
        # This minimizes the time the VideoStream is active
        video_stream = None
        try:
            logger.info("[Vision] 📸 Creating VideoStream for single frame capture...")
            video_stream = rtc.VideoStream(video_track)
            
            # Get first frame with timeout
            async def get_first_frame():
                async for frame_event in video_stream:
                    return frame_event.frame
                return None
            
            frame = await asyncio.wait_for(get_first_frame(), timeout=5.0)
            
            # Close stream immediately after getting frame
            if video_stream:
                try:
                    await video_stream.aclose()
                except Exception:
                    pass
                video_stream = None
            
            if frame is None or frame.width <= 0 or frame.height <= 0:
                return {
                    "success": False,
                    "error": "Frame de vídeo inválido",
                    "observation": None
                }
            
            logger.info(f"[Vision] Got frame: {frame.width}x{frame.height}")
            
            # Process frame to JPEG
            frame_bytes = await asyncio.to_thread(agent._process_video_frame_sync, frame)
            
            if not frame_bytes:
                return {
                    "success": False,
                    "error": "Erro ao processar imagem",
                    "observation": None
                }
            
            # Send to Gemini session for analysis
            if agent._agent_session:
                await agent._send_frame_to_session(frame_bytes)
                logger.info(f"[Vision] ✅ Frame sent to Gemini ({len(frame_bytes)} bytes)")
            
            # Track metrics
            if agent.metrics_collector:
                agent.metrics_collector.vision_input_tokens += 258
            
            # Cleanup
            del frame_bytes
            gc.collect()
            
            return {
                "success": True,
                "observation_focus": observation_focus,
                "message": f"Imagem do paciente capturada com sucesso. Foco: {observation_focus}"
            }
            
        except asyncio.TimeoutError:
            logger.warning("[Vision] Timeout waiting for video frame")
            return {
                "success": False,
                "error": "Timeout ao capturar imagem da câmera",
                "observation": None
            }
        finally:
            # Ensure stream is closed
            if video_stream:
                try:
                    await video_stream.aclose()
                except Exception:
                    pass
            
    except Exception as e:
        logger.error(f"[Vision] Error looking at patient: {e}")
        import traceback
        logger.error(f"[Vision] Traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "error": f"Erro ao observar paciente: {str(e)}",
            "observation": None
        }


class MediAIAgent(Agent):
    """MediAI Voice Agent with On-Demand or Streaming Vision"""

    def __init__(self,
                 instructions: str,
                 room: rtc.Room,
                 metrics_collector: Optional[MetricsCollector] = None,
                 patient_id: str = None,
                 vision_streaming_enabled: bool = False):
        global _current_agent_instance

        # Build dynamic tools list based on vision mode
        # If streaming is enabled, AI receives frames automatically + get_visual_observation tool
        # If streaming is disabled (on-demand mode), AI uses look_at_patient tool to see patient
        agent_tools = [search_doctors, get_available_slots, schedule_appointment]
        
        if not vision_streaming_enabled:
            # On-demand mode: add look_at_patient tool to capture frames on demand
            agent_tools.append(look_at_patient)
            logger.info("[MediAI] 👁️ Vision mode: ON-DEMAND (look_at_patient tool available)")
        else:
            # Streaming mode: add get_visual_observation to access analyzed frames
            agent_tools.append(get_visual_observation)
            logger.info("[MediAI] 👁️ Vision mode: STREAMING (get_visual_observation tool available)")

        super().__init__(instructions=instructions, tools=agent_tools)
        
        self.room = room
        self.metrics_collector = metrics_collector
        self._metrics_task = None
        self.base_instructions = instructions
        self.patient_id = patient_id
        self.last_transcription = ""
        self.doctor_search_cache = None
        self.last_doctor_search_time = 0
        self._agent_session = None
        self.last_frame_send_time = 0
        self._video_stream = None
        self._current_video_track = None
        self._video_streaming_active = False
        self._vision_streaming_enabled = vision_streaming_enabled
        
        # Vision observation storage (for streaming mode)
        self._latest_vision_observation: Optional[str] = None
        self._vision_observation_time: float = 0

        _current_agent_instance = self
        logger.info("[MediAI] Agent instance registered")

    def _convert_i420_to_rgb_pure(self, yuv_data: bytes, width: int, height: int) -> Optional['Image.Image']:
        """Convert I420/YUV420p to RGB using pure Python (no SIMD).
        
        I420 format: Y plane (width*height) + U plane (width/2*height/2) + V plane (width/2*height/2)
        
        NOTE: Converts at 1/2 resolution to balance quality and performance.
        Final resize to target resolution is handled later in _process_video_frame_sync.
        """
        try:
            y_size = width * height
            uv_size = (width // 2) * (height // 2)
            
            if len(yuv_data) < y_size + 2 * uv_size:
                logger.warning(f"[Vision] I420 data too small: {len(yuv_data)} < {y_size + 2 * uv_size}")
                return None
            
            y_plane = yuv_data[:y_size]
            u_plane = yuv_data[y_size:y_size + uv_size]
            v_plane = yuv_data[y_size + uv_size:y_size + 2 * uv_size]
            
            # Use 1/2 resolution for better quality (was 1/4 which is too low)
            # Final resolution is controlled by _process_video_frame_sync
            downsample_factor = 2
            target_w = width // downsample_factor
            target_h = height // downsample_factor
            
            logger.info(f"[Vision] I420 converting {width}x{height} -> {target_w}x{target_h}")
            
            rgb_data = bytearray(target_w * target_h * 3)
            
            for y in range(target_h):
                for x in range(target_w):
                    # Sample from original coordinates
                    src_x = x * downsample_factor
                    src_y = y * downsample_factor
                    
                    y_idx = src_y * width + src_x
                    uv_idx = (src_y // 2) * (width // 2) + (src_x // 2)
                    
                    Y = y_plane[y_idx] if y_idx < len(y_plane) else 128
                    U = u_plane[uv_idx] if uv_idx < len(u_plane) else 128
                    V = v_plane[uv_idx] if uv_idx < len(v_plane) else 128
                    
                    # YUV to RGB conversion (BT.601 standard)
                    C = Y - 16
                    D = U - 128
                    E = V - 128
                    
                    R = max(0, min(255, (298 * C + 409 * E + 128) >> 8))
                    G = max(0, min(255, (298 * C - 100 * D - 208 * E + 128) >> 8))
                    B = max(0, min(255, (298 * C + 516 * D + 128) >> 8))
                    
                    idx = (y * target_w + x) * 3
                    rgb_data[idx] = R
                    rgb_data[idx + 1] = G
                    rgb_data[idx + 2] = B
            
            return Image.frombytes('RGB', (target_w, target_h), bytes(rgb_data))
            
        except Exception as e:
            logger.error(f"[Vision] I420 conversion error: {e}")
            return None

    def _convert_nv12_to_rgb_pure(self, nv12_data: bytes, width: int, height: int) -> Optional['Image.Image']:
        """Convert NV12 to RGB using pure Python (no SIMD).
        
        NV12 format: Y plane (width*height) + interleaved UV plane (width*height/2)
        
        NOTE: Converts at 1/2 resolution to balance quality and performance.
        """
        try:
            y_size = width * height
            uv_size = width * (height // 2)
            
            if len(nv12_data) < y_size + uv_size:
                logger.warning(f"[Vision] NV12 data too small: {len(nv12_data)} < {y_size + uv_size}")
                return None
            
            y_plane = nv12_data[:y_size]
            uv_plane = nv12_data[y_size:y_size + uv_size]
            
            # Use 1/2 resolution for better quality (was 1/4 which is too low)
            downsample_factor = 2
            target_w = width // downsample_factor
            target_h = height // downsample_factor
            
            logger.info(f"[Vision] NV12 converting {width}x{height} -> {target_w}x{target_h}")
            
            rgb_data = bytearray(target_w * target_h * 3)
            
            for y in range(target_h):
                for x in range(target_w):
                    src_x = x * downsample_factor
                    src_y = y * downsample_factor
                    
                    y_idx = src_y * width + src_x
                    uv_idx = (src_y // 2) * width + (src_x // 2) * 2
                    
                    Y = y_plane[y_idx] if y_idx < len(y_plane) else 128
                    U = uv_plane[uv_idx] if uv_idx < len(uv_plane) else 128
                    V = uv_plane[uv_idx + 1] if uv_idx + 1 < len(uv_plane) else 128
                    
                    # YUV to RGB conversion (BT.601 standard)
                    C = Y - 16
                    D = U - 128
                    E = V - 128
                    
                    R = max(0, min(255, (298 * C + 409 * E + 128) >> 8))
                    G = max(0, min(255, (298 * C - 100 * D - 208 * E + 128) >> 8))
                    B = max(0, min(255, (298 * C + 516 * D + 128) >> 8))
                    
                    idx = (y * target_w + x) * 3
                    rgb_data[idx] = R
                    rgb_data[idx + 1] = G
                    rgb_data[idx + 2] = B
            
            return Image.frombytes('RGB', (target_w, target_h), bytes(rgb_data))
            
        except Exception as e:
            logger.error(f"[Vision] NV12 conversion error: {e}")
            return None

    def _process_video_frame_sync(self,
                                  frame: rtc.VideoFrame) -> Optional[bytes]:
        """Process video frame synchronously - returns JPEG bytes.
        
        ULTRA-SIMPLIFIED VERSION: Avoids operations that may cause SIGILL.
        Uses multiple fallback strategies to handle different frame formats.
        
        Returns JPEG bytes that Gemini can process directly.
        """
        rgba_frame = None
        img = None
        img_buffer = None
        
        try:
            logger.info("[Vision] Processing frame...")
            
            if not PIL_AVAILABLE:
                logger.warning("[Vision] PIL not available, skipping frame")
                return None
            
            height = frame.height
            width = frame.width
            
            # Try to get raw data directly without conversion first
            # This avoids potential SIGILL from native conversion libs
            raw_data = None
            try:
                raw_data = bytes(frame.data)
                logger.info(f"[Vision] Got raw frame data: {len(raw_data)} bytes, format: {frame.type}")
            except Exception as e:
                logger.warning(f"[Vision] Could not get raw data: {e}")
            
            # Determine frame format and create PIL Image
            # CRITICAL: Avoid frame.convert() as it may use AVX instructions that crash
            if raw_data:
                try:
                    frame_type = frame.type
                    logger.info(f"[Vision] Frame type: {frame_type}")
                    
                    # Try to interpret based on frame type
                    if frame_type == VideoBufferType.RGBA:
                        img = Image.frombytes('RGBA', (width, height), raw_data)
                        img = img.convert('RGB')
                    elif frame_type == VideoBufferType.RGB24:
                        img = Image.frombytes('RGB', (width, height), raw_data)
                    elif frame_type == VideoBufferType.BGRA:
                        img = Image.frombytes('RGBA', (width, height), raw_data)
                        # Swap R and B channels for BGRA
                        r, g, b, a = img.split()
                        img = Image.merge('RGB', (b, g, r))
                    elif hasattr(VideoBufferType, 'I420') and frame_type == VideoBufferType.I420:
                        # YUV420 (I420) is common in WebRTC
                        # Convert using pure Python (no SIMD)
                        logger.info("[Vision] Converting I420/YUV420 to RGB...")
                        img = self._convert_i420_to_rgb_pure(raw_data, width, height)
                        if img is None:
                            return None
                    elif hasattr(VideoBufferType, 'NV12') and frame_type == VideoBufferType.NV12:
                        # NV12 is another common format - similar to I420
                        logger.info("[Vision] Converting NV12 to RGB...")
                        img = self._convert_nv12_to_rgb_pure(raw_data, width, height)
                        if img is None:
                            return None
                    else:
                        # Unknown format - DO NOT attempt conversion as it may crash
                        logger.warning(f"[Vision] Unknown format {frame_type}, skipping frame to avoid SIGILL")
                        return None
                except ValueError as e:
                    # ValueError often means wrong data size for format
                    logger.warning(f"[Vision] Data size mismatch: {e}")
                    return None
                except Exception as e:
                    logger.warning(f"[Vision] Direct interpretation failed: {e}")
                    return None
            else:
                # No raw data available
                logger.warning("[Vision] No raw data available, skipping frame")
                return None
            
            logger.info(f"[Vision] Image created: {img.size}")
            
            # Resize to target resolution for better vision analysis
            # Target 640x480 for good quality analysis while keeping token costs reasonable
            target_width = 640
            target_height = 480
            
            # Only resize if image is significantly different from target
            current_w, current_h = img.size
            if current_w < target_width or current_h < target_height:
                # Upscale small images to minimum size for analysis
                scale = max(target_width / current_w, target_height / current_h)
                new_w = int(current_w * scale)
                new_h = int(current_h * scale)
                try:
                    img = img.resize((new_w, new_h), Image.BILINEAR)
                    logger.info(f"[Vision] Upscaled from {current_w}x{current_h} to {new_w}x{new_h}")
                except Exception as resize_err:
                    logger.warning(f"[Vision] Upscale failed: {resize_err}")
            elif current_w > target_width * 2 or current_h > target_height * 2:
                # Downscale very large images to save tokens
                try:
                    img = img.resize((target_width, target_height), Image.NEAREST)
                    logger.info(f"[Vision] Downscaled from {current_w}x{current_h} to {target_width}x{target_height}")
                except Exception as resize_err:
                    logger.warning(f"[Vision] Downscale failed: {resize_err}, keeping original")

            # Encode to JPEG with better quality for accurate vision analysis
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='JPEG', quality=75)
            frame_bytes = img_buffer.getvalue()
            
            img_buffer.close()
            del img
            img = None
            
            del rgba_frame
            rgba_frame = None

            logger.info(f"[Vision] Frame processed: {len(frame_bytes)} bytes")
            gc.collect()
            return frame_bytes

        except MemoryError as e:
            logger.error(f"[Vision] Memory error: {e}")
            gc.collect()
            return None
        except Exception as e:
            logger.error(f"[Vision] Error processing frame: {e}")
            import traceback
            logger.error(f"[Vision] Traceback: {traceback.format_exc()}")
            gc.collect()
            return None
        finally:
            if img is not None:
                del img
            if img_buffer is not None:
                try:
                    img_buffer.close()
                except:
                    pass
            if rgba_frame is not None:
                del rgba_frame
            gc.collect()

    async def cleanup_video_stream(self):
        """Properly cleanup video stream resources."""
        try:
            self._video_streaming_active = False
            if self._video_stream is not None:
                try:
                    await self._video_stream.aclose()
                except Exception:
                    pass
                self._video_stream = None
            self._current_video_track = None
            gc.collect()
        except Exception as e:
            logger.debug(f"[Vision] Error cleaning up video stream: {e}")

    async def start_video_streaming(self, participant):
        """Start continuous video streaming for a patient participant.
        
        OPTIMIZED: Only sends 1 frame every 4 seconds to minimize token usage.
        Frames are resized to 480px and compressed to JPEG quality 50.
        
        Args:
            participant: The LiveKit participant to stream video from
        """
        # Check if already streaming
        if getattr(self, '_video_streaming_active', False):
            logger.info("[Vision] Video streaming already active, skipping")
            return
        
        # Filter out avatar agents
        avatar_identities = ['bey-avatar-agent', 'tavus-avatar', 'avatar-agent']
        if participant.identity.lower() in avatar_identities or 'avatar' in participant.identity.lower():
            logger.info(f"[Vision] Skipping avatar participant: {participant.identity}")
            return
        
        logger.info(f"[Vision] 📹 Starting video streaming for patient: {participant.identity}")
        
        # Find video track
        video_track = None
        for track_pub in participant.track_publications.values():
            if track_pub.kind == rtc.TrackKind.KIND_VIDEO and track_pub.subscribed:
                video_track = track_pub.track
                logger.info(f"[Vision] Found video track: {track_pub.sid}")
                break
        
        if not video_track:
            logger.warning("[Vision] No video track available from patient")
            return
        
        self._video_streaming_active = True
        self._current_video_track = video_track
        
        # Start the video loop as a background task
        asyncio.create_task(self._video_loop(video_track))

    async def _video_loop(self, video_track):
        """Internal video processing loop with strict rate limiting.
        
        CRITICAL PERFORMANCE RULES:
        - Only processes 1 frame every 4 seconds
        - Ignores all frames between intervals
        - Immediately releases memory after sending
        
        NOTE: This function may cause SIGILL on CPUs without AVX support.
        Set ENABLE_VISION_STREAMING=false to disable.
        """
        # Check if video streaming is explicitly disabled
        streaming_enabled = os.getenv('ENABLE_VISION_STREAMING', 'true').lower() == 'true'
        if not streaming_enabled:
            logger.info("[Vision] 🚫 Video streaming disabled via ENABLE_VISION_STREAMING=false")
            self._video_streaming_active = False
            return
        
        FRAME_INTERVAL = 4.0  # Only send 1 frame every 4 seconds
        
        video_stream = None
        try:
            # WARNING: This may crash with SIGILL on CPUs without AVX
            # If you see "exit code -4", set ENABLE_VISION_STREAMING=false
            logger.info("[Vision] 🎥 Creating VideoStream (may crash on CPUs without AVX)...")
            video_stream = rtc.VideoStream(video_track)
            self._video_stream = video_stream
            
            logger.info(f"[Vision] 🎥 Video loop started - sending 1 frame every {FRAME_INTERVAL}s")
            
            last_send_time = 0
            
            async for frame_event in video_stream:
                if not self._video_streaming_active:
                    logger.info("[Vision] Video streaming stopped")
                    break
                
                current_time = time.time()
                
                # RATE LIMIT: Skip frames if not enough time has passed
                if current_time - last_send_time < FRAME_INTERVAL:
                    continue
                
                frame = frame_event.frame
                if frame is None or frame.width <= 0 or frame.height <= 0:
                    continue
                
                try:
                    # Process frame in separate thread to avoid blocking
                    frame_bytes = await asyncio.to_thread(
                        self._process_video_frame_sync, frame)
                    
                    if not frame_bytes:
                        continue
                    
                    # Send frame to Gemini Live session
                    await self._send_frame_to_session(frame_bytes)
                    
                    last_send_time = current_time
                    
                    # Track metrics
                    if self.metrics_collector:
                        # Estimate ~258 tokens per frame (480x480 JPEG)
                        self.metrics_collector.vision_input_tokens += 258
                    
                    logger.debug(f"[Vision] 📸 Frame sent ({len(frame_bytes)} bytes)")
                    
                    # Immediate cleanup
                    del frame_bytes
                    frame_bytes = None
                    
                except Exception as e:
                    logger.error(f"[Vision] Error processing frame: {e}")
                    continue
                finally:
                    # Force garbage collection every frame
                    gc.collect()
                    
        except asyncio.CancelledError:
            logger.info("[Vision] Video loop cancelled")
        except Exception as e:
            logger.error(f"[Vision] Video loop error: {e}")
            import traceback
            logger.error(f"[Vision] Traceback: {traceback.format_exc()}")
        finally:
            self._video_streaming_active = False
            if video_stream is not None:
                try:
                    await video_stream.aclose()
                except Exception:
                    pass
            self._video_stream = None
            gc.collect()
            logger.info("[Vision] 🎥 Video loop ended")

    async def _send_frame_to_session(self, frame_bytes: bytes):
        """Analyze a video frame using Gemini Vision API.
        
        NOTE: The LiveKit RealtimeModel (Gemini Live API) is audio-only and does not
        support direct video frame injection. Instead, we use the Gemini Vision API
        separately to analyze frames and store observations for the agent to reference.
        
        This is the correct architecture:
        1. Capture frame from patient's camera
        2. Analyze with Gemini Vision API (gemini-2.0-flash) 
        3. Store observation in self._latest_vision_observation
        4. Agent accesses observation via get_visual_observation tool
        
        THROTTLING: To reduce costs and API load, we only analyze frames every 30 seconds
        even though we receive frames every 4 seconds. The latest frame is stored
        and analyzed periodically.
        """
        # Additional throttling: Only analyze 1 frame every 30 seconds (on top of 4s capture rate)
        ANALYSIS_INTERVAL = 30.0
        current_time = time.time()
        
        if hasattr(self, '_last_vision_analysis_time'):
            time_since_last = current_time - self._last_vision_analysis_time
            if time_since_last < ANALYSIS_INTERVAL:
                logger.debug(f"[Vision] Skipping analysis - {ANALYSIS_INTERVAL - time_since_last:.1f}s until next")
                return
        
        try:
            self._last_vision_analysis_time = current_time
            
            # Use Gemini Vision API (not LiveKit RealtimeModel)
            vision_model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Prepare image for Gemini
            image_part = {
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": base64.b64encode(frame_bytes).decode('utf-8')
                }
            }
            
            # Analyze frame with medical focus
            prompt = """Você é uma assistente médica observando o paciente por vídeo durante uma consulta.
Descreva objetivamente o que você vê em 2-3 frases curtas, focando em:
- Aparência geral (expressão facial, postura, sinais de desconforto)
- Qualquer característica visível relevante para saúde
- Ambiente do paciente se relevante

Seja profissional e não faça diagnósticos, apenas observações visuais."""

            # Call Gemini Vision API in a thread to avoid blocking
            def analyze_sync():
                response = vision_model.generate_content([prompt, image_part])
                return response.text if response and response.text else None
            
            observation = await asyncio.to_thread(analyze_sync)
            
            if observation:
                # Store the latest observation for the agent to reference
                self._latest_vision_observation = observation
                self._vision_observation_time = time.time()
                logger.info(f"[Vision] ✅ Frame analyzed: {observation[:100]}...")
                
                # Track vision tokens
                if self.metrics_collector:
                    self.metrics_collector.vision_input_tokens += 258
                    self.metrics_collector.vision_output_tokens += len(observation) // 4
            else:
                logger.warning("[Vision] No observation returned from Gemini Vision")
                
        except Exception as e:
            logger.error(f"[Vision] Error analyzing frame: {e}")
            import traceback
            logger.error(f"[Vision] Traceback: {traceback.format_exc()}")

    async def on_enter(self):
        """Called when agent enters the session - generates initial greeting using session.say()"""

        # Wait for avatar to fully load and sync audio/video
        # This ensures the avatar is visible before greeting starts
        logger.info(
            "[MediAI] ⏳ Waiting for avatar to be visible and audio/video to sync..."
        )
        await asyncio.sleep(8)

        # Start metrics periodic flush
        if self.metrics_collector:
            self._metrics_task = asyncio.create_task(
                self.metrics_collector.start_periodic_flush())

        logger.info("[MediAI] 🎤 Starting consultation - awaiting user input...")
        
        # NOTE: Initial greeting via session.say() requires TTS provider to be fully initialized
        # in the RealtimeModel. This is handled automatically by the Gemini Live API.
        # The agent will start speaking when the patient initiates conversation via voice.
        # 
        # If explicit greeting is needed in future, ensure:
        # 1. TTS provider is configured (voice parameter in RealtimeModel)
        # 2. Session is fully initialized before calling say()
        # 3. Consider using LLM generate_reply() instead for better reliability

    async def _handle_user_transcription(self, event):
        """Handle user transcription event - logs speech and tracks metrics."""
        try:
            # Extract transcript from event
            if not hasattr(event, 'transcript') or not event.transcript:
                return

            message_text = event.transcript
            logger.info(f"[Patient] 🎙️ {message_text[:100]}...")

            # Track input tokens for metrics
            if self.metrics_collector:
                self.metrics_collector.track_llm(input_text=message_text)

        except Exception as e:
            logger.error(f"[Patient] Error handling transcription: {e}")


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

    # Create database connection pool (prevents connection churning)
    import asyncpg
    database_url = os.getenv('DATABASE_URL')

    pool = None
    if database_url:
        try:
            pool = await asyncpg.create_pool(database_url,
                                             min_size=1,
                                             max_size=5,
                                             command_timeout=10)
            logger.info("[MediAI] 💾 Database connection pool created")
        except Exception as pool_error:
            logger.error(
                f"[MediAI] Failed to create database pool: {pool_error}")

    # Criar MetricsCollector
    session_id = ctx.room.name or f"session-{int(time.time())}"
    metrics_collector = MetricsCollector(patient_id=patient_id,
                                         session_id=session_id)
    logger.info(
        f"[Metrics] 📊 Iniciado coletor de métricas para sessão {session_id}")

    logger.info(f"[MediAI] 📋 Loading patient context...")
    patient_context = await get_patient_context(pool, patient_id)
    logger.info(
        f"[MediAI] ✅ Patient context loaded ({len(patient_context)} chars)")

    logger.info(f"[MediAI] 🤖 Creating Gemini Live API model...")

    # Select Gemini model (native audio for STT+LLM+TTS integration)
    # Default: gemini-2.5-flash-native-audio-preview-09-2025 for best audio quality
    gemini_model = os.getenv('GEMINI_LLM_MODEL', 'gemini-2.5-flash-preview-native-audio')
    logger.info(f"[MediAI] 🎙️ Using Gemini model: {gemini_model}")

    # Check if vision is enabled
    vision_enabled = os.getenv('ENABLE_VISION', 'false').lower() == 'true'
    vision_streaming_enabled = os.getenv('ENABLE_VISION_STREAMING', 'false').lower() == 'true'

    # Build system prompt based on vision mode
    if vision_enabled:
        if vision_streaming_enabled:
            vision_instructions = """VISÃO EM TEMPO REAL (STREAMING):
✅ O sistema está analisando o vídeo do paciente automaticamente a cada 30 segundos
✅ Use a ferramenta get_visual_observation para acessar a observação visual mais recente
- Chame get_visual_observation quando quiser saber como o paciente está visualmente
- As observações são atualizadas automaticamente, então você sempre terá informações recentes
- Combine o que você VÊ (via get_visual_observation) com o que você OUVE para avaliação completa
- Se notar algo preocupante na observação visual, comente naturalmente
- Seja profissional e respeitosa nas observações visuais
- NÃO faça comentários sobre aparência que não sejam relevantes para saúde
- Use get_visual_observation periodicamente para acompanhar o estado do paciente"""
        else:
            vision_instructions = """VISÃO SOB DEMANDA:
✅ VOCÊ PODE VER O PACIENTE usando a ferramenta look_at_patient
- Use look_at_patient quando precisar observar visualmente o paciente
- Exemplo: se o paciente mencionar uma ferida, lesão, ou sintoma visível, use look_at_patient para observar
- Combine o que você VÊ com o que você OUVE para fazer uma avaliação mais completa
- Seja profissional e respeitosa nas observações visuais
- NÃO faça comentários sobre aparência que não sejam relevantes para saúde
- Use a visão estrategicamente, não a cada frase do paciente"""
    else:
        vision_instructions = """VISÃO:
- Nesta consulta, você NÃO tem acesso visual ao paciente
- Baseie sua avaliação apenas nas informações verbais fornecidas
- Faça perguntas detalhadas para entender melhor os sintomas do paciente"""

    system_prompt = f"""Você é MediAI, uma assistente médica virtual brasileira especializada em triagem de pacientes e orientação de saúde.

CAPACIDADES IMPORTANTES:
{vision_instructions}
✅ VOCÊ PODE AGENDAR CONSULTAS - Você tem acesso aos médicos cadastrados na plataforma e pode agendar consultas reais
✅ Você pode buscar médicos por especialidade e verificar disponibilidade de horários

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

DIRETRIZES MÉDICAS IMPORTANTES:
1. NUNCA faça diagnósticos definitivos - você faz avaliação preliminar
2. SEMPRE sugira consulta médica presencial quando apropriado
3. Em casos de emergência, instrua o paciente a procurar atendimento IMEDIATO
4. Seja clara sobre suas limitações como assistente virtual
5. Mantenha tom profissional mas acolhedor

🚨 REGRA CRÍTICA - MÉDICOS REAIS APENAS:
❌ NUNCA invente nomes de médicos (como "Dr. Silva", "Dra. Santos", etc.)
❌ NUNCA mencione médicos que não foram retornados pela busca no banco de dados
✅ Quando paciente pedir médico, diga: "Deixe-me consultar nosso sistema..."
✅ Apresente SOMENTE os médicos reais retornados pela consulta
✅ Se nenhum médico disponível, seja honesta: "No momento não temos médicos dessa especialidade online"

AGENDAMENTO DE CONSULTAS:
- Quando o paciente solicitar consulta com médico especialista:
  1. Consulte o banco de dados PRIMEIRO
  2. Apresente APENAS médicos reais retornados pela consulta
  3. Verifique horários disponíveis reais
  4. Agende somente com confirmação do paciente
- Sempre confirme os detalhes antes de agendar (data, horário, médico escolhido)
- Informe claramente ao paciente quando um agendamento for confirmado

PROTOCOLO DE CONVERSA:
1. Cumprimente o paciente pelo nome de forma calorosa
2. Pergunte sobre o motivo da consulta de hoje
3. Investigue sintomas: quando começaram, intensidade, frequência
4. Relacione com histórico médico quando relevante
5. Ao final, resuma o que foi discutido e forneça orientações preliminares
6. Se apropriado, ofereça agendar consulta com especialista

IMPORTANTE: Mantenha suas respostas curtas e objetivas. Faça perguntas uma de cada vez e aguarde a resposta do paciente antes de continuar. Seja natural e conversacional.

CONTEXTO DO PACIENTE:
{patient_context}
"""

    logger.info(f"[MediAI] 🎙️ Creating agent session with Gemini Live API...")

    # Create agent instance with patient_id (thread-safe: stored on instance)
    # Function tools acessam patient_id via context.agent.patient_id
    # Pass vision_streaming_enabled to control dynamic tools list
    agent = MediAIAgent(instructions=system_prompt,
                        room=ctx.room,
                        metrics_collector=metrics_collector,
                        patient_id=patient_id,
                        vision_streaming_enabled=vision_streaming_enabled)

    # Create AgentSession with integrated Gemini Live model (STT + LLM + TTS)
    # Language is controlled via voice selection and system instructions
    # Erinome voice is designed for Portuguese (pt-BR)
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model=
            gemini_model,  # Using selected model (native audio or standard realtime)
            voice="Despina",  # Female voice optimized for Portuguese (pt-BR)
            temperature=
            0.5,  # Lower for more consistent responses and pronunciation
            instructions=system_prompt,
        ), )

    logger.info("[MediAI] 🏥 Starting medical consultation session...")
    logger.info(
        "[MediAI] 🛠️ Function tools serão executados automaticamente pelo LiveKit"
    )

    # Register listener for user transcriptions to detect doctor search intent
    @session.on("user_input_transcribed")
    def on_user_transcribed(event):
        """Real-time intent detection from patient speech transcriptions."""
        asyncio.create_task(agent._handle_user_transcription(event))

    # NOTE: Não é mais necessário registrar handler manual para tool_call
    # O LiveKit agora gerencia automaticamente a execução das function tools
    # quando fnc_ctx é passado para o RealtimeModel

    # Start session with agent
    await session.start(
        agent=agent,
        room=ctx.room,
    )

    # Store session reference in agent for video streaming
    agent._agent_session = session

    logger.info("[MediAI] ✅ Session started successfully!")

    # Vision capability configuration
    # Default: On-demand vision via look_at_patient tool (stable, no crashes)
    # Optional: Continuous streaming (requires AVX-capable CPU, may crash otherwise)
    
    if vision_enabled:
        if vision_streaming_enabled:
            # EXPERIMENTAL: Continuous streaming - may crash on CPUs without AVX
            logger.info("[MediAI] 👁️ Vision: CONTINUOUS STREAMING mode (1 frame/4s)")
            logger.warning("[MediAI] ⚠️ Streaming may crash on CPUs without AVX support")
            
            # Start video streaming for existing participants
            for participant in ctx.room.remote_participants.values():
                asyncio.create_task(agent.start_video_streaming(participant))
            
            # Register listener for new participant connections
            @ctx.room.on("participant_connected")
            def on_participant_connected(participant):
                """Start video streaming when a new participant connects."""
                logger.info(f"[Vision] 👤 Participant connected: {participant.identity}")
                asyncio.create_task(agent.start_video_streaming(participant))
            
            # Register listener for track subscriptions (when camera is enabled)
            @ctx.room.on("track_subscribed")
            def on_track_subscribed(track, publication, participant):
                """Start video streaming when a video track is subscribed."""
                if track.kind == rtc.TrackKind.KIND_VIDEO:
                    logger.info(f"[Vision] 📹 Video track subscribed from: {participant.identity}")
                    asyncio.create_task(agent.start_video_streaming(participant))
        else:
            # DEFAULT: On-demand vision via look_at_patient tool
            logger.info("[MediAI] 👁️ Vision: ON-DEMAND mode via look_at_patient tool")
            logger.info("[MediAI] 💡 Agent can see patient when needed (stable, no SIGILL risk)")
    else:
        logger.info("[MediAI] 👁️ Vision disabled (set ENABLE_VISION=true to enable)")

    # Hook into session events to track metrics
    # Note: Gemini Live API integrates STT/LLM/TTS, so we estimate based on interaction
    # CRITICAL: Since we use Native Audio, the audio channel is continuously open.
    # We must estimate audio tokens based on session duration.
    
    # Estimated tokens per second of audio (based on Gemini average ~25 tokens/second)
    TOKENS_PER_SECOND_AUDIO = 25
    
    async def track_conversation():
        """Background task to track conversation metrics with audio token estimation."""
        last_track_time = time.time()
        
        try:
            while True:
                await asyncio.sleep(5)  # Check every 5 seconds
                
                current_time = time.time()
                elapsed_seconds = current_time - last_track_time
                last_track_time = current_time
                
                # Update active time on every iteration
                metrics_collector.update_active_time()

                # Rastrear atividade baseado em participantes conectados
                if len(ctx.room.remote_participants) > 0:
                    # ========================================
                    # AUDIO TOKEN ESTIMATION (Native Audio)
                    # ========================================
                    # The audio channel is continuously open with Gemini Native Audio.
                    # We estimate tokens based on elapsed time:
                    # - STT (Audio Input): Model "listens" continuously = 100% of time
                    # - TTS (Audio Output): Model speaks ~50% of time (conservative estimate)
                    
                    stt_tokens_delta = int(elapsed_seconds * TOKENS_PER_SECOND_AUDIO)
                    tts_tokens_delta = int(elapsed_seconds * TOKENS_PER_SECOND_AUDIO * 0.5)
                    
                    # Add to metrics collector
                    metrics_collector.stt_tokens += stt_tokens_delta
                    metrics_collector.tts_tokens += tts_tokens_delta
                    
                    logger.debug(
                        f"[Metrics] Audio estimation: +{stt_tokens_delta} STT, +{tts_tokens_delta} TTS "
                        f"(totals: {metrics_collector.stt_tokens} STT, {metrics_collector.tts_tokens} TTS)"
                    )
                    
        except asyncio.CancelledError:
            logger.info("[Metrics] Background tracking stopped")

    # Start background tracking
    tracking_task = asyncio.create_task(track_conversation())

    # Get avatar provider configuration from database (async call with pool)
    avatar_provider = await get_avatar_provider_config(pool)
    logger.info(f"[MediAI] 🎭 Avatar provider selected: {avatar_provider}")

    # Initialize avatar based on configuration
    if avatar_provider == 'bey':
        # Beyond Presence (BEY) Avatar
        bey_api_key = os.getenv('BEY_API_KEY')
        bey_avatar_id = os.getenv(
            'BEY_AVATAR_ID')  # Optional, uses default if not set

        if bey_api_key:
            logger.info(
                "[MediAI] 🎭 Initializing Beyond Presence (BEY) avatar...")

            try:
                # Create BEY avatar session
                avatar_params = {'avatar_participant_name': 'MediAI'}

                # Add avatar_id if specified
                if bey_avatar_id:
                    avatar_params['avatar_id'] = bey_avatar_id

                avatar = bey.AvatarSession(**avatar_params)

                logger.info("[MediAI] 🎥 Starting BEY avatar...")
                await avatar.start(session, room=ctx.room)

                # Iniciar rastreamento de custo do avatar
                metrics_collector.start_avatar_tracking('bey')
                
                logger.info(
                    "[MediAI] ✅ Beyond Presence avatar started successfully!")

            except Exception as e:
                logger.error(f"[MediAI] ⚠️ BEY avatar error: {e}")
                logger.info("[MediAI] Continuing with audio only")
        else:
            logger.warning(
                "[MediAI] BEY_API_KEY not found - running audio only")

    else:
        # Tavus Avatar (default)
        tavus_api_key = os.getenv('TAVUS_API_KEY')
        replica_id = os.getenv('TAVUS_REPLICA_ID')
        persona_id = os.getenv('TAVUS_PERSONA_ID')

        if tavus_api_key and replica_id and persona_id:
            logger.info("[MediAI] 🎭 Initializing Tavus avatar...")

            try:
                avatar = tavus.AvatarSession(replica_id=replica_id,
                                             persona_id=persona_id,
                                             avatar_participant_name="MediAI")

                logger.info("[MediAI] 🎥 Starting Tavus avatar...")
                await avatar.start(session, room=ctx.room)

                # Iniciar rastreamento de custo do avatar
                metrics_collector.start_avatar_tracking('tavus')
                
                logger.info("[MediAI] ✅ Tavus avatar started successfully!")

            except Exception as e:
                logger.error(f"[MediAI] ⚠️ Tavus avatar error: {e}")
                logger.info("[MediAI] Continuing with audio only")
        else:
            logger.warning(
                "[MediAI] Tavus credentials not found - running audio only")

    # Wait for session to end
    try:
        # This will block until the room is disconnected
        await asyncio.Event().wait()
    except asyncio.CancelledError:
        pass
    finally:
        # Cleanup and send final metrics
        logger.info("[MediAI] 🛑 Session ending, cleaning up...")

        # Cleanup VideoStream cache (on-demand vision only - no streaming task)
        if 'agent' in locals() and agent:
            await agent.cleanup_video_stream()

        # Stop tracking task
        if 'tracking_task' in locals() and tracking_task:
            tracking_task.cancel()
            try:
                await tracking_task
            except asyncio.CancelledError:
                pass

        # Stop avatar tracking and metrics collector, send final metrics
        if 'metrics_collector' in locals() and metrics_collector:
            metrics_collector.stop_avatar_tracking()
            await metrics_collector.stop()

        # Close database connection pool
        if 'pool' in locals() and pool:
            logger.info("[MediAI] 💾 Closing database connection pool...")
            await pool.close()
        
        # Clear global agent instance reference to allow GC
        global _current_agent_instance
        _current_agent_instance = None
        gc.collect()

        logger.info("[MediAI] ✅ Cleanup complete")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            num_idle_processes=0,
            job_memory_warn_mb=400,
            job_memory_limit_mb=2000,
        ))
