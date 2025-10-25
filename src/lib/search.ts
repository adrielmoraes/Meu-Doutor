/**
 * Sistema de Busca Avançada para MediAI
 * Busca em pacientes, médicos, exames com filtros
 */

import { db } from '../../server/storage';
import { patients, doctors, exams } from '../../shared/schema';
import { ilike, or, and, eq, gte, lte, sql } from 'drizzle-orm';
import type { Patient, Doctor, Exam } from '@/types';
import { PaginatedResult, getPaginationOffset, createPaginatedResult } from './pagination';

export interface SearchFilters {
  query?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  type?: string;
}

/**
 * Busca pacientes com filtros avançados
 */
export async function searchPatients(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<Patient>> {
  const { offset, limit: safeLimit } = getPaginationOffset(page, limit);
  
  const conditions = [];

  // Busca por nome ou email
  if (filters.query) {
    conditions.push(
      or(
        ilike(patients.name, `%${filters.query}%`),
        ilike(patients.email, `%${filters.query}%`)
      )
    );
  }

  // Filtro por data de criação
  if (filters.dateFrom) {
    conditions.push(gte(patients.createdAt, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(patients.createdAt, filters.dateTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Buscar dados
  const results = await db
    .select()
    .from(patients)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset);

  // Contar total
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(patients)
    .where(whereClause);

  return createPaginatedResult(
    results.map(p => ({ ...p, lastVisit: p.lastVisit || '', avatarHint: p.avatarHint || '' })) as Patient[],
    Number(count),
    page,
    limit
  );
}

/**
 * Busca médicos com filtros avançados
 */
export async function searchDoctors(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<Doctor>> {
  const { offset, limit: safeLimit } = getPaginationOffset(page, limit);
  
  const conditions = [];

  // Busca por nome ou especialidade
  if (filters.query) {
    conditions.push(
      or(
        ilike(doctors.name, `%${filters.query}%`),
        ilike(doctors.specialty, `%${filters.query}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Buscar dados
  const results = await db
    .select()
    .from(doctors)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset);

  // Contar total
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(doctors)
    .where(whereClause);

  return createPaginatedResult(
    results.map(d => ({ ...d, avatarHint: d.avatarHint || '' })) as Doctor[],
    Number(count),
    page,
    limit
  );
}

/**
 * Busca exames com filtros avançados
 */
export async function searchExams(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<Exam>> {
  const { offset, limit: safeLimit } = getPaginationOffset(page, limit);
  
  const conditions = [];

  // Busca por tipo
  if (filters.query) {
    conditions.push(ilike(exams.type, `%${filters.query}%`));
  }

  // Filtro por tipo específico
  if (filters.type) {
    conditions.push(ilike(exams.type, `%${filters.type}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Buscar dados
  const results = await db
    .select()
    .from(exams)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset);

  // Contar total
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(exams)
    .where(whereClause);

  return createPaginatedResult(
    results as Exam[],
    Number(count),
    page,
    limit
  );
}
