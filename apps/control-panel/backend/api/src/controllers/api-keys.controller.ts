/**
 * API Keys Controller
 *
 * HTTP controller for API key management endpoints
 */

import { BaseController, HttpError } from '@oxlayer/foundation-http-kit';
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
    try {
      const body = await request.json();

      const result = await this.createApiKey.execute({
        organizationId: params.organizationId,
        ...body,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const { apiKey, rawKey } = result.value;

      return Response.json(
        {
          data: {
            ...apiKey.toResponse(),
            rawKey, // Only shown once!
          },
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * GET /api-keys/:id
   * Get an API key by ID
   *
   * Note: Does NOT return the raw key
   */
  async getById(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.getApiKey.execute({ id: params.id });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const apiKey = result.value;

      return Response.json({
        data: apiKey.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * GET /organizations/:organizationId/api-keys
   * List API keys by organization
   */
  async listByOrganization(request: Request, params: { organizationId: string }): Promise<Response> {
    try {
      const result = await this.listApiKeysByOrg.execute({
        organizationId: params.organizationId,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const apiKeys = result.value;

      return Response.json({
        data: apiKeys.map(key => key.toResponse()),
        meta: { count: apiKeys.length },
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * GET /developers/:developerId/api-keys
   * List API keys by developer
   */
  async listByDeveloper(request: Request, params: { developerId: string }): Promise<Response> {
    try {
      const result = await this.listApiKeysByDev.execute({
        developerId: params.developerId,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const apiKeys = result.value;

      return Response.json({
        data: apiKeys.map(key => key.toResponse()),
        meta: { count: apiKeys.length },
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * GET /licenses/:licenseId/api-keys
   * List API keys by license
   */
  async listByLicense(request: Request, params: { licenseId: string }): Promise<Response> {
    try {
      const result = await this.listApiKeysByLicense.execute({
        licenseId: params.licenseId,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const apiKeys = result.value;

      return Response.json({
        data: apiKeys.map(key => key.toResponse()),
        meta: { count: apiKeys.length },
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * PATCH /api-keys/:id
   * Update an API key
   */
  async update(request: Request, params: { id: string }): Promise<Response> {
    try {
      const body = await request.json();

      const result = await this.updateApiKey.execute({ id: params.id, ...body });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const apiKey = result.value;

      return Response.json({
        data: apiKey.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * DELETE /api-keys/:id
   * Delete an API key
   */
  async delete(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.deleteApiKey.execute({ id: params.id });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * POST /api-keys/:id/revoke
   * Revoke an API key
   */
  async revoke(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.revokeApiKey.execute({ id: params.id });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const apiKey = result.value;

      return Response.json({
        data: apiKey.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }
}
