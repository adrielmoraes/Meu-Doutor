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
import numpy as np
from PIL import Image

from tenacity import (retry, stop_after_attempt, wait_exponential,
                      retry_if_exception_type, before_sleep_log)

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

# Fail-fast validation: Check critical environment variables before starting
# Note: Only GEMINI_API_KEY is truly required; DATABASE_URL is optional (agent can run without metrics)
required_vars = ['GEMINI_API_KEY']
missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    raise RuntimeError(f"CRITICAL: Missing required environment variables: {', '.join(missing)}")

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

        # Últimos valores enviados (para calcular deltas)
        self.last_sent_stt = 0
        self.last_sent_llm_input = 0
        self.last_sent_llm_output = 0
        self.last_sent_tts = 0
        self.last_sent_vision_input = 0
        self.last_sent_vision_output = 0
        self.last_sent_active_seconds = 0

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
                     tts_cost_usd + vision_input_cost_usd +
                     vision_output_cost_usd)

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

        # Verificar se há mudanças para enviar
        if (delta_stt == 0 and delta_llm_input == 0 and delta_llm_output == 0
                and delta_tts == 0 and delta_vision_input == 0
                and delta_vision_output == 0 and delta_active_seconds == 0):
            logger.debug(
                "[Metrics] Nenhuma mudança desde último envio - pulando")
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
                          delta_vision_input_cost_usd +
                          delta_vision_output_cost_usd)
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
            result = await conn.fetchrow("SELECT avatar_provider FROM admin_settings LIMIT 1")

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
        return "Erro: Database não configurado"

    try:
        async with pool.acquire() as conn:
            patient = await conn.fetchrow(
                """
                SELECT name, email, age, reported_symptoms, doctor_notes, exam_results
                FROM patients WHERE id = $1
                """, patient_id)

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


async def _get_available_slots_impl(doctor_id: str, date: str) -> dict:
    """
    Busca horários disponíveis de um médico para uma data específica.
    Use esta função após o paciente escolher um médico e antes de agendar.
    
    Args:
        doctor_id: ID do médico escolhido
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

    try:
        async with httpx.AsyncClient() as client:
            url = f"{NEXT_PUBLIC_URL}/api/ai-agent/schedule"
            params = {"doctorId": doctor_id, "date": date}
            headers = {"x-agent-secret": AGENT_SECRET}

            logger.info(
                f"[AI Tools] Buscando horários: {url} (médico={doctor_id}, data={date})"
            )
            response = await client.get(url,
                                        params=params,
                                        headers=headers,
                                        timeout=10.0)
            response.raise_for_status()

            data = response.json()
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
            logger.warning(f"[Schedule] Tentativa de agendar no passado: {date}")
            return {
                "success": False, 
                "error": "Não é possível agendar consultas em datas passadas. Por favor, escolha uma data futura."
            }
        
        # Validar formato de horários
        dt.strptime(start_time, '%H:%M')
        dt.strptime(end_time, '%H:%M')
        
        # Validar que end_time é após start_time
        start_dt = dt.strptime(start_time, '%H:%M')
        end_dt = dt.strptime(end_time, '%H:%M')
        if end_dt <= start_dt:
            logger.warning(f"[Schedule] Horário de término antes do início: {start_time} - {end_time}")
            return {
                "success": False,
                "error": "O horário de término deve ser posterior ao horário de início."
            }
            
    except ValueError as ve:
        logger.error(f"[Schedule] Validação de entrada falhou: {ve}")
        return {
            "success": False,
            "error": f"Formato de data ou horário inválido. Use YYYY-MM-DD para data e HH:MM para horários."
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
    # Obter patient_id do agent instance com validação de tipo segura
    try:
        # Type-safe cast to access patient_id attribute
        from typing import cast
        agent = cast(MediAIAgent, context.agent)
        patient_id = agent.patient_id
        
        if not patient_id:
            raise ValueError("Patient ID is None")
            
    except (AttributeError, ValueError) as e:
        logger.error(f"[Tools] Patient ID not available in agent context: {e}")
        return {"success": False, "error": "Erro interno: ID do paciente não disponível"}

    return await _schedule_appointment_impl(doctor_id=doctor_id,
                                            patient_id=patient_id,
                                            patient_name=patient_name,
                                            date=date,
                                            start_time=start_time,
                                            end_time=end_time,
                                            notes=notes)


class MediAIAgent(Agent):
    """MediAI Voice Agent with Gemini Live Native Vision"""

    def __init__(self,
                 instructions: str,
                 room: rtc.Room,
                 metrics_collector: Optional[MetricsCollector] = None,
                 patient_id: str = None):
        # Register function tools with the Agent
        super().__init__(
            instructions=instructions,
            tools=[search_doctors, get_available_slots, schedule_appointment])
        self.room = room
        self.metrics_collector = metrics_collector
        self._metrics_task = None
        self.base_instructions = instructions
        self.patient_id = patient_id
        self.last_transcription = ""
        self.doctor_search_cache = None
        self.last_doctor_search_time = 0
        self._agent_session = None  # Will be set after session creation
        self.last_frame_send_time = 0  # For 0.5 FPS throttling (2 seconds between frames)
        self._video_stream = None  # Cached VideoStream to avoid recreating each frame
        self._current_video_track = None  # Track the current video track

    def _process_video_frame_sync(self, frame: rtc.VideoFrame) -> Optional[bytes]:
        """Process video frame synchronously in separate thread (ALL CPU-bound operations).
        
        CRITICAL: This runs in a separate thread to avoid blocking the event loop.
        ALL heavy operations (YUV->RGBA conversion, numpy, PIL, resize, JPEG encoding) happen here.
        
        MEMORY OPTIMIZATION: Explicitly delete large objects and force garbage collection.
        """
        try:
            rgba_frame = frame.convert(VideoBufferType.RGBA)
            
            height = rgba_frame.height
            width = rgba_frame.width

            rgba_array = np.frombuffer(rgba_frame.data, dtype=np.uint8)
            rgba_array = rgba_array.reshape((height, width, 4))

            rgb_array = rgba_array[:, :, :3].copy()
            rgba_array = None
            
            img = Image.fromarray(rgb_array, 'RGB')
            rgb_array = None
            
            img = img.resize((480, 480), Image.Resampling.BILINEAR)

            img_buffer = io.BytesIO()
            img.save(img_buffer, format='JPEG', quality=60)
            frame_bytes = img_buffer.getvalue()
            
            img_buffer.close()
            img = None
            rgba_frame = None
            
            gc.collect()
            return frame_bytes
            
        except Exception as e:
            logger.debug(f"[Vision] Error in sync frame processing: {e}")
            gc.collect()
            return None

    async def send_video_frame_to_gemini(self):
        """Send video frames to Gemini Live API at 0.5 FPS (every 2 seconds) for native vision.
        
        MEMORY OPTIMIZATION: Reuses VideoStream, cleans up buffers after sending.
        """
        current_time = time.time()
        if current_time - self.last_frame_send_time < 2.0:
            return

        self.last_frame_send_time = current_time
        frame_bytes = None

        try:
            if not self.room.remote_participants:
                return

            participant = list(self.room.remote_participants.values())[0]
            video_track = None

            for track_pub in participant.track_publications.values():
                if track_pub.kind == rtc.TrackKind.KIND_VIDEO and track_pub.subscribed:
                    video_track = track_pub.track
                    break

            if not video_track:
                return

            if self._current_video_track != video_track or self._video_stream is None:
                self._video_stream = rtc.VideoStream(video_track)
                self._current_video_track = video_track
                logger.info("[Vision] Created new VideoStream for track")

            frame_event = await asyncio.wait_for(self._video_stream.__anext__(),
                                                 timeout=3.0)
            frame = frame_event.frame
            
            if frame is None:
                return
            
            frame_bytes = await asyncio.to_thread(
                self._process_video_frame_sync, frame
            )
            
            if not frame_bytes:
                return

            if self._agent_session:
                encoded_data = base64.b64encode(frame_bytes).decode('utf-8')
                await self._agent_session.send_realtime_input(
                    video=types.Blob(
                        data=encoded_data,
                        mime_type="image/jpeg"
                    )
                )
                del encoded_data
                logger.info(
                    f"[Vision] 📹 Sent 480x480 frame to Gemini ({len(frame_bytes)} bytes)"
                )
                
                if self.metrics_collector:
                    self.metrics_collector.vision_input_tokens += 130

        except asyncio.TimeoutError:
            pass
        except Exception as e:
            logger.debug(f"[Vision] Error sending frame: {e}")
        finally:
            del frame_bytes
            gc.collect()

    async def on_enter(self):
        """Called when agent enters the session - generates initial greeting"""

        # Wait 5 seconds for Tavus avatar to fully load and sync audio/video
        logger.info(
            "[MediAI] ⏳ Waiting for avatar to be visible and audio/video to sync..."
        )
        await asyncio.sleep(5)

        # Start metrics periodic flush
        if self.metrics_collector:
            self._metrics_task = asyncio.create_task(
                self.metrics_collector.start_periodic_flush())

        logger.info("[MediAI] 🎤 Generating initial greeting in PT-BR...")
        initial_greeting = "Cumprimente o paciente calorosamente pelo nome em PORTUGUÊS BRASILEIRO claro e pergunte como pode ajudá-lo hoje com sua saúde. Seja natural, breve e acolhedora. IMPORTANTE: Fale EXCLUSIVAMENTE em português brasileiro."

        # Rastrear como LLM output
        if self.metrics_collector:
            self.metrics_collector.track_llm(input_text=initial_greeting)

        await self._agent_session.generate_reply(instructions=initial_greeting)

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
            pool = await asyncpg.create_pool(
                database_url,
                min_size=1,
                max_size=5,
                command_timeout=10
            )
            logger.info("[MediAI] 💾 Database connection pool created")
        except Exception as pool_error:
            logger.error(f"[MediAI] Failed to create database pool: {pool_error}")

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

    system_prompt = f"""Você é MediAI, uma assistente médica virtual brasileira especializada em triagem de pacientes e orientação de saúde.

CAPACIDADES IMPORTANTES:
✅ VOCÊ TEM VISÃO EM TEMPO REAL - Gemini Live Native Vision integrada! Você recebe frames da câmera do paciente diretamente via send_realtime_input()
✅ Você consegue VER o paciente através da câmera dele em tempo real (1 frame por segundo)
✅ Use suas capacidades de visão integrada quando relevante - não invente o que não vê
✅ Se não conseguir ver algo claramente, seja honesta sobre isso
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
- Você pode VER o paciente, então mencione isso naturalmente se relevante

DIRETRIZES MÉDICAS IMPORTANTES:
1. NUNCA faça diagnósticos definitivos - você faz avaliação preliminar
2. SEMPRE sugira consulta médica presencial quando apropriado
3. Em casos de emergência, instrua o paciente a procurar atendimento IMEDIATO
4. Seja clara sobre suas limitações como assistente virtual
5. Mantenha tom profissional mas acolhedor
6. Use informações visuais quando relevante (ex: "Vejo que você está...")

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
5. Use o contexto visual para enriquecer a avaliação
6. Ao final, resuma o que foi discutido e forneça orientações preliminares
7. Se apropriado, ofereça agendar consulta com especialista

IMPORTANTE: Mantenha suas respostas curtas e objetivas. Faça perguntas uma de cada vez e aguarde a resposta do paciente antes de continuar. Seja natural e conversacional.

CAPACIDADES VISUAIS EM TEMPO REAL:
Você recebe frames de vídeo ao vivo do paciente (1 frame por segundo) através da sua capacidade de visão integrada. Se notar algo visualmente relevante para o atendimento médico (expressão de dor, ferimento visível, dificuldade de respiração, sinais físicos), mencione com tato e profissionalismo quando apropriado.

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
            model=gemini_model,  # Using selected model (native audio or standard realtime)
            voice="Erinome",  # Female voice optimized for Portuguese (pt-BR)
            temperature=0.5,  # Lower for more consistent responses and pronunciation
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
    
    async def stream_video_to_gemini():
        """Background task to send video frames to Gemini Live API at 0.5 FPS (every 2s)."""
        try:
            await asyncio.sleep(5)
            logger.info("[Vision] 📹 Starting vision streaming at 0.5 FPS (memory optimized)...")
            
            while True:
                await agent.send_video_frame_to_gemini()
                await asyncio.sleep(2.0)
                gc.collect()
        except asyncio.CancelledError:
            logger.info("[Vision] 🛑 Video streaming stopped")
    
    # Store task reference for cleanup in finally block
    video_streaming_task = asyncio.create_task(stream_video_to_gemini())
    logger.info("[MediAI] 🎥 Gemini Live native vision enabled - AI can see patient in real-time")

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

        # Stop video streaming task and cleanup VideoStream
        if 'video_streaming_task' in locals() and video_streaming_task:
            logger.info("[Vision] Stopping video streaming...")
            video_streaming_task.cancel()
            try:
                await video_streaming_task
            except asyncio.CancelledError:
                pass
        
        # Cleanup VideoStream cache
        if 'agent' in locals() and agent:
            agent._video_stream = None
            agent._current_video_track = None
            gc.collect()

        # Stop tracking task
        if 'tracking_task' in locals() and tracking_task:
            tracking_task.cancel()
            try:
                await tracking_task
            except asyncio.CancelledError:
                pass

        # Stop metrics collector and send final metrics
        if 'metrics_collector' in locals() and metrics_collector:
            await metrics_collector.stop()

        # Close database connection pool
        if 'pool' in locals() and pool:
            logger.info("[MediAI] 💾 Closing database connection pool...")
            await pool.close()

        logger.info("[MediAI] ✅ Cleanup complete")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        num_idle_processes=0,
        job_memory_warn_mb=800,
        job_memory_limit_mb=1500,
    ))
