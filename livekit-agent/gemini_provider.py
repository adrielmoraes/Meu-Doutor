"""
Gemini API Provider for LiveKit Agent
Custom provider that uses Google's Gemini API for STT, LLM, and TTS.
"""

import os
import asyncio
import base64
from typing import AsyncIterator, Optional
import google.generativeai as genai
from livekit import agents
from livekit.agents import stt, llm, tts


class GeminiSTT(stt.STT):
    """Speech-to-Text using Gemini Multimodal API."""
    
    def __init__(self, *, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError('GEMINI_API_KEY not found in environment')
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    async def recognize(
        self,
        *,
        buffer: agents.AudioBuffer,
        language: str = "pt-BR"
    ) -> stt.SpeechEvent:
        """Recognize speech from audio buffer."""
        # Convert audio buffer to base64
        audio_data = base64.b64encode(buffer.data).decode('utf-8')
        
        # Send to Gemini for transcription
        response = await asyncio.to_thread(
            self.model.generate_content,
            [
                {
                    'mime_type': 'audio/wav',
                    'data': audio_data
                },
                f"Transcreva este áudio em português brasileiro. Retorne apenas o texto transcrito, sem explicações."
            ]
        )
        
        text = response.text.strip()
        
        return stt.SpeechEvent(
            type=stt.SpeechEventType.FINAL_TRANSCRIPT,
            alternatives=[
                stt.SpeechData(
                    text=text,
                    language=language,
                    confidence=0.95
                )
            ]
        )


class GeminiLLM(llm.LLM):
    """Large Language Model using Gemini API."""
    
    def __init__(
        self,
        *,
        model: str = "gemini-2.0-flash-exp",
        api_key: Optional[str] = None,
        instructions: str = ""
    ):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError('GEMINI_API_KEY not found in environment')
        
        genai.configure(api_key=self.api_key)
        self.model_name = model
        self.instructions = instructions
        self.model = genai.GenerativeModel(
            model,
            system_instruction=instructions
        )
        self.chat = None
    
    async def chat_completion(
        self,
        *,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> llm.ChatCompletion:
        """Generate chat completion."""
        # Convert messages to Gemini format
        history = []
        for msg in messages[:-1]:  # All except last
            role = "user" if msg.role == "user" else "model"
            history.append({
                "role": role,
                "parts": [msg.content]
            })
        
        # Initialize chat if needed
        if not self.chat:
            self.chat = self.model.start_chat(history=history)
        
        # Send last message
        last_message = messages[-1].content
        
        response = await asyncio.to_thread(
            self.chat.send_message,
            last_message,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens
            )
        )
        
        return llm.ChatCompletion(
            choices=[
                llm.Choice(
                    index=0,
                    message=llm.ChatMessage(
                        role="assistant",
                        content=response.text
                    )
                )
            ]
        )


class GeminiTTS(tts.TTS):
    """Text-to-Speech using Gemini 2.5 TTS API."""
    
    def __init__(
        self,
        *,
        voice: str = "Kore",
        api_key: Optional[str] = None
    ):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError('GEMINI_API_KEY not found in environment')
        
        genai.configure(api_key=self.api_key)
        self.voice = voice
        self.client = genai.Client(api_key=self.api_key)
    
    async def synthesize(
        self,
        *,
        text: str
    ) -> agents.AudioBuffer:
        """Synthesize speech from text."""
        from google.genai import types
        
        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model="gemini-2.5-flash-preview-tts",
            contents=text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=self.voice,
                        )
                    )
                ),
            )
        )
        
        # Extract audio data
        audio_data = response.candidates[0].content.parts[0].inline_data.data
        audio_bytes = base64.b64decode(audio_data)
        
        # Convert to AudioBuffer
        return agents.AudioBuffer(
            data=audio_bytes,
            sample_rate=24000,
            num_channels=1
        )
    
    async def stream(
        self,
        *,
        text: str
    ) -> AsyncIterator[agents.AudioBuffer]:
        """Stream synthesized speech (Gemini doesn't support streaming TTS yet)."""
        # For now, just yield the complete audio
        buffer = await self.synthesize(text=text)
        yield buffer
