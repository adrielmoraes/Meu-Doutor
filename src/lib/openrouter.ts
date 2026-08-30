/**
 * OpenRouter AI Client Integration
 * 
 * Provides unified access to hundreds of AI models via OpenRouter (https://openrouter.ai).
 * Supports standard chat completions, real-time streaming, structured JSON output,
 * and seamless fallback across providers (DeepSeek, Anthropic Claude, Meta Llama, OpenAI, Google).
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
  name?: string;
}

export interface OpenRouterModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  recommendedFor: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
}

export const OPENROUTER_MODELS: Record<string, OpenRouterModelInfo> = {
  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Modelo de altíssimo desempenho com custo ultrabaixo e excelente raciocínio clínico.',
    contextLength: 64000,
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    recommendedFor: 'Consultas médicas gerais, triagem, resumos de prontuário e análises rápidas',
    supportsVision: false,
    supportsStreaming: true,
  },
  'deepseek/deepseek-r1': {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (Reasoning)',
    provider: 'DeepSeek',
    description: 'Modelo de raciocínio profundo com cadeias de pensamento detalhadas para diagnósticos complexos.',
    contextLength: 64000,
    inputCostPer1M: 0.55,
    outputCostPer1M: 2.19,
    recommendedFor: 'Diagnósticos diferenciais complexos, interpretação cruzada de exames múltiplos e pareceres especializados',
    supportsVision: false,
    supportsStreaming: true,
  },
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Líder em precisão na análise de documentos médicos extensos, empatia e redação clínica.',
    contextLength: 200000,
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    recommendedFor: 'Laudos detalhados, redação de documentos formais e acolhimento terapêutico',
    supportsVision: true,
    supportsStreaming: true,
  },
  'meta-llama/llama-3.3-70b-instruct': {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    description: 'Modelo open-source de alta performance e grande confiabilidade clínica.',
    contextLength: 128000,
    inputCostPer1M: 0.12,
    outputCostPer1M: 0.30,
    recommendedFor: 'Chat geral, dicas de bem-estar e interações conversacionais contínuas',
    supportsVision: false,
    supportsStreaming: true,
  },
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: 'OpenAI',
    description: 'Modelo multimodal de alta fidelidade e raciocínio estruturado.',
    contextLength: 128000,
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    recommendedFor: 'Análise multimodal de imagens médicas, gráficos e exames visuais',
    supportsVision: true,
    supportsStreaming: true,
  },
  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Versão rápida e econômica do GPT-4o.',
    contextLength: 128000,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    recommendedFor: 'Triagem inicial e validações rápidas',
    supportsVision: true,
    supportsStreaming: true,
  },
  'google/gemini-3.5-flash': {
    id: 'google/gemini-3.5-flash',
    name: 'Gemini 3.5 Flash (OpenRouter)',
    provider: 'Google via OpenRouter',
    description: 'Nova geração Gemini 3.5 com raciocínio clínico de ponta e altíssima velocidade.',
    contextLength: 1000000,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    recommendedFor: 'Roteiros de podcasts, planos de bem-estar e consultas médicas',
    supportsVision: true,
    supportsStreaming: true,
  },
  'google/gemini-2.0-flash-001': {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash (OpenRouter)',
    provider: 'Google via OpenRouter',
    description: 'Excelente velocidade, multimodalidade nativa e contexto expandido.',
    contextLength: 1000000,
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
    recommendedFor: 'Grandes históricos clínicos e alta velocidade de resposta',
    supportsVision: true,
    supportsStreaming: true,
  },
};

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-3.5-flash';

/**
 * Checks if OpenRouter is configured with a valid API key
 */
export function isOpenRouterConfigured(): boolean {
  const key = process.env.OPENROUTER_API_KEY;
  return Boolean(key && key.trim().length > 10);
}

/**
 * Get the OpenRouter API Key
 */
export function getOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY não configurada no arquivo .env');
  }
  return key.trim();
}

/**
 * Get standard headers for OpenRouter API requests
 */
function getOpenRouterHeaders(apiKey: string): Record<string, string> {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.appmediai.com';
  const siteName = process.env.OPENROUTER_SITE_NAME || 'MediAI - Plataforma Médica Inteligente';

  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': siteUrl,
    'X-Title': siteName,
  };
}

export interface OpenRouterChatOptions {
  messages: OpenRouterMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  responseFormat?: { type: 'json_object' } | { type: 'text' };
  systemPrompt?: string;
  abortSignal?: AbortSignal;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterChatResponse {
  id: string;
  model: string;
  content: string;
  role: 'assistant';
  finishReason?: string;
  usage?: OpenRouterUsage;
  estimatedCostUsd?: number;
}

/**
 * Executes a standard Chat Completion request via OpenRouter
 */
export async function openRouterChatCompletion(options: OpenRouterChatOptions): Promise<OpenRouterChatResponse> {
  const apiKey = getOpenRouterApiKey();
  const model = options.model || process.env.OPENROUTER_DEFAULT_MODEL || DEFAULT_OPENROUTER_MODEL;

  const messages: OpenRouterMessage[] = [];

  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }

  messages.push(...options.messages);

  const payload: Record<string, any> = {
    model: model,
    messages: messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.maxTokens) {
    payload.max_tokens = options.maxTokens;
  }
  if (options.topP !== undefined) {
    payload.top_p = options.topP;
  }
  if (options.responseFormat) {
    payload.response_format = options.responseFormat;
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: getOpenRouterHeaders(apiKey),
    body: JSON.stringify(payload),
    signal: options.abortSignal || AbortSignal.timeout(120000), // 120s timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice || !choice.message) {
    throw new Error('Nenhuma resposta válida recebida da OpenRouter');
  }

  const usage: OpenRouterUsage = data.usage || {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };

  // Calcula custo estimado baseado no modelo
  const modelMeta = OPENROUTER_MODELS[model];
  let estimatedCostUsd = 0;
  if (modelMeta && usage) {
    const inputCost = (usage.prompt_tokens / 1_000_000) * modelMeta.inputCostPer1M;
    const outputCost = (usage.completion_tokens / 1_000_000) * modelMeta.outputCostPer1M;
    estimatedCostUsd = inputCost + outputCost;
  }

  return {
    id: data.id || `openrouter-${Date.now()}`,
    model: data.model || model,
    content: choice.message.content || '',
    role: 'assistant',
    finishReason: choice.finish_reason,
    usage: usage,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
  };
}

/**
 * Executes a structured JSON output completion and parses the response
 */
export async function openRouterGenerateStructured<T = any>(params: {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
}): Promise<{ data: T; usage?: OpenRouterUsage; model: string }> {
  const jsonSystemInstruction = `${params.systemPrompt || ''}\n\nIMPORTANTE: Sua resposta DEVE SER EXCLUSIVAMENTE um objeto JSON válido. Não inclua blocos markdown com crases (como \`\`\`json) ou qualquer outro texto antes ou depois do JSON.`;

  const response = await openRouterChatCompletion({
    model: params.model,
    systemPrompt: jsonSystemInstruction,
    messages: [{ role: 'user', content: params.prompt }],
    temperature: params.temperature ?? 0.2,
    responseFormat: { type: 'json_object' },
  });

  let raw = response.content.trim();
  // Remove potenciais wrappers de markdown se presentes
  if (raw.startsWith('```json')) {
    raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  } else if (raw.startsWith('```')) {
    raw = raw.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  try {
    const parsed = JSON.parse(raw) as T;
    return {
      data: parsed,
      usage: response.usage,
      model: response.model,
    };
  } catch (parseError: any) {
    throw new Error(`Falha ao decodificar JSON retornado pelo modelo ${response.model}: ${parseError.message}. Conteúdo recebido: ${raw.slice(0, 300)}`);
  }
}

/**
 * Streams chat completion tokens in real-time from OpenRouter
 */
export async function* openRouterStreamChatCompletion(options: OpenRouterChatOptions): AsyncGenerator<string, void, unknown> {
  const apiKey = getOpenRouterApiKey();
  const model = options.model || process.env.OPENROUTER_DEFAULT_MODEL || DEFAULT_OPENROUTER_MODEL;

  const messages: OpenRouterMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push(...options.messages);

  const payload: Record<string, any> = {
    model: model,
    messages: messages,
    temperature: options.temperature ?? 0.7,
    stream: true,
  };

  if (options.maxTokens) payload.max_tokens = options.maxTokens;
  if (options.topP !== undefined) payload.top_p = options.topP;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: getOpenRouterHeaders(apiKey),
    body: JSON.stringify(payload),
    signal: options.abortSignal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter Stream Error (${response.status}): ${errText}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream não retornado pela OpenRouter');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // Skip comments/keepalives
        if (trimmed === 'data: [DONE]') return;

        if (trimmed.startsWith('data: ')) {
          try {
            const jsonStr = trimmed.slice(6);
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              yield delta;
            }
          } catch {
            // Ignora chunks incompletos ou dados de cabeçalho
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const OPENROUTER_TTS_FALLBACK_MODELS = [
  'google/gemini-3.1-flash-tts-preview',
  'deepgram/flux-tts:free',
  'qwen/qwen-audio-3.0-tts-plus',
  'qwen/qwen-audio-3.0-tts-flash',
  'openai/gpt-audio-mini',
] as const;

/**
 * Generates raw PCM16 Audio buffer via OpenRouter Audio Models with automatic fallback:
 * 1. google/gemini-3.1-flash-tts-preview
 * 2. deepgram/flux-tts:free
 * 3. qwen/qwen-audio-3.0-tts-plus
 * 4. qwen/qwen-audio-3.0-tts-flash
 * 5. openai/gpt-audio-mini (Garantia de entrega)
 */
export async function openRouterTextToSpeech(options: {
  text: string;
  voice?: 'coral' | 'ash' | 'alloy' | 'shimmer' | 'sage' | 'echo';
  model?: string;
  abortSignal?: AbortSignal;
}): Promise<Buffer> {
  const apiKey = getOpenRouterApiKey();
  const voice = options.voice || 'coral';
  const modelsToTry = options.model ? [options.model, ...OPENROUTER_TTS_FALLBACK_MODELS] : [...OPENROUTER_TTS_FALLBACK_MODELS];

  let lastError: any;

  for (let mIndex = 0; mIndex < modelsToTry.length; mIndex++) {
    const currentModel = modelsToTry[mIndex];

    try {
      console.log(`[OpenRouter Audio] Tentando modelo ${mIndex + 1}/${modelsToTry.length}: ${currentModel}...`);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: getOpenRouterHeaders(apiKey),
        body: JSON.stringify({
          model: currentModel,
          modalities: ['text', 'audio'],
          audio: { voice, format: 'pcm16' },
          stream: true,
          messages: [{ role: 'user', content: `Fale com entonação clara e natural em português brasileiro: ${options.text}` }],
        }),
        signal: options.abortSignal || AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter Model ${currentModel} falhou (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error(`Corpo da resposta vazio no modelo ${currentModel}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      const audioChunks: Buffer[] = [];
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') break;

            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const audioData = json.choices?.[0]?.delta?.audio?.data;
                if (audioData) {
                  audioChunks.push(Buffer.from(audioData, 'base64'));
                }
              } catch {
                // Ignora chunks intermediários
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (audioChunks.length > 0) {
        console.log(`[OpenRouter Audio] ✅ Áudio gerado com sucesso via ${currentModel}! Total: ${Buffer.concat(audioChunks).length} bytes PCM`);
        return Buffer.concat(audioChunks);
      }

      throw new Error(`Nenhum buffer de áudio retornado pelo modelo ${currentModel}`);

    } catch (err: any) {
      console.warn(`[OpenRouter Audio] Modelo ${currentModel} falhou:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Todos os modelos de áudio da OpenRouter falharam.');
}

/**
 * Returns list of popular curated models for the UI
 */
export function listCuratedOpenRouterModels(): OpenRouterModelInfo[] {
  return Object.values(OPENROUTER_MODELS);
}

