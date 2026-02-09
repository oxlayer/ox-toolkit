/**
 * Developers Controller
 *
 * HTTP controller for developer management endpoints
 */

import { BaseController, HttpError } from '@oxlayer/foundation-http-kit';
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
    try {
      const body = await request.json();

      const result = await this.createDev.execute({
        organizationId: params.organizationId,
        ...body,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const developer = result.value;

      return Response.json(
        { data: developer.toResponse() },
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
   * GET /developers/:id
   * Get a developer by ID
   */
  async getById(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.getDev.execute({ id: params.id });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const developer = result.value;

      return Response.json({
        data: developer.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * GET /organizations/:organizationId/developers
   * List developers by organization
   */
  async listByOrganization(request: Request, params: { organizationId: string }): Promise<Response> {
    try {
      const result = await this.listDevsByOrg.execute({
        organizationId: params.organizationId,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const developers = result.value;

      return Response.json({
        data: developers.map(dev => dev.toResponse()),
        meta: { count: developers.length },
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * PATCH /developers/:id
   * Update a developer
   */
  async update(request: Request, params: { id: string }): Promise<Response> {
    try {
      const body = await request.json();

      const result = await this.updateDev.execute({ id: params.id, ...body });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const developer = result.value;

      return Response.json({
        data: developer.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * DELETE /developers/:id
   * Delete a developer
   */
  async delete(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.deleteDev.execute({ id: params.id });

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
}
