/**
 * Developers Controller
 *
 * HTTP controller for developer management endpoints
 */

import { BaseController, HttpError, mapDomainErrorToHttpStatus } from '@oxlayer/foundation-http-kit';
import type {
  CreateDeveloperUseCase,
  UpdateDeveloperUseCase,
  DeleteDeveloperUseCase,
  GetDeveloperUseCase,
  ListDevelopersByOrganizationUseCase,
} from '../use-cases/developers/index.js';

export class DevelopersController extends BaseController {
  constructor(
    private readonly createDev: CreateDeveloperUseCase,
    private readonly updateDev: UpdateDeveloperUseCase,
    private readonly deleteDev: DeleteDeveloperUseCase,
    private readonly getDev: GetDeveloperUseCase,
    private readonly listDevsByOrg: ListDevelopersByOrganizationUseCase
  ) {
    super();
  }

  /**
   * POST /organizations/:organizationId/developers
   * Create a new developer
   */
  async create(request: Request, params: { organizationId: string }): Promise<Response> {
    const body = await request.json();

    const result = await this.createDev.execute({
      organizationId: params.organizationId,
      ...body,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.created({ data: result.value.toResponse() });
  }

  /**
   * GET /developers/:id
   * Get a developer by ID
   */
  async getById(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.getDev.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * GET /organizations/:organizationId/developers
   * List developers by organization
   */
  async listByOrganization(request: Request, params: { organizationId: string }): Promise<Response> {
    const result = await this.listDevsByOrg.execute({
      organizationId: params.organizationId,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({
      data: result.value.map(dev => dev.toResponse()),
      meta: { count: result.value.length },
    });
  }

  /**
   * PATCH /developers/:id
   * Update a developer
   */
  async update(request: Request, params: { id: string }): Promise<Response> {
    const body = await request.json();

    const result = await this.updateDev.execute({ id: params.id, ...body });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * DELETE /developers/:id
   * Delete a developer
   */
  async delete(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.deleteDev.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.noContent();
  }
}
