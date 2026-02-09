/**
 * API Keys Controller
 *
 * HTTP controller for API key management endpoints
 */

import { BaseController, HttpError, mapDomainErrorToHttpStatus } from '@oxlayer/foundation-http-kit';
import type {
  CreateApiKeyUseCase,
  UpdateApiKeyUseCase,
  DeleteApiKeyUseCase,
  GetApiKeyUseCase,
  ListApiKeysByOrganizationUseCase,
  ListApiKeysByDeveloperUseCase,
  ListApiKeysByLicenseUseCase,
  RevokeApiKeyUseCase,
} from '../use-cases/api-keys/index.js';

export class ApiKeysController extends BaseController {
  constructor(
    private readonly createApiKey: CreateApiKeyUseCase,
    private readonly updateApiKey: UpdateApiKeyUseCase,
    private readonly deleteApiKey: DeleteApiKeyUseCase,
    private readonly getApiKey: GetApiKeyUseCase,
    private readonly listApiKeysByOrg: ListApiKeysByOrganizationUseCase,
    private readonly listApiKeysByDev: ListApiKeysByDeveloperUseCase,
    private readonly listApiKeysByLicense: ListApiKeysByLicenseUseCase,
    private readonly revokeApiKey: RevokeApiKeyUseCase
  ) {
    super();
  }

  /**
   * POST /organizations/:organizationId/api-keys
   * Create a new API key
   *
   * Note: Returns the raw key which is only shown once
   */
  async create(request: Request, params: { organizationId: string }): Promise<Response> {
    const body = await request.json();

    const result = await this.createApiKey.execute({
      organizationId: params.organizationId,
      ...body,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    const { apiKey, rawKey } = result.value;

    return this.created({
      data: {
        ...apiKey.toResponse(),
        rawKey, // Only shown once!
      },
    });
  }

  /**
   * GET /api-keys/:id
   * Get an API key by ID
   *
   * Note: Does NOT return the raw key
   */
  async getById(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.getApiKey.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * GET /organizations/:organizationId/api-keys
   * List API keys by organization
   */
  async listByOrganization(request: Request, params: { organizationId: string }): Promise<Response> {
    const result = await this.listApiKeysByOrg.execute({
      organizationId: params.organizationId,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({
      data: result.value.map(key => key.toResponse()),
      meta: { count: result.value.length },
    });
  }

  /**
   * GET /developers/:developerId/api-keys
   * List API keys by developer
   */
  async listByDeveloper(request: Request, params: { developerId: string }): Promise<Response> {
    const result = await this.listApiKeysByDev.execute({
      developerId: params.developerId,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({
      data: result.value.map(key => key.toResponse()),
      meta: { count: result.value.length },
    });
  }

  /**
   * GET /licenses/:licenseId/api-keys
   * List API keys by license
   */
  async listByLicense(request: Request, params: { licenseId: string }): Promise<Response> {
    const result = await this.listApiKeysByLicense.execute({
      licenseId: params.licenseId,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({
      data: result.value.map(key => key.toResponse()),
      meta: { count: result.value.length },
    });
  }

  /**
   * PATCH /api-keys/:id
   * Update an API key
   */
  async update(request: Request, params: { id: string }): Promise<Response> {
    const body = await request.json();

    const result = await this.updateApiKey.execute({ id: params.id, ...body });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * DELETE /api-keys/:id
   * Delete an API key
   */
  async delete(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.deleteApiKey.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.noContent();
  }

  /**
   * POST /api-keys/:id/revoke
   * Revoke an API key
   */
  async revoke(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.revokeApiKey.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }
}
