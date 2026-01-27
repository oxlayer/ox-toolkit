/**
 * Create Candidate Use Case
 *
 * Business logic for creating a new candidate.
 */

import { generateId } from '@oxlayer/foundation-domain-kit';
import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ICandidateRepository } from '../../repositories/candidates/candidate.repository.interface.js';
import { Candidate, CreateCandidateInput } from '../../domain/evaluations/index.js';

export interface CreateCandidateUseCaseInput {
  workspaceId: string;
  name: string;
  email?: string;
  cpf?: string;
  externalId?: string;
}

export interface CreateCandidateUseCaseOutput {
  candidateId: string;
}

/**
 * Create Candidate Use Case
 */
export class CreateCandidateUseCase {
  constructor(
    private candidateRepository: ICandidateRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: CreateCandidateUseCaseInput): Promise<CreateCandidateUseCaseOutput> {
    // Validate input
    this.validate(input);

    // Create candidate
    const candidate = Candidate.create({
      id: generateId(),
      workspaceId: input.workspaceId,
      name: input.name,
      email: input.email,
      cpf: input.cpf,
      externalId: input.externalId,
    });

    // Save to database
    await this.candidateRepository.create(candidate);

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'candidate.created',
      {
        candidateId: candidate.id,
        name: candidate.name,
        workspaceId: candidate.workspaceId,
        createdAt: new Date().toISOString(),
      }
    );

    return {
      candidateId: candidate.id,
    };
  }

  /**
   * Validate input
   */
  private validate(input: CreateCandidateUseCaseInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Candidate name is required');
    }

    if (input.email && !this.isValidEmail(input.email)) {
      throw new Error('Invalid email format');
    }

    if (input.cpf && !this.isValidCpf(input.cpf)) {
      throw new Error('Invalid CPF format');
    }
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
    // Remove non-numeric characters
    const cleanedCpf = cpf.replace(/\D/g, '');
    // CPF must have exactly 11 digits
    return cleanedCpf.length === 11;
  }
}
