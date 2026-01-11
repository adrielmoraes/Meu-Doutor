
import { getSubscriptionByPatientId, getSubscriptionPlanById } from './subscription-adapter';
import { db } from '../../server/storage';
import { usageTracking } from '../../shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

// Definição dos limites de cada plano
export const PLAN_LIMITS = {
  trial: {
    examAnalysis: 5,
    aiConsultationMinutes: 3,
    doctorConsultationMinutes: 0,
    therapistChatDays: 7,
    podcastMinutes: 5,
    trialDurationDays: 7,
  },
  basico: {
    examAnalysis: 20,
    aiConsultationMinutes: 10,
    doctorConsultationMinutes: 15,
    therapistChatDays: 20,
    podcastMinutes: 4,
  },
  premium: {
    examAnalysis: 35,
    aiConsultationMinutes: 20,
    doctorConsultationMinutes: 30,
    therapistChatDays: 30,
    podcastMinutes: 20,
  },
  familiar: {
    examAnalysis: Infinity,
    aiConsultationMinutes: Infinity,
    doctorConsultationMinutes: Infinity,
    therapistChatDays: Infinity,
    podcastMinutes: Infinity,
  },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;
export type LimitType = 'examAnalysis' | 'aiConsultationMinutes' | 'doctorConsultationMinutes' | 'therapistChatDays' | 'podcastMinutes';

// Verificar se o usuário tem uma assinatura ativa
export async function checkActiveSubscription(patientId: string): Promise<{
  hasActive: boolean;
  planId: PlanId | null;
  subscription: any;
}> {
  const subscription = await getSubscriptionByPatientId(patientId);

  if (!subscription) {
    return { hasActive: false, planId: null, subscription: null };
  }

  // Verificar se o período já expirou (para trials locais ou assinaturas canceladas que chegaram ao fim)
  const now = new Date();
  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const isExpired = periodEnd && periodEnd < now;

  // Se estiver expirado, não considerar ativo mesmo que o status diga o contrário
  // (Isso corrige o problema dos trials locais que não atualizam o status automaticamente)
  if (isExpired) {
    return {
      hasActive: false,
      planId: null,
      subscription: { ...subscription, status: 'canceled' } // Retornar como cancelado para a UI
    };
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  return {
    hasActive: isActive,
    planId: isActive ? (subscription.planId as PlanId) : null,
    subscription: isActive ? subscription : null,
  };
}

// Obter uso atual do mês
export async function getCurrentMonthUsage(patientId: string, usageType: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Lógica especial para dias de chat (conta dias distintos)
  if (usageType === 'chat_days') {
    const result = await db
      .select({
        count: sql<number>`count(distinct date(${usageTracking.createdAt}))`,
      })
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.patientId, patientId),
          eq(usageTracking.usageType, 'chat'),
          gte(usageTracking.createdAt, startOfMonth)
        )
      );
    return Number(result[0]?.count || 0);
  }

  // Lógica especial para minutos de podcast (filtra por metadata)
  if (usageType === 'podcast_minutes') {
    const result = await db
      .select({
        totalDuration: sql<number>`sum(${usageTracking.durationSeconds})`,
      })
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.patientId, patientId),
          eq(usageTracking.usageType, 'tts'),
          sql`${usageTracking.metadata}->>'feature' = 'health-podcast-audio'`,
          gte(usageTracking.createdAt, startOfMonth)
        )
      );
    const seconds = Number(result[0]?.totalDuration || 0);
    return Math.ceil(seconds / 60);
  }

  const usage = await db
    .select({
      count: sql<number>`count(*)`,
      totalDuration: sql<number>`sum(${usageTracking.durationSeconds})`,
    })
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.patientId, patientId),
        eq(usageTracking.usageType, usageType),
        gte(usageTracking.createdAt, startOfMonth)
      )
    );

  if (usageType === 'exam_analysis') {
    return Number(usage[0]?.count || 0);
  }

  // Para consultas, retornar minutos
  const seconds = Number(usage[0]?.totalDuration || 0);
  return Math.ceil(seconds / 60);
}

// Verificar se usuário pode usar um recurso
export async function canUseResource(
  patientId: string,
  resourceType: LimitType
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  planId: string;
  message?: string;
}> {
  console.log(`[canUseResource] 🔍 Verificando recurso "${resourceType}" para paciente ${patientId}`);

  // PASSO 1: Buscar paciente e verificar customQuotas PRIMEIRO
  const { getPatientById } = await import('./db-adapter');
  const patient = await getPatientById(patientId);

  console.log(`[canUseResource] customQuotas do paciente:`, JSON.stringify(patient?.customQuotas));

  const customQuotaValue = patient?.customQuotas?.[resourceType];

  // PASSO 2: Se houver cota customizada, usar ela e IGNORAR verificação de subscrição
  if (customQuotaValue !== undefined && customQuotaValue !== null) {
    console.log(`[canUseResource] ✅ COTA CUSTOMIZADA ENCONTRADA: ${customQuotaValue}`);
    console.log(`[canUseResource] Ignorando verificação de subscrição (admin override)`);

    const limit = customQuotaValue;

    // Mapear tipo de recurso para tipo de uso no banco
    const usageTypeMap: Record<LimitType, string> = {
      examAnalysis: 'exam_analysis',
      aiConsultationMinutes: 'ai_call',
      doctorConsultationMinutes: 'doctor_call',
      therapistChatDays: 'chat_days',
      podcastMinutes: 'podcast_minutes',
    };

    const current = await getCurrentMonthUsage(patientId, usageTypeMap[resourceType]);

    console.log(`[canUseResource] Uso atual: ${current}, Limite customizado: ${limit}`);

    // Se for ilimitado, permitir
    if (limit === Infinity) {
      return {
        allowed: true,
        current,
        limit: Infinity,
        planId: 'custom',
      };
    }

    const allowed = current < limit;

    console.log(`[canUseResource] Resultado: allowed=${allowed}`);

    return {
      allowed,
      current,
      limit,
      planId: 'custom',
      message: allowed
        ? undefined
        : `Você atingiu o limite de ${limit} ${getLimitLabel(resourceType)} definido pelo administrador.`,
    };
  }

  // PASSO 3: Se NÃO houver cota customizada, verificar subscrição normalmente
  console.log(`[canUseResource] ℹ️ Nenhuma cota customizada. Verificando subscrição...`);

  const { hasActive, planId, subscription } = await checkActiveSubscription(patientId);

  if (!hasActive || !planId) {
    console.log(`[canUseResource] ❌ Sem subscrição ativa e sem customQuotas`);
    return {
      allowed: false,
      current: 0,
      limit: 0,
      planId: 'none',
      message: 'Você precisa de uma assinatura ativa para usar este recurso.',
    };
  }

  const limits = PLAN_LIMITS[planId];
  const limit = limits[resourceType];

  console.log(`[canUseResource] Plano: ${planId}, Limite padrão: ${limit}`);

  // Mapear tipo de recurso para tipo de uso no banco
  const usageTypeMap: Record<LimitType, string> = {
    examAnalysis: 'exam_analysis',
    aiConsultationMinutes: 'ai_call',
    doctorConsultationMinutes: 'doctor_call',
    therapistChatDays: 'chat_days',
    podcastMinutes: 'podcast_minutes',
  };

  // Sempre calcular o uso atual, mesmo para planos ilimitados
  const current = await getCurrentMonthUsage(patientId, usageTypeMap[resourceType]);

  // Se for ilimitado, permitir mas ainda mostrar o uso atual
  if (limit === Infinity) {
    return {
      allowed: true,
      current,
      limit: Infinity,
      planId,
    };
  }

  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    planId,
    message: allowed
      ? undefined
      : `Você atingiu o limite de ${limit} ${getLimitLabel(resourceType)} do plano ${getPlanName(planId)}.`,
  };
}

// Incrementar uso de recurso
export async function trackResourceUsage(
  patientId: string,
  usageType: 'exam_analysis' | 'ai_call' | 'doctor_call' | 'chat',
  metadata?: {
    durationSeconds?: number;
    tokensUsed?: number;
    resourceName?: string;
  }
): Promise<void> {
  const { trackUsage } = await import('./db-adapter');

  await trackUsage({
    patientId,
    usageType,
    durationSeconds: metadata?.durationSeconds,
    tokensUsed: metadata?.tokensUsed,
    resourceName: metadata?.resourceName,
  });
}

// Helpers
function getLimitLabel(resourceType: LimitType): string {
  const labels: Record<LimitType, string> = {
    examAnalysis: 'análises de exame',
    aiConsultationMinutes: 'minutos de consulta IA',
    doctorConsultationMinutes: 'minutos de consulta com médico',
    therapistChatDays: 'dias de chat com terapeuta',
    podcastMinutes: 'minutos de podcast',
  };
  return labels[resourceType];
}

function getPlanName(planId: PlanId): string {
  const names: Record<PlanId, string> = {
    trial: 'Teste Grátis',
    basico: 'Básico',
    premium: 'Premium',
    familiar: 'Familiar',
  };
  return names[planId];
}

// Obter resumo completo de uso
export async function getUsageSummary(patientId: string) {
  const { hasActive, planId, subscription } = await checkActiveSubscription(patientId);

  if (!hasActive || !planId) {
    return null;
  }

  const limits = PLAN_LIMITS[planId];

  const { getPatientById } = await import('./db-adapter');
  const patient = await getPatientById(patientId);

  const examLimit = patient?.customQuotas?.examAnalysis ?? limits.examAnalysis;
  const aiMinLimit = patient?.customQuotas?.aiConsultationMinutes ?? limits.aiConsultationMinutes;
  const doctorMinLimit = patient?.customQuotas?.doctorConsultationMinutes ?? limits.doctorConsultationMinutes;
  const chatDaysLimit = patient?.customQuotas?.therapistChatDays ?? limits.therapistChatDays;
  const podcastMinLimit = patient?.customQuotas?.podcastMinutes ?? limits.podcastMinutes;

  const [examAnalysis, aiMinutes, doctorMinutes, chatDays, podcastMinutes] = await Promise.all([
    getCurrentMonthUsage(patientId, 'exam_analysis'),
    getCurrentMonthUsage(patientId, 'ai_call'),
    getCurrentMonthUsage(patientId, 'doctor_call'),
    getCurrentMonthUsage(patientId, 'chat_days'),
    getCurrentMonthUsage(patientId, 'podcast_minutes'),
  ]);

  return {
    planId,
    planName: getPlanName(planId),
    hasCustomQuotas: !!patient?.customQuotas,
    examAnalysis: {
      current: examAnalysis,
      limit: examLimit,
      percentage: examLimit === Infinity ? 0 : (examAnalysis / examLimit) * 100,
    },
    aiConsultation: {
      current: aiMinutes,
      limit: aiMinLimit,
      percentage: aiMinLimit === Infinity ? 0 : (aiMinutes / aiMinLimit) * 100,
    },
    doctorConsultation: {
      current: doctorMinutes,
      limit: doctorMinLimit,
      percentage: doctorMinLimit === Infinity ? 0 : (doctorMinutes / doctorMinLimit) * 100,
    },
    therapistChat: {
      current: chatDays,
      limit: chatDaysLimit,
      percentage: chatDaysLimit === Infinity ? 0 : (chatDays / chatDaysLimit) * 100,
    },
    podcast: {
      current: podcastMinutes,
      limit: podcastMinLimit,
      percentage: podcastMinLimit === Infinity ? 0 : (podcastMinutes / podcastMinLimit) * 100,
    },
  };
}
