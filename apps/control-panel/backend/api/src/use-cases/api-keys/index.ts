/**
 * API Key Use Cases
 *
 * Use cases for managing API keys
 */

import { Result, type ResultUseCase } from '@oxlayer/foundation-app-kit';
import type { IApiKeyRepository } from '../../repositories/index.js';
import type { ILicenseRepository } from '../../repositories/index.js';
import type { ApiKey } from '../../domain/index.js';
import { EntityNotFoundError, BusinessRuleViolationError } from '@oxlayer/foundation-domain-kit';

/**
 * Create API key input
 */
export interface CreateApiKeyInput {
  organizationId: string;
  developerId: string | null;
  licenseId: string;
  name: string;
  scopes?: string[];
  environments?: string[];
  expiresIn?: number;
}

/**
 * Update API key input
 */
export interface UpdateApiKeyInput {
  name?: string;
  scopes?: string[];
  environments?: string[];
  expiresAt?: Date | null;
}

/**
 * Create API key use case
 *
 * Returns the API key and the raw key (only shown once)
 */
export class CreateApiKeyUseCase implements ResultUseCase<CreateApiKeyInput, { apiKey: ApiKey; rawKey: string }> {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository,
    private readonly licenseRepo: ILicenseRepository
  ) {}

  async execute(input: CreateApiKeyInput): Promise<Result<{ apiKey: ApiKey; rawKey: string }>> {
    // Verify license exists
    const license = await this.licenseRepo.findById(input.licenseId);
    if (!license) {
      return Result.fail(new EntityNotFoundError('License', input.licenseId));
    }

    // Verify license belongs to organization
    if (license.organizationId !== input.organizationId) {
      return Result.fail(
        new BusinessRuleViolationError('licenseId', 'License does not belong to this organization')
      );
    }

    const { apiKey, rawKey } = ApiKey.create({
      organizationId: input.organizationId,
      developerId: input.developerId,
      licenseId: input.licenseId,
      name: input.name,
      scopes: input.scopes as any[],
      environments: input.environments as any[],
      expiresIn: input.expiresIn,
    });

    await this.apiKeyRepo.save(apiKey);

    return Result.ok({ apiKey, rawKey });
  }
}

/**
 * Update API key use case
 */
export class UpdateApiKeyUseCase implements ResultUseCase<{ id: string } & UpdateApiKeyInput, ApiKey> {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository
  ) {}

  async execute(input: { id: string } & UpdateApiKeyInput): Promise<Result<ApiKey>> {
    const apiKey = await this.apiKeyRepo.findById(input.id);
    if (!apiKey) {
      return Result.fail(new EntityNotFoundError('ApiKey', input.id));
    }

    apiKey.updateDetails({
      name: input.name,
      scopes: input.scopes as any[],
      environments: input.environments as any[],
      expiresAt: input.expiresAt,
    });

    await this.apiKeyRepo.save(apiKey);

    return Result.ok(apiKey);
  }
}

/**
 * Delete API key use case
 */
export class DeleteApiKeyUseCase implements ResultUseCase<{ id: string }, void> {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<void>> {
    const apiKey = await this.apiKeyRepo.findById(input.id);
    if (!apiKey) {
      return Result.fail(new EntityNotFoundError('ApiKey', input.id));
    }

    await this.apiKeyRepo.delete(input.id);

    return Result.ok(undefined);
  }
}

/**
 * Get API key use case
 */
export class GetApiKeyUseCase implements ResultUseCase<{ id: string }, ApiKey> {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<ApiKey>> {
    const apiKey = await this.apiKeyRepo.findById(input.id);
    if (!apiKey) {
      return Result.fail(new EntityNotFoundError('ApiKey', input.id));
    }

    return Result.ok(apiKey);
  }
}

/**
 * List API keys by organization use case
 */
export class ListApiKeysByOrganizationUseCase implements ResultUseCase<{ organizationId: string }, ApiKey[]> {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository
  ) {}

  async execute(input: { organizationId: string }): Promise<Result<ApiKey[]>> {
    const apiKeys = await this.apiKeyRepo.findByOrganization(input.organizationId);
    return Result.ok(apiKeys);
  }
}

/**
 * List API keys by developer use case
 */
export class ListApiKeysByDeveloperUseCase implements ResultUseCase<{ developerId: string }, ApiKey[]> {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository
  ) {}

  async execute(input: { developerId: string }): Promise<Result<ApiKey[]>> {
    const apiKeys = await this.apiKeyRepo.findByDeveloper(input.developerId);
    return Result.ok(apiKeys);
  }
}

/**
 * List API keys by license use case
 */
export class ListApiKeysByLicenseUseCase implements ResultUseCase<{ licenseId: string }, ApiKey[]> {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository
  ) {}

  async execute(input: { licenseId: string }): Promise<Result<ApiKey[]>> {
    const apiKeys = await this.apiKeyRepo.findByLicense(input.licenseId);
    return Result.ok(apiKeys);
  }
}

/**
 * Revoke API key use case
 */
export class RevokeApiKeyUseCase implements ResultUseCase<{ id: string }, ApiKey> {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository
  ) {}

  async execute(input: { id: string }): Promise<Result<ApiKey>> {
    const apiKey = await this.apiKeyRepo.findById(input.id);
    if (!apiKey) {
      return Result.fail(new EntityNotFoundError('ApiKey', input.id));
    }

    apiKey.revoke();

    await this.apiKeyRepo.save(apiKey);

    return Result.ok(apiKey);
  }
}
