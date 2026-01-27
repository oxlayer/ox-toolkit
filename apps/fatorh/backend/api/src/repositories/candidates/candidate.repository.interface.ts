/**
 * Candidate Repository Interface
 */

import { Candidate, CreateCandidateInput, CandidateFilters } from '../../../domain/evaluations/index.js';

export interface ICandidateRepository {
  /**
   * Create a new candidate
   */
  create(data: CreateCandidateInput & { id?: string }): Promise<Candidate>;

  /**
   * Find candidate by ID
   */
  findById(id: string): Promise<Candidate | null>;

  /**
   * Find candidates by filters
   */
  find(filters: CandidateFilters): Promise<Candidate[]>;

  /**
   * Find candidate by CPF
   */
  findByCpf(cpf: string): Promise<Candidate | null>;

  /**
   * Find candidate by external ID
   */
  findByExternalId(externalId: string): Promise<Candidate | null>;

  /**
   * Find candidate by external ID and workspace
   */
  findByExternalIdAndWorkspace(externalId: string, workspaceId: string): Promise<Candidate | null>;

  /**
   * Find candidates by workspace
   */
  findByWorkspace(workspaceId: string): Promise<Candidate[]>;

  /**
   * Update candidate
   */
  update(id: string, data: Partial<CreateCandidateInput>): Promise<Candidate>;

  /**
   * Delete candidate
   */
  delete(id: string): Promise<void>;

  /**
   * Check if candidate exists
   */
  exists(id: string): Promise<boolean>;
}
