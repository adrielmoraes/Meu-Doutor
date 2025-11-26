import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '../../../../../server/storage';
import { usageTracking, patients } from '../../../../../shared/schema';
import { desc, sql, eq, gte, lte, and } from 'drizzle-orm';
import { formatCostBRL } from '@/lib/ai-pricing';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const patientId = searchParams.get('patientId');
    const usageType = searchParams.get('usageType');

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
    }

    // Build query conditions
    const conditions = [gte(usageTracking.createdAt, startDate)];
    if (patientId) {
      conditions.push(eq(usageTracking.patientId, patientId));
    }
    if (usageType) {
      conditions.push(eq(usageTracking.usageType, usageType));
    }

    // Get usage data with patient names
    const usageData = await db
      .select({
        id: usageTracking.id,
        patientId: usageTracking.patientId,
        patientName: patients.name,
        usageType: usageTracking.usageType,
        resourceName: usageTracking.resourceName,
        tokensUsed: usageTracking.tokensUsed,
        durationSeconds: usageTracking.durationSeconds,
        cost: usageTracking.cost,
        metadata: usageTracking.metadata,
        createdAt: usageTracking.createdAt,
      })
      .from(usageTracking)
      .leftJoin(patients, eq(usageTracking.patientId, patients.id))
      .where(and(...conditions))
      .orderBy(desc(usageTracking.createdAt))
      .limit(500);

    // Calculate summary statistics
    const summary = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${usageTracking.cost}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${usageTracking.tokensUsed}), 0)`,
        totalDuration: sql<number>`COALESCE(SUM(${usageTracking.durationSeconds}), 0)`,
        totalRecords: sql<number>`COUNT(*)`,
      })
      .from(usageTracking)
      .where(and(...conditions));

    // Get breakdown by usage type
    const breakdownByType = await db
      .select({
        usageType: usageTracking.usageType,
        totalCost: sql<number>`COALESCE(SUM(${usageTracking.cost}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${usageTracking.tokensUsed}), 0)`,
        totalDuration: sql<number>`COALESCE(SUM(${usageTracking.durationSeconds}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(usageTracking)
      .where(and(...conditions))
      .groupBy(usageTracking.usageType);

    // Get top patients by cost
    const topPatients = await db
      .select({
        patientId: usageTracking.patientId,
        patientName: patients.name,
        totalCost: sql<number>`COALESCE(SUM(${usageTracking.cost}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${usageTracking.tokensUsed}), 0)`,
        usageCount: sql<number>`COUNT(*)`,
      })
      .from(usageTracking)
      .leftJoin(patients, eq(usageTracking.patientId, patients.id))
      .where(and(...conditions))
      .groupBy(usageTracking.patientId, patients.name)
      .orderBy(desc(sql`SUM(${usageTracking.cost})`))
      .limit(10);

    // Get daily costs for chart
    const dailyCosts = await db
      .select({
        date: sql<string>`DATE(${usageTracking.createdAt})`,
        totalCost: sql<number>`COALESCE(SUM(${usageTracking.cost}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${usageTracking.tokensUsed}), 0)`,
      })
      .from(usageTracking)
      .where(and(...conditions))
      .groupBy(sql`DATE(${usageTracking.createdAt})`)
      .orderBy(sql`DATE(${usageTracking.createdAt})`);

    return NextResponse.json({
      summary: {
        totalCost: summary[0]?.totalCost || 0,
        totalCostFormatted: formatCostBRL(summary[0]?.totalCost || 0),
        totalTokens: summary[0]?.totalTokens || 0,
        totalDurationSeconds: summary[0]?.totalDuration || 0,
        totalDurationMinutes: Math.round((summary[0]?.totalDuration || 0) / 60),
        totalRecords: summary[0]?.totalRecords || 0,
      },
      breakdownByType: breakdownByType.map(item => ({
        ...item,
        costFormatted: formatCostBRL(item.totalCost),
      })),
      topPatients: topPatients.map(item => ({
        ...item,
        costFormatted: formatCostBRL(item.totalCost),
      })),
      dailyCosts: dailyCosts.map(item => ({
        ...item,
        costFormatted: formatCostBRL(item.totalCost),
      })),
      recentUsage: usageData.map(item => ({
        ...item,
        costFormatted: formatCostBRL(item.cost || 0),
      })),
      period,
    });
  } catch (error) {
    console.error('[Admin Usage Stats] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
