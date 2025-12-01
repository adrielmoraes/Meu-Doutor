'use server';

/**
 * @fileOverview LGPD Security Audit System
 * Funções para rastreamento de atividades, consentimentos e acesso a dados
 * em conformidade com a Lei Geral de Proteção de Dados (LGPD)
 */

import { db } from '../../server/storage';
import { userActivityLogs, consentRecords, dataAccessLogs, securityIncidents } from '../../shared/schema';
import { randomUUID } from 'crypto';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

export type UserType = 'patient' | 'doctor' | 'admin' | 'system';
export type ActivityAction = 
  | 'login' 
  | 'logout' 
  | 'login_failed'
  | 'password_change'
  | 'profile_view'
  | 'profile_update'
  | 'data_export'
  | 'data_delete_request'
  | 'exam_view'
  | 'exam_upload'
  | 'consultation_start'
  | 'consultation_end'
  | 'wellness_plan_view'
  | 'medical_records_view'
  | 'prescription_view'
  | 'appointment_create'
  | 'appointment_cancel'
  | 'consent_grant'
  | 'consent_revoke'
  | 'api_access'
  | 'suspicious_activity';

export type ConsentType = 
  | 'privacy_policy'
  | 'terms_of_service'
  | 'data_processing'
  | 'health_data_sharing'
  | 'marketing'
  | 'third_party_sharing';

export type DataType = 
  | 'personal_info'
  | 'medical_records'
  | 'exam_results'
  | 'prescriptions'
  | 'wellness_plan'
  | 'consultation_history'
  | 'payment_info';

export type AccessType = 'view' | 'download' | 'export' | 'print' | 'share' | 'modify';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentType = 'data_breach' | 'unauthorized_access' | 'suspicious_activity' | 'failed_login_attempts';

interface ActivityLogInput {
  userId: string;
  userType: UserType;
  userEmail?: string;
  action: ActivityAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success?: boolean;
  errorMessage?: string;
}

interface ConsentInput {
  userId: string;
  userType: UserType;
  userEmail: string;
  consentType: ConsentType;
  consentVersion: string;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

interface DataAccessInput {
  accessorId: string;
  accessorType: UserType;
  accessorEmail?: string;
  dataOwnerId: string;
  dataOwnerType: UserType;
  dataType: DataType;
  dataId?: string;
  accessType: AccessType;
  purpose?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface SecurityIncidentInput {
  incidentType: IncidentType;
  severity: IncidentSeverity;
  affectedUsers?: string[];
  affectedDataTypes?: string[];
  description: string;
  reportedBy?: string;
  metadata?: Record<string, any>;
}

/**
 * Registra uma atividade do usuário
 */
export async function logUserActivity(input: ActivityLogInput): Promise<string> {
  const id = randomUUID();
  
  try {
    await db.insert(userActivityLogs).values({
      id,
      userId: input.userId,
      userType: input.userType,
      userEmail: input.userEmail || null,
      action: input.action,
      resource: input.resource || null,
      resourceId: input.resourceId || null,
      details: input.details || null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      sessionId: input.sessionId || null,
      success: input.success ?? true,
      errorMessage: input.errorMessage || null,
    });
    
    console.log(`[Security Audit] Activity logged: ${input.action} by ${input.userType} ${input.userId}`);
    return id;
  } catch (error) {
    console.error('[Security Audit] Failed to log activity:', error);
    throw error;
  }
}

/**
 * Registra ou atualiza um consentimento LGPD
 */
export async function recordConsent(input: ConsentInput): Promise<string> {
  const id = randomUUID();
  const now = new Date();
  
  try {
    await db.insert(consentRecords).values({
      id,
      userId: input.userId,
      userType: input.userType,
      userEmail: input.userEmail,
      consentType: input.consentType,
      consentVersion: input.consentVersion,
      granted: input.granted,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      grantedAt: input.granted ? now : null,
      revokedAt: !input.granted ? now : null,
      metadata: input.metadata || null,
    });
    
    console.log(`[Security Audit] Consent ${input.granted ? 'granted' : 'revoked'}: ${input.consentType} by ${input.userEmail}`);
    return id;
  } catch (error) {
    console.error('[Security Audit] Failed to record consent:', error);
    throw error;
  }
}

/**
 * Registra acesso a dados sensíveis
 */
export async function logDataAccess(input: DataAccessInput): Promise<string> {
  const id = randomUUID();
  
  try {
    await db.insert(dataAccessLogs).values({
      id,
      accessorId: input.accessorId,
      accessorType: input.accessorType,
      accessorEmail: input.accessorEmail || null,
      dataOwnerId: input.dataOwnerId,
      dataOwnerType: input.dataOwnerType,
      dataType: input.dataType,
      dataId: input.dataId || null,
      accessType: input.accessType,
      purpose: input.purpose || null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
    });
    
    console.log(`[Security Audit] Data access: ${input.dataType} (${input.accessType}) by ${input.accessorType} ${input.accessorId}`);
    return id;
  } catch (error) {
    console.error('[Security Audit] Failed to log data access:', error);
    throw error;
  }
}

/**
 * Registra um incidente de segurança
 */
export async function reportSecurityIncident(input: SecurityIncidentInput): Promise<string> {
  const id = randomUUID();
  const now = new Date();
  
  try {
    await db.insert(securityIncidents).values({
      id,
      incidentType: input.incidentType,
      severity: input.severity,
      affectedUsers: input.affectedUsers || null,
      affectedDataTypes: input.affectedDataTypes || null,
      description: input.description,
      detectedAt: now,
      reportedBy: input.reportedBy || null,
      metadata: input.metadata || null,
    });
    
    console.warn(`[Security Audit] INCIDENT REPORTED: ${input.severity.toUpperCase()} - ${input.incidentType}`);
    
    if (input.severity === 'critical' || input.severity === 'high') {
      console.error(`[Security Audit] HIGH SEVERITY INCIDENT: ${input.description}`);
    }
    
    return id;
  } catch (error) {
    console.error('[Security Audit] Failed to report incident:', error);
    throw error;
  }
}

/**
 * Obtém logs de atividade do usuário
 */
export async function getUserActivityLogs(
  userId: string, 
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  const results = await db
    .select()
    .from(userActivityLogs)
    .where(eq(userActivityLogs.userId, userId))
    .orderBy(desc(userActivityLogs.createdAt))
    .limit(limit)
    .offset(offset);
  
  return results;
}

/**
 * Obtém logs de atividade por período
 */
export async function getActivityLogsByPeriod(
  startDate: Date,
  endDate: Date,
  userType?: UserType,
  limit: number = 100
): Promise<any[]> {
  const conditions = [
    gte(userActivityLogs.createdAt, startDate),
    lte(userActivityLogs.createdAt, endDate),
  ];
  
  if (userType) {
    conditions.push(eq(userActivityLogs.userType, userType));
  }
  
  const results = await db
    .select()
    .from(userActivityLogs)
    .where(and(...conditions))
    .orderBy(desc(userActivityLogs.createdAt))
    .limit(limit);
  
  return results;
}

/**
 * Obtém consentimentos de um usuário
 */
export async function getUserConsents(userId: string): Promise<any[]> {
  const results = await db
    .select()
    .from(consentRecords)
    .where(eq(consentRecords.userId, userId))
    .orderBy(desc(consentRecords.createdAt));
  
  return results;
}

/**
 * Verifica se usuário tem consentimento ativo
 */
export async function hasActiveConsent(
  userId: string, 
  consentType: ConsentType
): Promise<boolean> {
  const results = await db
    .select()
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.userId, userId),
        eq(consentRecords.consentType, consentType),
        eq(consentRecords.granted, true)
      )
    )
    .orderBy(desc(consentRecords.createdAt))
    .limit(1);
  
  return results.length > 0;
}

/**
 * Obtém logs de acesso a dados de um paciente
 */
export async function getPatientDataAccessLogs(
  patientId: string,
  limit: number = 50
): Promise<any[]> {
  const results = await db
    .select()
    .from(dataAccessLogs)
    .where(eq(dataAccessLogs.dataOwnerId, patientId))
    .orderBy(desc(dataAccessLogs.createdAt))
    .limit(limit);
  
  return results;
}

/**
 * Obtém incidentes de segurança
 */
export async function getSecurityIncidents(
  severity?: IncidentSeverity,
  resolved?: boolean,
  limit: number = 50
): Promise<any[]> {
  const conditions = [];
  
  if (severity) {
    conditions.push(eq(securityIncidents.severity, severity));
  }
  
  if (resolved !== undefined) {
    if (resolved) {
      conditions.push(sql`${securityIncidents.resolvedAt} IS NOT NULL`);
    } else {
      conditions.push(sql`${securityIncidents.resolvedAt} IS NULL`);
    }
  }
  
  const results = await db
    .select()
    .from(securityIncidents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(securityIncidents.createdAt))
    .limit(limit);
  
  return results;
}

/**
 * Marca incidente como resolvido
 */
export async function resolveSecurityIncident(
  incidentId: string,
  resolution: string,
  preventiveMeasures?: string
): Promise<void> {
  await db
    .update(securityIncidents)
    .set({
      resolvedAt: new Date(),
      resolution,
      preventiveMeasures: preventiveMeasures || null,
      updatedAt: new Date(),
    })
    .where(eq(securityIncidents.id, incidentId));
  
  console.log(`[Security Audit] Incident ${incidentId} resolved`);
}

/**
 * Marca incidente como reportado à ANPD
 */
export async function markIncidentReportedToANPD(incidentId: string): Promise<void> {
  await db
    .update(securityIncidents)
    .set({
      reportedToANPD: true,
      reportedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(securityIncidents.id, incidentId));
  
  console.log(`[Security Audit] Incident ${incidentId} reported to ANPD`);
}

/**
 * Estatísticas de segurança para dashboard admin
 */
export async function getSecurityStats(): Promise<{
  totalActivityLogs: number;
  totalDataAccessLogs: number;
  totalIncidents: number;
  unresolvedIncidents: number;
  criticalIncidents: number;
  recentFailedLogins: number;
}> {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const [
    activityCount,
    dataAccessCount,
    incidentCount,
    unresolvedCount,
    criticalCount,
    failedLoginCount,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(userActivityLogs),
    db.select({ count: sql<number>`count(*)` }).from(dataAccessLogs),
    db.select({ count: sql<number>`count(*)` }).from(securityIncidents),
    db.select({ count: sql<number>`count(*)` })
      .from(securityIncidents)
      .where(sql`${securityIncidents.resolvedAt} IS NULL`),
    db.select({ count: sql<number>`count(*)` })
      .from(securityIncidents)
      .where(eq(securityIncidents.severity, 'critical')),
    db.select({ count: sql<number>`count(*)` })
      .from(userActivityLogs)
      .where(
        and(
          eq(userActivityLogs.action, 'login_failed'),
          gte(userActivityLogs.createdAt, last24h)
        )
      ),
  ]);
  
  return {
    totalActivityLogs: Number(activityCount[0]?.count || 0),
    totalDataAccessLogs: Number(dataAccessCount[0]?.count || 0),
    totalIncidents: Number(incidentCount[0]?.count || 0),
    unresolvedIncidents: Number(unresolvedCount[0]?.count || 0),
    criticalIncidents: Number(criticalCount[0]?.count || 0),
    recentFailedLogins: Number(failedLoginCount[0]?.count || 0),
  };
}

/**
 * Helper para extrair IP de headers
 */
export async function extractClientIP(headers: Headers): Promise<string | undefined> {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || headers.get('x-real-ip') 
    || undefined;
}

/**
 * Helper para extrair User-Agent de headers
 */
export async function extractUserAgent(headers: Headers): Promise<string | undefined> {
  return headers.get('user-agent') || undefined;
}
