/**
 * Developer Use Cases
 *
 * Use cases for managing developers
 */

import { Result, type ResultUseCase } from '@oxlayer/foundation-app-kit';
import type { IDeveloperRepository } from '../../repositories/index.js';
import type { IOrganizationRepository } from '../../repositories/index.js';
import type { Developer } from '../../domain/index.js';
import { ConflictError, EntityNotFoundError, BusinessRuleViolationError } from '@oxlayer/foundation-domain-kit';

/**
 * Create developer input
 */
export interface CreateDeveloperInput {
  organizationId: string;
  name: string;
  email: string;
  environments?: string[];
}

/**
 * Update developer input
 */
export interface UpdateDeveloperInput {
  name?: string;
  email?: string;
  environments?: string[];
}

/**
 * Create developer use case
 */
export class CreateDeveloperUseCase implements ResultUseCase<CreateDeveloperInput, Developer> {
  constructor(
    private readonly developerRepo: IDeveloperRepository,
    private readonly organizationRepo: IOrganizationRepository
  ) {}

  async execute(input: CreateDeveloperInput): Promise<Result<Developer>> {
    // Verify organization exists
    const organization = await this.organizationRepo.findById(input.organizationId);
    if (!organization) {
      return Result.fail(new EntityNotFoundError('Organization', input.organizationId));
    }

    // Check if email already exists
    const emailExists = await this.developerRepo.existsByEmail(input.email);
    if (emailExists) {
      return Result.fail(new ConflictError('email', 'A developer with this email already exists'));
    }

    // Check if organization can add more developers
    const currentCount = await this.developerRepo.countByOrganization(input.organizationId);
    if (!organization.canAddDeveloper(currentCount)) {
      return Result.fail(
        new BusinessRuleViolationError(
          'organization',
          `Organization has reached the maximum number of developers (${organization.maxDevelopers})`
        )
      );
    }

    const developer = Developer.create({
      organizationId: input.organizationId,
      name: input.name,
      email: input.email,
      environments: input.environments as any[],
    });

    await this.developerRepo.save(developer);

    return Result.ok(developer);
  }
}

/**
 * Update developer use case
 */
export class UpdateDeveloperUseCase implements ResultUseCase<{ id: string } & UpdateDeveloperInput, Developer> {
  constructor(
    private readonly developerRepo: IDeveloperRepository
  ) {}

  async execute(input: { id: string } & UpdateDeveloperInput): Promise<Result<Developer>> {
    const developer = await this.developerRepo.findById(input.id);
    if (!developer) {
      return Result.fail(new EntityNotFoundError('Developer', input.id));
    }

    // If updating email, check if it's already taken
    if (input.email && input.email !== developer.email) {
      const emailExists = await this.developerRepo.existsByEmail(input.email);
      if (emailExists) {
        return Result.fail(new ConflictError('email', 'A developer with this email already exists'));
      }
    }

    developer.updateDetails({
      name: input.name,
      email: input.email,
    });

    if (input.environments) {
      // Replace environments
      for (const env of developer.environments) {
        developer.removeEnvironment(env as any);
      }
      for (const env of input.environments) {
        developer.addEnvironment(env as any);
      }
    }

    await this.developerRepo.save(developer);

    return Result.ok(developer);
  }
}

/**
 * Delete developer use case
 */
export class DeleteDeveloperUseCase implements ResultUseCase<{ id: string }, void> {
  constructor(
    private readonly developerRepo: IDeveloperRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<void>> {
    const developer = await this.developerRepo.findById(input.id);
    if (!developer) {
      return Result.fail(new EntityNotFoundError('Developer', input.id));
    }

    await this.developerRepo.delete(input.id);

    return Result.ok(undefined);
  }
}

/**
 * Get developer use case
 */
export class GetDeveloperUseCase implements ResultUseCase<{ id: string }, Developer> {
  constructor(
    private readonly developerRepo: IDeveloperRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<Developer>> {
    const developer = await this.developerRepo.findById(input.id);
    if (!developer) {
      return Result.fail(new EntityNotFoundError('Developer', input.id));
    }

    return Result.ok(developer);
  }
}

/**
 * List developers by organization use case
 */
export class ListDevelopersByOrganizationUseCase implements ResultUseCase<{ organizationId: string }, Developer[]> {
  constructor(
    private readonly developerRepo: IDeveloperRepository
  ) {}

  async execute(input: { organizationId: string }): Promise<Result<Developer[]>> {
    const developers = await this.developerRepo.findByOrganization(input.organizationId);
    return Result.ok(developers);
  }
}
