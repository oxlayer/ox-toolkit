/**
 * Organization Use Cases
 *
 * Use cases for managing organizations
 */

import { Result, type ResultUseCase } from '@oxlayer/foundation-app-kit';
import type { IOrganizationRepository } from '../../repositories/index.js';
import type { IDeveloperRepository } from '../../repositories/index.js';
import type { Organization } from '../../domain/index.js';
import { ConflictError, EntityNotFoundError, BusinessRuleViolationError } from '@oxlayer/foundation-domain-kit';

/**
 * Create organization input
 */
export interface CreateOrganizationInput {
  name: string;
  slug?: string;
  tier?: string;
  maxDevelopers?: number;
  maxProjects?: number;
}

/**
 * Update organization input
 */
export interface UpdateOrganizationInput {
  name?: string;
  tier?: string;
  maxDevelopers?: number;
  maxProjects?: number;
}

/**
 * Create organization use case
 */
export class CreateOrganizationUseCase implements ResultUseCase<CreateOrganizationInput, Organization> {
  constructor(
    private readonly organizationRepo: IOrganizationRepository
  ) {}

  async execute(input: CreateOrganizationInput): Promise<Result<Organization>> {
    // Check if slug already exists
    const slug = input.slug ?? this.generateSlug(input.name);
    const slugExists = await this.organizationRepo.existsBySlug(slug);
    if (slugExists) {
      return Result.fail(new ConflictError('slug', 'An organization with this slug already exists'));
    }

    const organization = Organization.create({
      name: input.name,
      slug,
      tier: input.tier as any,
      maxDevelopers: input.maxDevelopers,
      maxProjects: input.maxProjects,
    });

    await this.organizationRepo.save(organization);

    return Result.ok(organization);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }
}

/**
 * Update organization use case
 */
export class UpdateOrganizationUseCase implements ResultUseCase<{ id: string } & UpdateOrganizationInput, Organization> {
  constructor(
    private readonly organizationRepo: IOrganizationRepository
  ) {}

  async execute(input: { id: string } & UpdateOrganizationInput): Promise<Result<Organization>> {
    const organization = await this.organizationRepo.findById(input.id);
    if (!organization) {
      return Result.fail(new EntityNotFoundError('Organization', input.id));
    }

    if (input.name !== undefined) {
      organization.updateName(input.name);
    }

    if (input.tier !== undefined) {
      organization.updateTier(input.tier as any);
    }

    if (input.maxDevelopers !== undefined || input.maxProjects !== undefined) {
      organization.updateLimits({
        maxDevelopers: input.maxDevelopers,
        maxProjects: input.maxProjects,
      });
    }

    await this.organizationRepo.save(organization);

    return Result.ok(organization);
  }
}

/**
 * Delete organization use case
 */
export class DeleteOrganizationUseCase implements ResultUseCase<{ id: string }, void> {
  constructor(
    private readonly organizationRepo: IOrganizationRepository,
    private readonly developerRepo: IDeveloperRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<void>> {
    const organization = await this.organizationRepo.findById(input.id);
    if (!organization) {
      return Result.fail(new EntityNotFoundError('Organization', input.id));
    }

    // Check if organization has developers
    const developerCount = await this.developerRepo.countByOrganization(input.id);
    if (developerCount > 0) {
      return Result.fail(
        new BusinessRuleViolationError(
          'organization',
          'Cannot delete organization with active developers'
        )
      );
    }

    await this.organizationRepo.delete(input.id);

    return Result.ok(undefined);
  }
}

/**
 * Get organization use case
 */
export class GetOrganizationUseCase implements ResultUseCase<{ id: string }, Organization> {
  constructor(
    private readonly organizationRepo: IOrganizationRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<Organization>> {
    const organization = await this.organizationRepo.findById(input.id);
    if (!organization) {
      return Result.fail(new EntityNotFoundError('Organization', input.id));
    }

    return Result.ok(organization);
  }
}

/**
 * List organizations use case
 */
export class ListOrganizationsUseCase implements ResultUseCase<undefined, Organization[]> {
  constructor(
    private readonly organizationRepo: IOrganizationRepository
  ) {}

  async execute(): Promise<Result<Organization[]>> {
    const organizations = await this.organizationRepo.findAll();
    return Result.ok(organizations);
  }
}

/**
 * Get organization by slug use case
 */
export class GetOrganizationBySlugUseCase implements ResultUseCase<{ slug: string }, Organization> {
  constructor(
    private readonly organizationRepo: IOrganizationRepository
  ) {}

  async execute(input: { slug: string }): Promise<Result<Organization>> {
    const organization = await this.organizationRepo.findBySlug(input.slug);
    if (!organization) {
      return Result.fail(new EntityNotFoundError('Organization', input.slug));
    }

    return Result.ok(organization);
  }
}
