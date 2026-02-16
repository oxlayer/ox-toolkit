/**
 * Capability Resolution Controller
 *
 * HTTP controller for SDK capability resolution endpoints.
 * These are endpoints that SDKs will call to get their configuration.
 */

import { HttpError, errorToResponse } from '@oxlayer/foundation-http-kit';
import { CapabilityResolutionService } from '../services/capability-resolution.js';
import { extractJwt } from '../middleware/jwt-auth.js';
import type { AuthContext } from '../middleware/jwt-auth.js';

/**
 * Controller for SDK capability resolution
 *
 * This controller provides endpoints that SDKs use to:
 * 1. Resolve their capabilities and limits
 * 2. Request package downloads
 *
 * Note: The resolve endpoint uses API key auth (for SDKs)
 * The download endpoint uses JWT auth (for CLI)
 */
export class CapabilityResolutionController {
  constructor(
    private readonly resolutionService: CapabilityResolutionService
  ) { }

  /**
   * POST /v1/capabilities/resolve
   * Resolve capabilities for a SDK request
   *
   * This is the main endpoint that SDKs call to get their configuration.
   *
   * Request body:
   * {
   *   "apiKey": "oxl_...",
   *   "projectId": "...",
   *   "environment": "production",
   *   "requested": ["auth", "storage", "vector"]
   * }
   *
   * Response:
   * {
   *   "organizationId": "...",
   *   "licenseId": "...",
   *   "environment": "production",
   *   "capabilities": {
   *     "auth": { "maxRealms": 10, "sso": true, "rbac": true },
   *     "storage": { "encryption": true, "maxStorageGb": 1000 }
   *   },
   *   "resolvedAt": "2025-02-08T12:34:56Z"
   * }
   */
  async resolveCapabilities(request: Request): Promise<Response> {
    try {
      const body = await request.json();

      // Validate request body
      if (!body.apiKey) {
        throw new HttpError(400, 'Missing required field: apiKey');
      }
      if (!body.environment) {
        throw new HttpError(400, 'Missing required field: environment');
      }
      if (!body.requested || !Array.isArray(body.requested)) {
        throw new HttpError(400, 'Missing required field: requested (must be an array)');
      }

      const result = await this.resolutionService.resolveCapabilities({
        apiKey: body.apiKey,
        projectId: body.projectId,
        environment: body.environment,
        requested: body.requested,
      });

      return Response.json({ data: result });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not valid')) {
        throw new HttpError(401, error.message);
      }
      return errorToResponse(error);
    }
  }

  /**
   * POST /v1/packages/download
   * Request a package download
   *
   * This endpoint uses JWT Bearer token authentication (for CLI).
   * The CLI gets a JWT token via the device auth flow.
   *
   * Request headers:
   *   Authorization: Bearer <jwt_token>
   *
   * Request body:
   * {
   *   "packageType": "backend-sdk",
   *   "version": "2025_02_08_001"
   * }
   *
   * Response:
   * {
   *   "downloadUrl": "https://r2.example.com/...",
   *   "expiresAt": "2025-02-08T12:49:56Z",
   *   "packageType": "backend-sdk",
   *   "version": "2025_02_08_001"
   * }
   */
  async requestPackageDownload(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      console.log('[DEBUG] requestPackageDownload body:', JSON.stringify(body, null, 2));

      // Extract and verify JWT from Authorization header
      const auth: AuthContext = extractJwt(request);
      console.log('[DEBUG] Auth context:', { organizationId: auth.organizationId });

      // Validate request body
      if (!body.packageType) {
        throw new HttpError(400, 'Missing required field: packageType');
      }

      console.log('[DEBUG] Calling requestPackageDownloadWithJwt...');
      const result = await this.resolutionService.requestPackageDownloadWithJwt({
        organizationId: auth.organizationId,
        packageType: body.packageType,
        version: body.version,
      });

      console.log('[DEBUG] Result from service:', JSON.stringify(result, null, 2));
      return Response.json({ data: result });
    } catch (error) {
      console.log('[DEBUG] Error in requestPackageDownload:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not valid')) {
        throw new HttpError(401, error.message);
      }
      if (error instanceof Error && error.message.includes('not include')) {
        throw new HttpError(403, error.message);
      }
      return errorToResponse(error);
    }
  }

  /**
   * GET /v1/health
   * Health check endpoint
   */
  async health(): Promise<Response> {
    return Response.json({
      status: 'ok',
      service: 'oxlayer-control-panel',
      timestamp: new Date().toISOString(),
    });
  }
}
