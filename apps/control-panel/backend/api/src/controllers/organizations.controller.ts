/**
 * Organizations Controller
 *
 * HTTP controller for organization management endpoints
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import { HttpError, mapDomainErrorToHttpStatus } from '@oxlayer/foundation-http-kit';
import type {
  CreateOrganizationUseCase,
  UpdateOrganizationUseCase,
  DeleteOrganizationUseCase,
  GetOrganizationUseCase,
  ListOrganizationsUseCase,
  GetOrganizationBySlugUseCase,
} from '../use-cases/organizations/index.js';

export class OrganizationsController extends BaseController {
  constructor(
    private readonly createOrg: CreateOrganizationUseCase,
    private readonly updateOrg: UpdateOrganizationUseCase,
    private readonly deleteOrg: DeleteOrganizationUseCase,
    private readonly getOrg: GetOrganizationUseCase,
    private readonly listOrgs: ListOrganizationsUseCase,
    private readonly getOrgBySlug: GetOrganizationBySlugUseCase
  ) {
    super();
  }

  /**
   * POST /organizations
   * Create a new organization
   */
  async create(request: Request): Promise<Response> {
    const body = await request.json();
    const result = await this.createOrg.execute(body);

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.created({ data: result.value.toResponse() });
  }

  /**
   * GET /organizations/:id
   * Get an organization by ID
   */
  async getById(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.getOrg.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * GET /organizations
   * List all organizations
   */
  async list(): Promise<Response> {
    const result = await this.listOrgs.execute();

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({
      data: result.value.map(org => org.toResponse()),
      meta: { count: result.value.length },
    });
  }

  /**
   * GET /organizations/by-slug/:slug
   * Get an organization by slug
   */
  async getBySlug(request: Request, params: { slug: string }): Promise<Response> {
    const result = await this.getOrgBySlug.execute({ slug: params.slug });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * PATCH /organizations/:id
   * Update an organization
   */
  async update(request: Request, params: { id: string }): Promise<Response> {
    const body = await request.json();
    const result = await this.updateOrg.execute({ id: params.id, ...body });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * DELETE /organizations/:id
   * Delete an organization
   */
  async delete(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.deleteOrg.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.noContent();
  }
}
