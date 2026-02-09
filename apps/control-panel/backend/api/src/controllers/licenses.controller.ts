/**
 * Licenses Controller
 *
 * HTTP controller for license management endpoints
 */

import { BaseController, HttpError } from '@oxlayer/foundation-http-kit';
import type {
  CreateLicenseUseCase,
  UpdateLicenseUseCase,
  DeleteLicenseUseCase,
  GetLicenseUseCase,
  ListLicensesByOrganizationUseCase,
  ActivateLicenseUseCase,
  SuspendLicenseUseCase,
  RevokeLicenseUseCase,
  AddPackageToLicenseUseCase,
  RemovePackageFromLicenseUseCase,
  UpdateCapabilityLimitsUseCase,
  RemoveCapabilityFromLicenseUseCase,
} from '../use-cases/licenses/index.js';

export class LicensesController extends BaseController {
  constructor(
    private readonly createLicense: CreateLicenseUseCase,
    private readonly updateLicense: UpdateLicenseUseCase,
    private readonly deleteLicense: DeleteLicenseUseCase,
    private readonly getLicense: GetLicenseUseCase,
    private readonly listLicensesByOrg: ListLicensesByOrganizationUseCase,
    private readonly activateLicense: ActivateLicenseUseCase,
    private readonly suspendLicense: SuspendLicenseUseCase,
    private readonly revokeLicense: RevokeLicenseUseCase,
    private readonly addPackage: AddPackageToLicenseUseCase,
    private readonly removePackage: RemovePackageFromLicenseUseCase,
    private readonly updateCapability: UpdateCapabilityLimitsUseCase,
    private readonly removeCapability: RemoveCapabilityFromLicenseUseCase
  ) {
    super();
  }

  /**
   * POST /organizations/:organizationId/licenses
   * Create a new license
   */
  async create(request: Request, params: { organizationId: string }): Promise<Response> {
    try {
      const body = await request.json();

      const result = await this.createLicense.execute({
        organizationId: params.organizationId,
        ...body,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json(
        { data: license.toResponse() },
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
   * GET /licenses/:id
   * Get a license by ID
   */
  async getById(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.getLicense.execute({ id: params.id });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json({
        data: license.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * GET /organizations/:organizationId/licenses
   * List licenses by organization
   */
  async listByOrganization(request: Request, params: { organizationId: string }): Promise<Response> {
    try {
      const result = await this.listLicensesByOrg.execute({
        organizationId: params.organizationId,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const licenses = result.value;

      return Response.json({
        data: licenses.map(lic => lic.toResponse()),
        meta: { count: licenses.length },
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * PATCH /licenses/:id
   * Update a license
   */
  async update(request: Request, params: { id: string }): Promise<Response> {
    try {
      const body = await request.json();

      const result = await this.updateLicense.execute({ id: params.id, ...body });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json({
        data: license.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * DELETE /licenses/:id
   * Delete a license
   */
  async delete(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.deleteLicense.execute({ id: params.id });

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
   * POST /licenses/:id/activate
   * Activate a license
   */
  async activate(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.activateLicense.execute({ id: params.id });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json({
        data: license.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * POST /licenses/:id/suspend
   * Suspend a license
   */
  async suspend(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.suspendLicense.execute({ id: params.id });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json({
        data: license.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * POST /licenses/:id/revoke
   * Revoke a license
   */
  async revoke(request: Request, params: { id: string }): Promise<Response> {
    try {
      const result = await this.revokeLicense.execute({ id: params.id });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json({
        data: license.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * POST /licenses/:id/packages
   * Add package to license
   */
  async addPackage(request: Request, params: { id: string }): Promise<Response> {
    try {
      const body = await request.json();

      const result = await this.addPackage.execute({
        id: params.id,
        package: body.package,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json({
        data: license.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * DELETE /licenses/:id/packages/:package
   * Remove package from license
   */
  async removePackage(request: Request, params: { id: string; package: string }): Promise<Response> {
    try {
      const result = await this.removePackage.execute({
        id: params.id,
        package: params.package,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json({
        data: license.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * PUT /licenses/:id/capabilities/:capability
   * Update capability limits
   */
  async updateCapabilityLimits(request: Request, params: { id: string; capability: string }): Promise<Response> {
    try {
      const body = await request.json();

      const result = await this.updateCapability.execute({
        id: params.id,
        capability: params.capability,
        limits: body.limits,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json({
        data: license.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * DELETE /licenses/:id/capabilities/:capability
   * Remove capability from license
   */
  async removeCapability(request: Request, params: { id: string; capability: string }): Promise<Response> {
    try {
      const result = await this.removeCapability.execute({
        id: params.id,
        capability: params.capability,
      });

      if (result.isErr()) {
        throw HttpError.fromDomainError(result.error);
      }

      const license = result.value;

      return Response.json({
        data: license.toResponse(),
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw HttpError.fromUnknown(error);
    }
  }
}
