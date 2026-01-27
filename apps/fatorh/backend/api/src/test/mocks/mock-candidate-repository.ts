/**
 * Mock Candidate Repository
 *
 * In-memory repository for testing without database.
 */

import { InMemoryRepository } from '@oxlayer/foundation-testing-kit';
import type { Candidate } from '../../domain/evaluations/candidate.entity.js';

export class MockCandidateRepository extends InMemoryRepository<Candidate, string> {
  protected getId(entity: Candidate): string {
    return entity.id;
  }

  /**
   * Find candidate by ID
   */
  async findById(id: string): Promise<Candidate | null> {
    return super.findById(id);
  }

  /**
   * Find candidate by CPF
   */
  async findByCPF(cpf: string): Promise<Candidate | null> {
    return this.findOne((candidate) => candidate.cpf === cpf);
  }

  /**
   * Find candidate by external ID
   */
  async findByExternalId(externalId: string): Promise<Candidate | null> {
    return this.findOne((candidate) => candidate.externalId === externalId);
  }

  /**
   * Find or create candidate by CPF
   */
  async findOrCreateByCPF(cpf: string, defaults: Partial<Candidate>): Promise<Candidate> {
    const existing = await this.findByCPF(cpf);
    if (existing) {
      return existing;
    }

    const newCandidate: Candidate = {
      id: defaults.id || `candidate-${Date.now()}`,
      cpf,
      name: defaults.name || '',
      email: defaults.email || null,
      externalId: defaults.externalId || null,
      createdAt: defaults.createdAt || new Date(),
      updatedAt: defaults.updatedAt || new Date(),
    };

    await this.save(newCandidate);
    return newCandidate;
  }
}
