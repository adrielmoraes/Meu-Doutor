import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { 
  getSecurityStats,
  getActivityLogsByPeriod,
  getSecurityIncidents,
  getUserActivityLogs,
  getPatientDataAccessLogs,
  resolveSecurityIncident,
  markIncidentReportedToANPD,
} from '@/lib/security-audit';
import { db } from '../../../../../server/storage';
import { userActivityLogs, dataAccessLogs, securityIncidents, consentRecords } from '@/shared/schema';
import { desc, sql, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');
    const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical' | null;
    const resolved = searchParams.get('resolved');
    
    switch (type) {
      case 'stats':
        const stats = await getSecurityStats();
        return NextResponse.json(stats);
        
      case 'activity_logs':
        if (userId) {
          const logs = await getUserActivityLogs(userId, limit);
          return NextResponse.json(logs);
        }
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const activityLogs = await getActivityLogsByPeriod(startDate, endDate, undefined, limit);
        return NextResponse.json(activityLogs);
        
      case 'data_access_logs':
        if (userId) {
          const accessLogs = await getPatientDataAccessLogs(userId, limit);
          return NextResponse.json(accessLogs);
        }
        const allAccessLogs = await db
          .select()
          .from(dataAccessLogs)
          .orderBy(desc(dataAccessLogs.createdAt))
          .limit(limit);
        return NextResponse.json(allAccessLogs);
        
      case 'incidents':
        const incidents = await getSecurityIncidents(
          severity || undefined,
          resolved === 'true' ? true : resolved === 'false' ? false : undefined,
          limit
        );
        return NextResponse.json(incidents);
        
      case 'consents':
        const consents = await db
          .select()
          .from(consentRecords)
          .orderBy(desc(consentRecords.createdAt))
          .limit(limit);
        return NextResponse.json(consents);
        
      case 'recent_logins':
        const recentLogins = await db
          .select()
          .from(userActivityLogs)
          .where(sql`${userActivityLogs.action} IN ('login', 'login_failed', 'logout')`)
          .orderBy(desc(userActivityLogs.createdAt))
          .limit(limit);
        return NextResponse.json(recentLogins);
        
      default:
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Security Audit API] Error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action, incidentId, resolution, preventiveMeasures } = body;
    
    switch (action) {
      case 'resolve_incident':
        if (!incidentId || !resolution) {
          return NextResponse.json({ error: 'ID do incidente e resolução são obrigatórios' }, { status: 400 });
        }
        await resolveSecurityIncident(incidentId, resolution, preventiveMeasures);
        return NextResponse.json({ success: true, message: 'Incidente resolvido' });
        
      case 'report_to_anpd':
        if (!incidentId) {
          return NextResponse.json({ error: 'ID do incidente é obrigatório' }, { status: 400 });
        }
        await markIncidentReportedToANPD(incidentId);
        return NextResponse.json({ success: true, message: 'Incidente marcado como reportado à ANPD' });
        
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Security Audit API] Error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
