/**
 * Organizations Controller
 *
 * HTTP controller for organization management endpoints
 */

import { BaseController, HttpError, mapDomainErrorToHttpStatus } from '@oxlayer/foundation-http-kit';
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
    try {
      const body = await request.json();

      const result = await this.createOrg.execute(body);

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const organization = result.value;

      return Response.json(
        { data: organization.toResponse() },
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
   * GET /organizations/:id
   * Get an organization by ID
   */
  async getById(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.getOrg.execute({ id: params.id });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const organization = result.value;

      return Response.json({
        data: organization.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * GET /organizations
   * List all organizations
   */
  async list(): Promise<Response> {
    try {
      const result = await this.listOrgs.execute();

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const organizations = result.value;

      return Response.json({
        data: organizations.map(org => org.toResponse()),
        meta: { count: organizations.length },
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * GET /organizations/by-slug/:slug
   * Get an organization by slug
   */
  async getBySlug(request: Request, params: { slug: string }): Promise<Response> {
    try {
      const result = await this.getOrgBySlug.execute({ slug: params.slug });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const organization = result.value;

      return Response.json({
        data: organization.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * PATCH /organizations/:id
   * Update an organization
   */
  async update(request: Request, params: { id: string }): Promise<Response> {
    try {
      const body = await request.json();

      const result = await this.updateOrg.execute({ id: params.id, ...body });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const organization = result.value;

      return Response.json({
        data: organization.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * DELETE /organizations/:id
   * Delete an organization
   */
  async delete(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.deleteOrg.execute({ id: params.id });

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
