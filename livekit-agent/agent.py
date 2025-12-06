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
        """Estima tokens baseado em texto (1 token ≈ 4 caracteres)."""
        if not text:
            return 0
        return max(1, len(text) // 4)

    def track_stt(self, text: str):
        """Rastreia tokens STT estimados."""
        tokens = self.estimate_tokens(text)
        self.stt_tokens += tokens
        logger.debug(
            f"[Metrics] STT: +{tokens} tokens (total: {self.stt_tokens})")

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
        logger.debug(
            f"[Metrics] TTS: +{tokens} tokens (total: {self.tts_tokens})")

    def track_vision(self, usage_metadata):
        """Rastreia tokens de visão do Gemini Vision."""
        if usage_metadata:
            input_tokens = getattr(usage_metadata, 'prompt_token_count', 0)
            output_tokens = getattr(usage_metadata, 'candidates_token_count',
                                    0)

            self.vision_input_tokens += input_tokens
            self.vision_output_tokens += output_tokens

            logger.info(
                f"[Metrics] Vision: +{input_tokens} input, +{output_tokens} output tokens"
            )

    def update_active_time(self):
        """Atualiza tempo ativo de conversa."""
        current_time = time.time()
        elapsed = current_time - self.session_start
        self.active_seconds = int(elapsed)
        
        # Atualiza tempo do avatar se estiver ativo
        if self.avatar_start_time:
            self.avatar_seconds = int(current_time - self.avatar_start_time)

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
        # Conversão USD -> BRL (≈ 5.0)
        usd_to_brl = 5.0

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
        # BeyondPresence (BEY): $0.175/minuto
        # Tavus CVI: $0.10/minuto (estimado)
        
        avatar_minutes = self.avatar_seconds / 60.0
        if self.avatar_provider == 'bey':
            avatar_cost_usd = avatar_minutes * 0.175  # BeyondPresence
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
        usd_to_brl = 5.0
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
        # BeyondPresence (BEY): $0.175/minuto
        # Tavus CVI: $0.10/minuto (estimado)
        delta_avatar_minutes = delta_avatar_seconds / 60.0
        if self.avatar_provider == 'bey':
            delta_avatar_cost_usd = delta_avatar_minutes * 0.175
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
            "activeSeconds": delta_active_seconds + delta_avatar_seconds,
            "avatarProvider": api_avatar_provider,
            "costCents": delta_cost_cents,
            "metadata": {
                "model": "gemini-2.5-flash",
                "avatarProvider": self.avatar_provider,
                "avatarSeconds": delta_avatar_seconds,
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
async def look_at_patient(context: RunContext) -> dict:
    """Olha para o paciente através da câmera e descreve o que vê.
    
    Use quando o paciente perguntar:
    - "Você consegue me ver?"
    - "O que você está vendo?"
    - "Pode me descrever?"
    - "Olhe para mim"
    - Ou quando precisar observar algo visualmente (ferimento, expressão, etc.)
    
    Esta função captura uma imagem da câmera do paciente, analisa com IA,
    e retorna uma descrição do que foi observado.
    
    IMPORTANTE: Use esta capacidade com tato e profissionalismo.
    Não faça comentários sobre aparência física que não sejam relevantes para a saúde.
    """
    global _current_agent_instance

    try:
        agent = _current_agent_instance

        if agent is None:
            logger.error("[Vision] No agent instance available")
            return {
                "success": False,
                "description": None,
                "message": "Sistema de visão não está disponível no momento."
            }

        logger.info(
            "[Vision] 👁️ Patient requested visual analysis - capturing frame..."
        )

        description = await agent.capture_and_analyze_patient()

        if description:
            logger.info(
                f"[Vision] ✅ Visual analysis complete: {description[:100]}...")
            return {
                "success": True,
                "description": description,
                "message": "Análise visual concluída com sucesso"
            }
        else:
            logger.warning(
                "[Vision] ❌ Could not capture or analyze patient image")
            return {
                "success":
                False,
                "description":
                None,
                "message":
                "Não foi possível capturar a imagem. Verifique se a câmera está ativada."
            }

    except Exception as e:
        logger.error(f"[Vision] Error in look_at_patient: {e}")
        return {
            "success": False,
            "description": None,
            "message": f"Erro ao analisar imagem: {str(e)}"
        }


class MediAIAgent(Agent):
    """MediAI Voice Agent with On-Demand Vision"""

    def __init__(self,
                 instructions: str,
                 room: rtc.Room,
                 metrics_collector: Optional[MetricsCollector] = None,
                 patient_id: str = None):
        global _current_agent_instance

        super().__init__(instructions=instructions,
                         tools=[
                             search_doctors, get_available_slots,
                             schedule_appointment, look_at_patient
                         ])
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

        _current_agent_instance = self
        logger.info("[MediAI] Agent instance registered for vision tools")

    def _process_video_frame_sync(self,
                                  frame: rtc.VideoFrame) -> Optional[bytes]:
        """Process video frame synchronously - returns base64 encoded image data.
        
        SIMPLIFIED VERSION: Avoids numpy to prevent SIGILL crashes on CPUs without AVX.
        Uses only LiveKit's native frame conversion and basic Python operations.
        
        Returns base64 encoded RGB bytes that Gemini can process directly.
        """
        rgba_frame = None
        img = None
        img_buffer = None
        
        try:
            logger.debug("[Vision] Starting frame conversion to RGBA...")
            rgba_frame = frame.convert(VideoBufferType.RGBA)

            height = rgba_frame.height
            width = rgba_frame.width
            logger.debug(f"[Vision] RGBA frame: {width}x{height}")

            # Get raw RGBA bytes from the frame buffer
            rgba_bytes = bytes(rgba_frame.data)
            
            if PIL_AVAILABLE:
                # Use PIL to create image from raw bytes (no numpy needed)
                logger.debug("[Vision] Creating PIL Image from raw bytes...")
                img = Image.frombytes('RGBA', (width, height), rgba_bytes)
                
                # Convert RGBA to RGB
                img = img.convert('RGB')
                
                # Resize to reduce data size
                logger.debug("[Vision] Resizing image to 480x480...")
                img = img.resize((480, 480), Image.Resampling.BILINEAR)

                logger.debug("[Vision] Encoding to JPEG...")
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='JPEG', quality=60)
                frame_bytes = img_buffer.getvalue()
                
                img_buffer.close()
                del img
                img = None
            else:
                # Fallback: Return raw RGBA bytes encoded as base64
                # Gemini can process raw image data with proper mime type
                logger.debug("[Vision] PIL not available, using raw bytes...")
                frame_bytes = rgba_bytes
            
            del rgba_frame
            rgba_frame = None

            logger.debug(f"[Vision] Frame processed successfully: {len(frame_bytes)} bytes")
            gc.collect()
            return frame_bytes

        except MemoryError as e:
            logger.error(f"[Vision] Memory error in frame processing: {e}")
            gc.collect()
            return None
        except Exception as e:
            logger.error(f"[Vision] Error in sync frame processing: {e}")
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

    async def capture_and_analyze_patient(self) -> Optional[str]:
        """Capture a single frame from the patient's camera and analyze it with Gemini Vision.
        
        This is an ON-DEMAND vision function - only captures when requested by the patient.
        After analysis, memory is cleaned up to prevent leaks.
        Uses async context manager for proper resource cleanup.
        
        IMPORTANT: Discards buffered frames to get the most recent frame.
        
        Returns:
            Description of what was seen, or None if capture/analysis failed.
        """
        frame_bytes = None
        temp_stream = None

        try:
            if not self.room.remote_participants:
                logger.warning("[Vision] No remote participants found")
                return None

            # Filter out avatar agents - we want the real patient, not the avatar
            avatar_identities = ['bey-avatar-agent', 'tavus-avatar', 'avatar-agent']
            patient_participant = None
            
            for p in self.room.remote_participants.values():
                # Skip avatar agents
                if p.identity.lower() in avatar_identities or 'avatar' in p.identity.lower():
                    logger.info(f"[Vision] Skipping avatar participant: {p.identity}")
                    continue
                patient_participant = p
                break
            
            if not patient_participant:
                logger.warning("[Vision] No patient participant found (only avatar agents)")
                return None
                
            participant = patient_participant
            logger.info(f"[Vision] Patient participant: {participant.identity}")
            
            video_track = None

            for track_pub in participant.track_publications.values():
                if track_pub.kind == rtc.TrackKind.KIND_VIDEO and track_pub.subscribed:
                    video_track = track_pub.track
                    logger.info(f"[Vision] Found video track: {track_pub.sid}")
                    break

            if not video_track:
                logger.warning(
                    "[Vision] No video track available from patient")
                return None

            temp_stream = rtc.VideoStream(video_track)

            try:
                latest_frame = None
                latest_timestamp = 0
                frames_discarded = 0
                
                start_time = asyncio.get_event_loop().time()
                current_time_us = int(time.time() * 1_000_000)
                
                while True:
                    try:
                        frame_event = await asyncio.wait_for(
                            temp_stream.__anext__(), 
                            timeout=0.2
                        )
                        frame = frame_event.frame
                        
                        if frame is not None and frame.width > 0 and frame.height > 0:
                            frame_timestamp = getattr(frame_event, 'timestamp_us', 0) or getattr(frame, 'timestamp_us', 0) or 0
                            
                            if frame_timestamp == 0 or frame_timestamp > latest_timestamp:
                                latest_frame = frame
                                latest_timestamp = frame_timestamp
                                frames_discarded += 1
                        
                        if asyncio.get_event_loop().time() - start_time > 1.0:
                            break
                            
                    except asyncio.TimeoutError:
                        break
                
                if frames_discarded > 1:
                    logger.info(f"[Vision] Discarded {frames_discarded - 1} buffered frames, using latest")
                    if latest_timestamp > 0:
                        age_ms = (current_time_us - latest_timestamp) / 1000
                        logger.info(f"[Vision] Frame timestamp: {latest_timestamp}, age: ~{age_ms:.0f}ms")
                
                if latest_frame is None:
                    logger.info("[Vision] No frames in buffer, waiting for fresh frame...")
                    try:
                        frame_event = await asyncio.wait_for(
                            temp_stream.__anext__(), 
                            timeout=5.0
                        )
                        latest_frame = frame_event.frame
                    except asyncio.TimeoutError:
                        logger.warning("[Vision] Timeout waiting for video frame")
                        return None

                if latest_frame is None:
                    logger.warning("[Vision] Received null frame")
                    return None
                    
                if latest_frame.width <= 0 or latest_frame.height <= 0:
                    logger.warning(f"[Vision] Invalid frame dimensions: {latest_frame.width}x{latest_frame.height}")
                    return None

                logger.info(f"[Vision] Frame dimensions: {latest_frame.width}x{latest_frame.height}")

                frame_bytes = await asyncio.to_thread(
                    self._process_video_frame_sync, latest_frame)
                
                latest_frame = None

                if not frame_bytes:
                    logger.warning("[Vision] Failed to process frame")
                    return None

                logger.info(
                    f"[Vision] 👁️ Captured frame ({len(frame_bytes)} bytes), analyzing with Gemini..."
                )

                vision_model = genai.GenerativeModel('gemini-2.0-flash')

                # Send image bytes directly to Gemini without PIL processing
                # Gemini accepts JPEG bytes directly via inline_data
                image_part = {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": base64.b64encode(frame_bytes).decode('utf-8')
                    }
                }
                
                logger.info(f"[Vision] Sending {len(frame_bytes)} bytes to Gemini...")
                
                frame_bytes = None

                prompt = """Você é uma assistente médica virtual brasileira. Descreva EXATAMENTE o que você vê nesta imagem do paciente.

REGRAS IMPORTANTES:
- Responda em português brasileiro
- Descreva APENAS o que você realmente vê na imagem - NÃO invente ou suponha detalhes
- Seja específica sobre cores de roupas, características visíveis, ambiente
- Se algo não está claro, diga que não consegue ver bem
- Seja breve (2-3 frases)
- Foque em aspectos relevantes para saúde (expressão facial, postura, sinais visíveis)
- Seja profissional e respeitosa
- NÃO faça diagnósticos

Descreva PRECISAMENTE o que você vê nesta imagem:"""

                response = await asyncio.to_thread(
                    lambda: vision_model.generate_content([prompt, image_part]))

                description = response.text if response.text else "Não foi possível analisar a imagem."
                
                logger.info(f"[Vision] Gemini response: {description}")

                if self.metrics_collector:
                    self.metrics_collector.vision_input_tokens += 258
                    self.metrics_collector.vision_output_tokens += len(
                        description) // 4

                response = None

                logger.info(f"[Vision] ✅ Analysis complete")
                return description

            except asyncio.TimeoutError:
                logger.warning("[Vision] Timeout waiting for video frame")
                return None

        except Exception as e:
            logger.error(f"[Vision] Error in capture_and_analyze_patient: {e}")
            import traceback
            logger.error(f"[Vision] Traceback: {traceback.format_exc()}")
            return None
        finally:
            if temp_stream is not None:
                try:
                    await temp_stream.aclose()
                except Exception:
                    pass
            frame_bytes = None
            gc.collect()

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

        logger.info("[MediAI] 🎤 Generating initial greeting in PT-BR...")
        
        # Use session.say() instead of generate_reply() to avoid collision with 
        # LiveKit's internal _realtime_reply_task flow. session.say() is the 
        # recommended approach for agent-initiated speech.
        initial_greeting = "Olá! Seja muito bem-vindo à MediAI. Eu sou sua assistente médica virtual e estou aqui para ajudá-lo hoje. Como você está se sentindo? Pode me contar o que te traz aqui?"

        # Rastrear como LLM output
        if self.metrics_collector:
            self.metrics_collector.track_llm(input_text=initial_greeting)

        # Use session.say() for agent-initiated greeting - this is the safe approach
        # that doesn't conflict with LiveKit's internal generation management
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if self._agent_session:
                    # session.say() sends text directly to TTS without waiting for LLM
                    # This avoids the generate_reply timeout issue
                    await self._agent_session.say(initial_greeting)
                    logger.info("[MediAI] ✅ Initial greeting sent successfully via session.say()")
                    break
                else:
                    logger.error("[MediAI] ❌ Agent session not available")
                    break
            except Exception as e:
                logger.warning(f"[MediAI] ⚠️ session.say() attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    # Wait before retry with exponential backoff
                    wait_time = 2 ** attempt
                    logger.info(f"[MediAI] 🔄 Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"[MediAI] ❌ Failed to send greeting after {max_retries} attempts")
                    # Session will still be active for user-initiated conversations

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

    # Select Gemini model (native audio or standard realtime)
    gemini_model = os.getenv('GEMINI_LLM_MODEL', 'gemini-2.5-flash')
    logger.info(f"[MediAI] 🎙️ Using Gemini model: {gemini_model}")

    # Check if vision is enabled
    vision_enabled = os.getenv('ENABLE_VISION', 'false').lower() == 'true'

    system_prompt = f"""Você é MediAI, uma assistente médica virtual brasileira especializada em triagem de pacientes e orientação de saúde.

CAPACIDADES IMPORTANTES:
✅ VOCÊ PODE VER O PACIENTE - Quando solicitado, você pode olhar para o paciente através da câmera usando a função look_at_patient
✅ Use a função look_at_patient quando o paciente perguntar "você consegue me ver?", "olhe para mim", ou quando precisar observar algo visualmente
✅ VOCÊ PODE AGENDAR CONSULTAS - Você tem acesso aos médicos cadastrados na plataforma e pode agendar consultas reais
✅ Você pode buscar médicos por especialidade e verificar disponibilidade de horários

VISÃO SOB DEMANDA:
- Você NÃO está vendo o paciente continuamente (para economizar recursos)
- Quando o paciente pedir para você olhar, use a função look_at_patient
- A função captura uma imagem, analisa, e te dá uma descrição do que vê
- Use essa capacidade com tato e profissionalismo
- Após usar a função, descreva naturalmente o que viu ao paciente

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
    agent = MediAIAgent(instructions=system_prompt,
                        room=ctx.room,
                        metrics_collector=metrics_collector,
                        patient_id=patient_id)

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

    # Vision capability - ON-DEMAND ONLY to prevent memory leaks
    # The AI can use look_at_patient() tool when patient asks to be seen
    # No continuous streaming - much lower memory footprint
    enable_vision = os.getenv('ENABLE_VISION', 'false').lower() == 'true'

    if enable_vision:
        logger.info(
            "[MediAI] 👁️ Vision enabled (on-demand) - AI can see patient when requested")
        logger.info(
            "[MediAI] 💡 Patient can ask 'você consegue me ver?' to trigger vision analysis")
    else:
        logger.info(
            "[MediAI] 👁️ Vision disabled (set ENABLE_VISION=true to enable)")

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
                    elapsed_minutes = (time.time() -
                                       metrics_collector.session_start) / 60
                    estimated_tokens_per_minute = 50

                    # Esta é uma estimativa conservadora
                    # Tokens reais serão capturados se disponíveis via callbacks
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
