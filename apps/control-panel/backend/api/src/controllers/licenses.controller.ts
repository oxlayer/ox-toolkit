/**
 * Licenses Controller
 *
 * HTTP controller for license management endpoints
 */

import { BaseController, HttpError, mapDomainErrorToHttpStatus } from '@oxlayer/foundation-http-kit';
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
    const body = await request.json();

    const result = await this.createLicense.execute({
      organizationId: params.organizationId,
      ...body,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.created({ data: result.value.toResponse() });
  }

  /**
   * GET /licenses/:id
   * Get a license by ID
   */
  async getById(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.getLicense.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * GET /organizations/:organizationId/licenses
   * List licenses by organization
   */
  async listByOrganization(request: Request, params: { organizationId: string }): Promise<Response> {
    const result = await this.listLicensesByOrg.execute({
      organizationId: params.organizationId,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({
      data: result.value.map(lic => lic.toResponse()),
      meta: { count: result.value.length },
    });
  }

  /**
   * PATCH /licenses/:id
   * Update a license
   */
  async update(request: Request, params: { id: string }): Promise<Response> {
    const body = await request.json();

    const result = await this.updateLicense.execute({ id: params.id, ...body });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * DELETE /licenses/:id
   * Delete a license
   */
  async delete(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.deleteLicense.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.noContent();
  }

  /**
   * POST /licenses/:id/activate
   * Activate a license
   */
  async activate(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.activateLicense.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * POST /licenses/:id/suspend
   * Suspend a license
   */
  async suspend(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.suspendLicense.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * POST /licenses/:id/revoke
   * Revoke a license
   */
  async revoke(request: Request, params: { id: string }): Promise<Response> {
    const result = await this.revokeLicense.execute({ id: params.id });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * POST /licenses/:id/packages
   * Add package to license
   */
  async addPackage(request: Request, params: { id: string }): Promise<Response> {
    const body = await request.json();

    const result = await this.addPackage.execute({
      id: params.id,
      package: body.package,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * DELETE /licenses/:id/packages/:packageName
   * Remove package from license
   */
  async removePackage(request: Request, params: { id: string; packageName: string }): Promise<Response> {
    const result = await this.removePackage.execute({
      id: params.id,
      package: params.packageName,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * PUT /licenses/:id/capabilities/:capability
   * Update capability limits
   */
  async updateCapabilityLimits(request: Request, params: { id: string; capability: string }): Promise<Response> {
    const body = await request.json();

    const result = await this.updateCapability.execute({
      id: params.id,
      capability: params.capability,
      limits: body.limits,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }

  /**
   * DELETE /licenses/:id/capabilities/:capability
   * Remove capability from license
   */
  async removeCapability(request: Request, params: { id: string; capability: string }): Promise<Response> {
    const result = await this.removeCapability.execute({
      id: params.id,
      capability: params.capability,
    });

    if (result.isErr()) {
      throw new HttpError(mapDomainErrorToHttpStatus(result.error), result.error.message);
    }

    return this.ok({ data: result.value.toResponse() });
  }
}
