/**
 * PostgreSQL Candidate Repository Implementation
 */

import { eq, and, or } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { candidates as candidatesTable } from '../../db/schema.js';
import { Candidate, CreateCandidateInput, CandidateFilters } from '../../domain/evaluations/index.js';
import type { ICandidateRepository } from './candidate.repository.interface.js';

export class PostgresCandidateRepository implements ICandidateRepository {
  constructor(private db: any) {}

  /**
   * Create a new candidate
   */
  async create(data: CreateCandidateInput & { id?: string }): Promise<Candidate> {
    const id = data.id || generateId();

    const [candidateRow] = await this.db
      .insert(candidatesTable)
      .values({
        id,
        workspaceId: data.workspaceId,
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        externalId: data.externalId,
      })
      .returning();

    return Candidate.fromPersistence({
      id: candidateRow.id,
      workspaceId: candidateRow.workspaceId,
      name: candidateRow.name,
      email: candidateRow.email,
      cpf: candidateRow.cpf,
      externalId: candidateRow.externalId,
      createdAt: candidateRow.createdAt,
      updatedAt: candidateRow.updatedAt,
    });
  }

  /**
   * Find candidate by ID
   */
  async findById(id: string): Promise<Candidate | null> {
    const [candidateRow] = await this.db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.id, id))
      .limit(1);

    if (!candidateRow) {
      return null;
    }

    return Candidate.fromPersistence({
      id: candidateRow.id,
      workspaceId: candidateRow.workspaceId,
      name: candidateRow.name,
      email: candidateRow.email,
      cpf: candidateRow.cpf,
      externalId: candidateRow.externalId,
      createdAt: candidateRow.createdAt,
      updatedAt: candidateRow.updatedAt,
    });
  }

  /**
   * Find candidates by filters
   */
  async find(filters: CandidateFilters): Promise<Candidate[]> {
    const conditions = [];

    if (filters.workspaceId) {
      conditions.push(eq(candidatesTable.workspaceId, filters.workspaceId));
    }

    if (filters.cpf) {
      conditions.push(eq(candidatesTable.cpf, filters.cpf));
    }

    if (filters.externalId) {
      conditions.push(eq(candidatesTable.externalId, filters.externalId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const candidateRows = await this.db
      .select()
      .from(candidatesTable)
      .where(whereClause);

    return candidateRows.map((row: any) =>
      Candidate.fromPersistence({
        id: row.id,
        workspaceId: row.workspaceId,
        name: row.name,
        email: row.email,
        cpf: row.cpf,
        externalId: row.externalId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    );
  }

  /**
   * Find candidate by CPF
   */
  async findByCpf(cpf: string): Promise<Candidate | null> {
    const [candidateRow] = await this.db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.cpf, cpf))
      .limit(1);

    if (!candidateRow) {
      return null;
    }

    return Candidate.fromPersistence({
      id: candidateRow.id,
      workspaceId: candidateRow.workspaceId,
      name: candidateRow.name,
      email: candidateRow.email,
      cpf: candidateRow.cpf,
      externalId: candidateRow.externalId,
      createdAt: candidateRow.createdAt,
      updatedAt: candidateRow.updatedAt,
    });
  }

  /**
   * Find candidate by external ID
   */
  async findByExternalId(externalId: string): Promise<Candidate | null> {
    const [candidateRow] = await this.db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.externalId, externalId))
      .limit(1);

    if (!candidateRow) {
      return null;
    }

    return Candidate.fromPersistence({
      id: candidateRow.id,
      workspaceId: candidateRow.workspaceId,
      name: candidateRow.name,
      email: candidateRow.email,
      cpf: candidateRow.cpf,
      externalId: candidateRow.externalId,
      createdAt: candidateRow.createdAt,
      updatedAt: candidateRow.updatedAt,
    });
  }

  /**
   * Find candidate by external ID and workspace
   */
  async findByExternalIdAndWorkspace(externalId: string, workspaceId: string): Promise<Candidate | null> {
    const [candidateRow] = await this.db
      .select()
      .from(candidatesTable)
      .where(and(
        eq(candidatesTable.externalId, externalId),
        eq(candidatesTable.workspaceId, workspaceId)
      ))
      .limit(1);

    if (!candidateRow) {
      return null;
    }

    return Candidate.fromPersistence({
      id: candidateRow.id,
      workspaceId: candidateRow.workspaceId,
      name: candidateRow.name,
      email: candidateRow.email,
      cpf: candidateRow.cpf,
      externalId: candidateRow.externalId,
      createdAt: candidateRow.createdAt,
      updatedAt: candidateRow.updatedAt,
    });
  }

  /**
   * Find candidates by workspace
   */
  async findByWorkspace(workspaceId: string): Promise<Candidate[]> {
    return this.find({ workspaceId });
  }

  /**
   * Update candidate
   */
  async update(id: string, data: Partial<CreateCandidateInput>): Promise<Candidate> {
    const [candidateRow] = await this.db
      .update(candidatesTable)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.cpf !== undefined && { cpf: data.cpf }),
        ...(data.externalId !== undefined && { externalId: data.externalId }),
        updatedAt: new Date(),
      })
      .where(eq(candidatesTable.id, id))
      .returning();

    return Candidate.fromPersistence({
      id: candidateRow.id,
      workspaceId: candidateRow.workspaceId,
      name: candidateRow.name,
      email: candidateRow.email,
      cpf: candidateRow.cpf,
      externalId: candidateRow.externalId,
      createdAt: candidateRow.createdAt,
      updatedAt: candidateRow.updatedAt,
    });
  }

  /**
   * Delete candidate
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(candidatesTable).where(eq(candidatesTable.id, id));
  }

  /**
   * Check if candidate exists
   */
  async exists(id: string): Promise<boolean> {
    const [candidate] = await this.db
      .select({ id: candidatesTable.id })
      .from(candidatesTable)
      .where(eq(candidatesTable.id, id))
      .limit(1);

    return !!candidate;
  }
}

// Export the class as default for dynamic import
export default PostgresCandidateRepository;
