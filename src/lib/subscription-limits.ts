
import { getSubscriptionByPatientId, getSubscriptionPlanById } from './subscription-adapter';
import { db } from '../../server/storage';
import { usageTracking } from '../../shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

// Definição dos limites de cada plano
export const PLAN_LIMITS = {
  trial: {
    examAnalysis: 5,
    aiConsultationMinutes: 5,
    doctorConsultationMinutes: 0,
    therapistChat: Infinity, // ilimitado
    trialDurationDays: 7,
  },
  basico: {
    examAnalysis: 20,
    aiConsultationMinutes: 5,
    doctorConsultationMinutes: 0,
    therapistChat: Infinity,
  },
  premium: {
    examAnalysis: Infinity,
    aiConsultationMinutes: 30,
    doctorConsultationMinutes: 30,
    therapistChat: Infinity,
  },
  familiar: {
    examAnalysis: Infinity,
    aiConsultationMinutes: Infinity,
    doctorConsultationMinutes: Infinity,
    therapistChat: Infinity,
  },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;
export type LimitType = 'examAnalysis' | 'aiConsultationMinutes' | 'doctorConsultationMinutes' | 'therapistChat';

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
  const { hasActive, planId, subscription } = await checkActiveSubscription(patientId);

  if (!hasActive || !planId) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      planId: 'none',
      message: 'Você precisa de uma assinatura ativa para usar este recurso.',
    };
  }

  const limits = PLAN_LIMITS[planId];
  
  const { getPatientById } = await import('./db-adapter');
  const patient = await getPatientById(patientId);
  
  const customQuotaValue = patient?.customQuotas?.[resourceType];
  const limit = customQuotaValue !== undefined && customQuotaValue !== null 
    ? customQuotaValue 
    : limits[resourceType];

  // Se for ilimitado, permitir
  if (limit === Infinity) {
    return {
      allowed: true,
      current: 0,
      limit: Infinity,
      planId,
    };
  }

  // Mapear tipo de recurso para tipo de uso no banco
  const usageTypeMap: Record<LimitType, string> = {
    examAnalysis: 'exam_analysis',
    aiConsultationMinutes: 'ai_call',
    doctorConsultationMinutes: 'doctor_call',
    therapistChat: 'chat',
  };

  const current = await getCurrentMonthUsage(patientId, usageTypeMap[resourceType]);

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
    therapistChat: 'mensagens de chat',
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

  const [examAnalysis, aiMinutes, doctorMinutes] = await Promise.all([
    getCurrentMonthUsage(patientId, 'exam_analysis'),
    getCurrentMonthUsage(patientId, 'ai_call'),
    getCurrentMonthUsage(patientId, 'doctor_call'),
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
  };
}
