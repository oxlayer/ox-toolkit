/**
 * Capability Resolution Controller
 *
 * HTTP controller for SDK capability resolution endpoints.
 * These are the endpoints that SDKs will call to get their configuration.
 */

import { HttpError } from '@oxlayer/foundation-http-kit';
import { ApiKeyAuthMiddleware, type AuthContext } from '../middleware/api-key-auth.js';
import { CapabilityResolutionService } from '../services/capability-resolution.js';

/**
 * Controller for SDK capability resolution
 *
 * This controller provides the endpoints that SDKs use to:
 * 1. Resolve their capabilities and limits
 * 2. Request package downloads
 *
 * These endpoints are authenticated using API keys.
 */
export class CapabilityResolutionController {
  constructor(
    private readonly authMiddleware: ApiKeyAuthMiddleware,
    private readonly resolutionService: CapabilityResolutionService
  ) {}

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
      throw HttpError.fromUnknown(error);
    }
  }

  /**
   * POST /v1/packages/download
   * Request a package download
   *
   * Request body:
   * {
   *   "apiKey": "oxl_...",
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

      // Validate request body
      if (!body.apiKey) {
        throw new HttpError(400, 'Missing required field: apiKey');
      }
      if (!body.packageType) {
        throw new HttpError(400, 'Missing required field: packageType');
      }

      const result = await this.resolutionService.requestPackageDownload({
        apiKey: body.apiKey,
        packageType: body.packageType,
        version: body.version,
      });

      return Response.json({ data: result });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('not valid')) {
        throw new HttpError(401, error.message);
      }
      throw HttpError.fromUnknown(error);
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
