/**
 * Update Candidate Use Case
 *
 * Business logic for updating a candidate.
 */

import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ICandidateRepository } from '../../repositories/candidates/candidate.repository.interface.js';

export interface UpdateCandidateUseCaseInput {
  id: string;
  name?: string;
  email?: string;
  cpf?: string;
  externalId?: string;
}

/**
 * Update Candidate Use Case
 */
export class UpdateCandidateUseCase {
  constructor(
    private candidateRepository: ICandidateRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: UpdateCandidateUseCaseInput) {
    const existing = await this.candidateRepository.findById(input.id);
    if (!existing) {
      throw new Error('Candidate not found');
    }

    // Validate email format if provided
    if (input.email && !this.isValidEmail(input.email)) {
      throw new Error('Invalid email format');
    }

    // Validate CPF format if provided
    if (input.cpf && !this.isValidCpf(input.cpf)) {
      throw new Error('Invalid CPF format');
    }

    // Update candidate
    const updated = await this.candidateRepository.update(input.id, {
      name: input.name,
      email: input.email,
      cpf: input.cpf,
      externalId: input.externalId,
    });

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'candidate.updated',
      {
        candidateId: updated.id,
        name: updated.name,
        workspaceId: updated.workspaceId,
        updatedAt: new Date().toISOString(),
      }
    );

    return updated.toPersistence();
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate CPF format (Brazilian tax ID)
   */
  private isValidCpf(cpf: string): boolean {
    const cleanedCpf = cpf.replace(/\D/g, '');
    return cleanedCpf.length === 11;
  }
}
