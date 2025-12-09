// Custos reais de tokens dos modelos Gemini (por 1 milhão de tokens)
// Fonte: Google AI Studio Pricing - Atualizado em Dezembro/2025
// https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-native-audio
// Valores em USD

export const GEMINI_TOKEN_COSTS = {
  // Gemini 2.5 Flash Native Audio - Usado em consultas ao vivo com voz
  // IMPORTANTE: Este modelo tem preços diferentes para texto vs áudio/vídeo
  'gemini-2.5-flash-native-audio-preview-09-2025': {
    // Preços de TEXTO (para system prompt, contexto, etc.)
    textInput: 0.50,    // $0.50 por 1M tokens (texto)
    textOutput: 12.00,  // $12.00 por 1M tokens (texto)
    // Preços de ÁUDIO/VÍDEO (para STT e TTS)
    audioInput: 3.00,   // $3.00 por 1M tokens (áudio/vídeo input - STT)
    audioOutput: 2.00,  // $2.00 por 1M tokens (áudio/vídeo output - TTS)
    // Preços legado (média ponderada para compatibilidade)
    input: 0.50,        // Usar textInput para cálculos gerais
    output: 12.00,      // Usar textOutput para cálculos gerais
    description: 'Modelo de áudio nativo para consultas ao vivo',
  },
  
  // Gemini 2.5 Flash - Usado em análises, chat terapeuta, flows gerais
  'gemini-2.5-flash': {
    input: 0.30,   // $0.30 por 1M tokens
    output: 2.50,  // $2.50 por 1M tokens
    description: 'Modelo híbrido para análises e conversas',
  },
  
  // Gemini 2.5 Flash Preview TTS - Usado para Text-to-Speech
  'gemini-2.5-flash-preview-tts': {
    input: 0.50,   // $0.50 por 1M tokens
    output: 10.00, // $10.00 por 1M tokens
    description: 'Modelo de síntese de voz',
  },
  
  // Gemini 2.5 Flash-Lite - Modelo econômico
  'gemini-2.5-flash-lite': {
    input: 0.10,   // $0.10 por 1M tokens
    output: 0.40,  // $0.40 por 1M tokens
    description: 'Modelo mais econômico',
  },
  
  // Gemini 2.5 Pro - Modelo avançado (não usado atualmente, mas disponível)
  'gemini-2.5-pro': {
    input: 1.25,   // $1.25 por 1M tokens (<=200K)
    output: 10.00, // $10.00 por 1M tokens (<=200K)
    inputLarge: 2.50,  // $2.50 por 1M tokens (>200K)
    outputLarge: 15.00, // $15.00 por 1M tokens (>200K)
    description: 'Modelo avançado para raciocínio complexo',
  },
} as const;

// Estimativas de tokens por uso (baseado em testes reais da plataforma)
export const TOKEN_ESTIMATES = {
  // Análise de exame médico
  examAnalysis: {
    model: 'gemini-2.5-flash',
    inputTokens: 15000,  // ~15K tokens: contexto + exame + instruções dos 15 especialistas
    outputTokens: 8000,  // ~8K tokens: diagnósticos + medicações + tratamentos
    description: 'Análise completa com 15 especialistas',
  },
  
  // Consulta ao vivo (por minuto)
  // Estimativa baseada em conversas reais: ~25 tokens/segundo de áudio
  // 1 minuto = 60 segundos × 25 tokens = ~1500 tokens
  aiConsultationPerMinute: {
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    inputTokens: 1500,   // ~1.5K tokens por minuto de fala do paciente (STT)
    outputTokens: 1500,  // ~1.5K tokens por minuto de resposta da IA (TTS)
    useAudioPricing: true, // Usar preços de áudio, não texto
    description: 'Consulta ao vivo com IA (áudio nativo)',
  },
  
  // Chat terapeuta (por mensagem)
  therapistChatMessage: {
    model: 'gemini-2.5-flash',
    inputTokens: 1500,   // ~1.5K tokens: histórico + nova mensagem
    outputTokens: 800,   // ~800 tokens: resposta terapêutica
    description: 'Mensagem de chat terapeuta',
  },
  
  // Text-to-Speech (por uso)
  textToSpeech: {
    model: 'gemini-2.5-flash-preview-tts',
    inputTokens: 500,    // ~500 tokens: texto a ser convertido
    outputTokens: 500,   // ~500 tokens: áudio gerado
    description: 'Conversão texto para fala',
  },
} as const;

// Calcula o custo em USD de um serviço
export function calculateServiceCost(serviceName: keyof typeof TOKEN_ESTIMATES): number {
  const estimate = TOKEN_ESTIMATES[serviceName];
  const modelCosts = GEMINI_TOKEN_COSTS[estimate.model as keyof typeof GEMINI_TOKEN_COSTS];
  
  if (!modelCosts) {
    console.error(`Modelo ${estimate.model} não encontrado em GEMINI_TOKEN_COSTS`);
    return 0;
  }
  
  // Custos por 1 milhão de tokens, então dividimos por 1.000.000
  // Para consultas ao vivo, usar preços de áudio (STT/TTS)
  const useAudio = 'useAudioPricing' in estimate && estimate.useAudioPricing;
  
  let inputCost: number;
  let outputCost: number;
  
  if (useAudio && 'audioInput' in modelCosts && 'audioOutput' in modelCosts) {
    // Usar preços de áudio para STT (input) e TTS (output)
    inputCost = (estimate.inputTokens / 1_000_000) * modelCosts.audioInput;
    outputCost = (estimate.outputTokens / 1_000_000) * modelCosts.audioOutput;
  } else {
    // Usar preços de texto padrão
    inputCost = (estimate.inputTokens / 1_000_000) * modelCosts.input;
    outputCost = (estimate.outputTokens / 1_000_000) * modelCosts.output;
  }
  
  return inputCost + outputCost;
}

// Calcula o custo total de um plano baseado em seus limites
export function calculatePlanCost(limits: {
  examAnalysis: number;
  aiConsultationMinutes: number;
  therapistChatMessages?: number; // Estimativa de mensagens por mês
}): number {
  let totalCost = 0;
  
  // Custo de análises de exames
  if (limits.examAnalysis > 0 && limits.examAnalysis !== Infinity) {
    totalCost += calculateServiceCost('examAnalysis') * limits.examAnalysis;
  }
  
  // Custo de consultas ao vivo (por minuto)
  if (limits.aiConsultationMinutes > 0 && limits.aiConsultationMinutes !== Infinity) {
    totalCost += calculateServiceCost('aiConsultationPerMinute') * limits.aiConsultationMinutes;
  }
  
  // Custo de chat terapeuta (estimativa: 100 mensagens/mês para planos ilimitados)
  const chatMessages = limits.therapistChatMessages || 100;
  totalCost += calculateServiceCost('therapistChatMessage') * chatMessages;
  
  return totalCost;
}

// Conversão USD para BRL (atualizar periodicamente)
// Sincronizado com ai-pricing.ts
export const USD_TO_BRL = 5.42; // Taxa de câmbio (Dezembro 2025)

// Converte USD para centavos de BRL (formato Stripe)
export function usdToBrlCents(usd: number): number {
  return Math.round(usd * USD_TO_BRL * 100);
}

// Formata preço em BRL
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

// Calcula preço sugerido do plano com margem
export function calculatePlanPrice(
  limits: {
    examAnalysis: number;
    aiConsultationMinutes: number;
    therapistChatMessages?: number;
  },
  marginMultiplier: number = 3.0 // Margem padrão: 3x o custo (200% de lucro)
): {
  costUSD: number;
  costBRL: number;
  priceUSD: number;
  priceBRL: number;
  priceBRLCents: number;
  margin: number;
} {
  const costUSD = calculatePlanCost(limits);
  const priceUSD = costUSD * marginMultiplier;
  const costBRL = costUSD * USD_TO_BRL;
  const priceBRL = priceUSD * USD_TO_BRL;
  const priceBRLCents = usdToBrlCents(priceUSD);
  
  return {
    costUSD,
    costBRL,
    priceUSD,
    priceBRL,
    priceBRLCents,
    margin: marginMultiplier,
  };
}

// Exemplo de uso:
// const basicPlanPricing = calculatePlanPrice({
//   examAnalysis: 20,
//   aiConsultationMinutes: 5,
//   therapistChatMessages: 100,
// });
// console.log('Custo:', formatBRL(basicPlanPricing.costBRL * 100));
// console.log('Preço sugerido:', formatBRL(basicPlanPricing.priceBRLCents));
