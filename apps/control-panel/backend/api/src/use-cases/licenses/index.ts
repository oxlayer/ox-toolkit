/**
 * License Use Cases
 *
 * Use cases for managing licenses
 */

import { Result, type ResultUseCase } from '@oxlayer/foundation-app-kit';
import type { ILicenseRepository } from '../../repositories/index.js';
import type { IOrganizationRepository } from '../../repositories/index.js';
import type { License } from '../../domain/index.js';
import { EntityNotFoundError, BusinessRuleViolationError } from '@oxlayer/foundation-domain-kit';
import type { CapabilityName } from '../../domain/index.js';

/**
 * Create license input
 */
export interface CreateLicenseInput {
  organizationId: string;
  name: string;
  tier?: string;
  packages?: string[];
  capabilities?: Record<string, any>;
  environments?: string[];
  expiresAt?: Date | null;
}

/**
 * Update license input
 */
export interface UpdateLicenseInput {
  name?: string;
  expiresAt?: Date | null;
}

/**
 * Update capability input
 */
export interface UpdateCapabilityInput {
  capability: string;
  limits: Record<string, any>;
}

/**
 * Create license use case
 */
export class CreateLicenseUseCase implements ResultUseCase<CreateLicenseInput, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository,
    private readonly organizationRepo: IOrganizationRepository
  ) {}

  async execute(input: CreateLicenseInput): Promise<Result<License>> {
    // Verify organization exists
    const organization = await this.organizationRepo.findById(input.organizationId);
    if (!organization) {
      return Result.fail(new EntityNotFoundError('Organization', input.organizationId));
    }

    const license = License.create({
      organizationId: input.organizationId,
      name: input.name,
      tier: input.tier as any,
      packages: input.packages as any[],
      capabilities: input.capabilities as any,
      environments: input.environments as any[],
      expiresAt: input.expiresAt,
    });

    await this.licenseRepo.save(license);

    return Result.ok(license);
  }
}

/**
 * Update license use case
 */
export class UpdateLicenseUseCase implements ResultUseCase<{ id: string } & UpdateLicenseInput, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string } & UpdateLicenseInput): Promise<Result<License>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    license.updateDetails({
      name: input.name,
      expiresAt: input.expiresAt,
    });

    await this.licenseRepo.save(license);

    return Result.ok(license);
  }
}

/**
 * Delete license use case
 */
export class DeleteLicenseUseCase implements ResultUseCase<{ id: string }, void> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<void>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    await this.licenseRepo.delete(input.id);

    return Result.ok(undefined);
  }
}

/**
 * Get license use case
 */
export class GetLicenseUseCase implements ResultUseCase<{ id: string }, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<License>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    return Result.ok(license);
  }
}

/**
 * List licenses by organization use case
 */
export class ListLicensesByOrganizationUseCase implements ResultUseCase<{ organizationId: string }, License[]> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { organizationId: string }): Promise<Result<License[]>> {
    const licenses = await this.licenseRepo.findByOrganization(input.organizationId);
    return Result.ok(licenses);
  }
}

/**
 * Activate license use case
 */
export class ActivateLicenseUseCase implements ResultUseCase<{ id: string }, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<License>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    license.activate();

    await this.licenseRepo.save(license);

    return Result.ok(license);
  }
}

/**
 * Suspend license use case
 */
export class SuspendLicenseUseCase implements ResultUseCase<{ id: string }, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<License>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    license.suspend();

    await this.licenseRepo.save(license);

    return Result.ok(license);
  }
}

/**
 * Revoke license use case
 */
export class RevokeLicenseUseCase implements ResultUseCase<{ id: string }, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<License>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    license.revoke();

    await this.licenseRepo.save(license);

    return Result.ok(license);
  }
}

/**
 * Add package to license use case
 */
export class AddPackageToLicenseUseCase implements ResultUseCase<{ id: string; package: string }, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string; package: string }): Promise<Result<License>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    license.addPackage(input.package as any);

    await this.licenseRepo.save(license);

    return Result.ok(license);
  }
}

/**
 * Remove package from license use case
 */
export class RemovePackageFromLicenseUseCase implements ResultUseCase<{ id: string; package: string }, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string; package: string }): Promise<Result<License>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    license.removePackage(input.package as any);

    await this.licenseRepo.save(license);

    return Result.ok(license);
  }
}

/**
 * Update capability limits use case
 */
export class UpdateCapabilityLimitsUseCase implements ResultUseCase<{ id: string } & UpdateCapabilityInput, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string } & UpdateCapabilityInput): Promise<Result<License>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    license.setCapability(input.capability as CapabilityName, input.limits);

    await this.licenseRepo.save(license);

    return Result.ok(license);
  }
}

/**
 * Remove capability from license use case
 */
export class RemoveCapabilityFromLicenseUseCase implements ResultUseCase<{ id: string; capability: string }, License> {
  constructor(
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: { id: string; capability: string }): Promise<Result<License>> {
    const license = await this.licenseRepo.findById(input.id);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.id));
    }

    license.removeCapability(input.capability as CapabilityName);

    await this.licenseRepo.save(license);

    return Result.ok(license);
  }
}
