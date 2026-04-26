/**
 * Device Auth Service
 *
 * Implements OAuth 2.0 Device Authorization Grant (RFC 8628) for CLI authentication.
 *
 * Flow:
 * 1. CLI initiates auth -> receives device code and user code
 * 2. CLI opens browser with user code
 * 3. User logs in and approves in browser
 * 4. CLI polls for completion
 * 5. Service returns JWT access token
 */

import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import type { IDeviceSessionRepository } from '../repositories/index.js';
import type { DeviceSession, Environment } from '../domain/index.js';
import { KeycloakSyncService } from './keycloak-sync.service.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for device auth');
}
const JWT_EXPIRES_IN = '7d';  // Device tokens are valid for 7 days

/**
 * Check if error is a foreign key constraint violation for organization
 * Handles both DrizzleQueryError and PostgresError formats
 */
function isOrganizationForeignKeyError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as {
      code?: string;
      constraint?: string;
      constraint_name?: string;
      detail?: string;
      table_name?: string;
      message?: string;
      cause?: unknown;
    };

    // Check direct properties (PostgresError)
    const code = err.code;
    const constraintMatch =
      err.constraint === 'device_sessions_organization_id_organizations_id_fk' ||
      err.constraint_name === 'device_sessions_organization_id_organizations_id_fk';
    const detailMatch = err.detail?.includes('organizations') ?? false;
    const orgIdMatch = err.detail?.includes('organization_id') ?? false;
    const tableMatch = err.table_name === 'device_sessions';

    if (code === '23503' && (constraintMatch || detailMatch || orgIdMatch || tableMatch)) {
      return true;
    }

    // Check message for DrizzleQueryError (wraps PostgresError)
    // The message format is: "Failed query: ..." followed by the actual PostgresError
    const messageMatch = err.message?.includes('violates foreign key constraint') &&
      err.message?.includes('device_sessions_organization_id_organizations_id_fk');

    if (messageMatch) {
      return true;
    }

    // Check nested cause (Drizzle may wrap the error)
    if (err.cause) {
      return isOrganizationForeignKeyError(err.cause);
    }
  }
  return false;
}

/**
 * Check if error is a foreign key constraint violation for developer
 * Handles both DrizzleQueryError and PostgresError formats
 */
function isDeveloperForeignKeyError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as {
      code?: string;
      constraint?: string;
      constraint_name?: string;
      detail?: string;
      table_name?: string;
      message?: string;
      cause?: unknown;
    };

    // Check direct properties (PostgresError)
    const code = err.code;
    const constraintMatch =
      err.constraint === 'device_sessions_developer_id_developers_id_fk' ||
      err.constraint_name === 'device_sessions_developer_id_developers_id_fk';
    const detailMatch = err.detail?.includes('developers') ?? false;
    const devIdMatch = err.detail?.includes('developer_id') ?? false;
    const tableMatch = err.table_name === 'device_sessions';

    if (code === '23503' && (constraintMatch || detailMatch || devIdMatch || tableMatch)) {
      return true;
    }

    // Check message for DrizzleQueryError (wraps PostgresError)
    // Look for various patterns that indicate a developer FK error
    const message = err.message || '';
    const messageMatch =
      message.includes('violates foreign key constraint') &&
      (message.includes('device_sessions_developer_id_developers_id_fk') ||
       message.includes('"developers"') ||
       (message.includes('developer_id') && message.includes('not present in table')));

    if (messageMatch) {
      return true;
    }

    // Check nested cause (Drizzle may wrap the error)
    if (err.cause) {
      return isDeveloperForeignKeyError(err.cause);
    }
  }
  return false;
}

export interface InitiateDeviceAuthRequest {
  deviceName: string;
  environment: Environment;
  scopes?: string[];
  deviceFingerprint?: string | null;
}

export interface InitiateDeviceAuthResponse {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  pollEndpoint: string;
  expiresAt: string;
  interval: number;
}

export interface PollForTokenRequest {
  deviceCode: string;
}

export interface PollForTokenResponse {
  pending?: boolean;
  accessToken?: string;
  tokenInfo?: {
    deviceId: string;
    scopes: string[];
    expiresAt: string;
  };
  organizationId?: string;
  error?: string;
}

export interface ApproveDeviceRequest {
  userCode: string;
  developerId: string;
  organizationId: string;
}

export interface JwtPayload {
  deviceId: string;
  organizationId: string;
  scopes: string[];
  iat: number;
  exp: number;
}

/**
 * Device Auth Service
 */
export class DeviceAuthService {
  constructor(
    private readonly deviceSessionRepo: IDeviceSessionRepository,
    private readonly keycloakSyncService?: KeycloakSyncService
  ) { }

  /**
   * Initiate device authorization flow
   *
   * Creates a new device session and returns codes for the CLI.
   */
  async initiateDeviceAuth(
    request: InitiateDeviceAuthRequest,
    baseUrl: string
  ): Promise<InitiateDeviceAuthResponse> {
    const { DeviceSession } = await import('../domain/index.js');

    const session = DeviceSession.create({
      deviceName: request.deviceName,
      environment: request.environment,
      scopes: request.scopes,
      deviceFingerprint: request.deviceFingerprint,
    });

    await this.deviceSessionRepo.save(session);

    return session.toInitiateResponse(baseUrl);
  }

  /**
   * Poll for token completion
   *
   * CLI calls this endpoint repeatedly until user approves or session expires.
   */
  async pollForToken(
    request: PollForTokenRequest
  ): Promise<PollForTokenResponse> {
    const session = await this.deviceSessionRepo.findByDeviceCode(
      request.deviceCode
    );

    if (!session) {
      return {
        pending: false,
        error: 'Invalid device code',
      };
    }

    if (session.isExpired()) {
      session.markExpired();
      await this.deviceSessionRepo.save(session);
      return {
        pending: false,
        error: 'Session expired. Please try again.',
      };
    }

    if (session.isPending()) {
      return { pending: true };
    }

    // If already consumed, return error (token was already issued)
    if (session.props.status === 'consumed') {
      return {
        pending: false,
        error: 'Token already issued. Please initiate a new device authorization.',
      };
    }

    if (!session.isValid()) {
      return {
        pending: false,
        error: 'Session is not valid',
      };
    }

    const accessToken = this.generateJwt(session);

    // Get token response BEFORE consuming session (toTokenResponse checks status first)
    const response = session.toTokenResponse(accessToken);

    // Mark session as consumed after token issuance (one-time use)
    session.consume();
    await this.deviceSessionRepo.save(session);

    return response;
  }

  /**
   * Approve a device session
   *
   * Called by browser when user approves the device authorization.
   */
  async approveDevice(request: ApproveDeviceRequest): Promise<void> {
    const session = await this.deviceSessionRepo.findByUserCode(
      request.userCode
    );

    if (!session) {
      throw new Error('Invalid user code');
    }

    session.approve(request.developerId, request.organizationId);
    await this.deviceSessionRepo.save(session);
  }

  /**
   * Find device session by user code
   */
  async findByUserCode(userCode: string): Promise<DeviceSession | null> {
    return await this.deviceSessionRepo.findByUserCode(userCode);
  }

  /**
   * Revoke a device session
   */
  async revokeDevice(deviceCode: string): Promise<void> {
    const session = await this.deviceSessionRepo.findByDeviceCode(deviceCode);
    if (session) {
      session.revoke();
      await this.deviceSessionRepo.save(session);
    }
  }

  /**
   * Approve a device session with authenticated developer and organization IDs
   *
   * This method is called by the Keycloak-protected approve endpoint
   * to ensure organization_id cannot be injected via request body.
   *
   * If the organization or developer doesn't exist locally, sync it from Keycloak.
   */
  async approveDeviceWithAuth(userCode: string, developerId: string, organizationId: string, email?: string): Promise<void> {
    const session = await this.deviceSessionRepo.findByUserCodeForUpdate(userCode);

    if (!session) {
      throw new Error('Invalid user code');
    }

    if (session.isExpired()) {
      throw new Error('Session expired. Please try again.');
    }

    if (session.isPending()) {
      session.approve(developerId, organizationId);

      // Try to save, and if we get a foreign key error for organization or developer,
      // sync from Keycloak and retry.
      try {
        await this.deviceSessionRepo.save(session);
        return;
      } catch (error) {
        if (!this.keycloakSyncService) {
          throw error;
        }

        // Check if it's a foreign key constraint violation using helper functions
        if (
          isDeveloperForeignKeyError(error) ||
          isOrganizationForeignKeyError(error)
        ) {
          // It's a FK error - sync both organization and developer, then retry
          console.log('[SYNC] Detected FK constraint violation, syncing organization and developer...');

          // Sync organization first
          const orgSyncResult = await this.keycloakSyncService.syncOrganization(organizationId);
          if (orgSyncResult.error) {
            throw new Error(`Organization sync failed: ${orgSyncResult.error}`);
          }

          // Then sync developer
          const devSyncResult = await this.keycloakSyncService.syncDeveloper(developerId, organizationId, email);
          if (devSyncResult.error) {
            throw new Error(`Developer sync failed: ${devSyncResult.error}`);
          }

          // Both synced successfully, retry save
          console.log('[SYNC] Both org and developer synced, retrying save...');
          await this.deviceSessionRepo.save(session);
          return;
        }

        // Not a FK error we can handle, throw original error
        throw error;
      }
    }

    throw new Error('Session is not in pending state');
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpired(): Promise<number> {
    return this.deviceSessionRepo.deleteExpired();
  }

  /**
   * Generate JWT access token for a device session
   */
  private generateJwt(session: DeviceSession): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      deviceId: session.id,
      organizationId: session.organizationId!,
      scopes: session.scopes,
    };

    // Generate JWT with kid header to be compatible with Keycloak middleware
    // Using a fixed key ID for device-issued tokens
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      header: {
        kid: 'oxlayer-device-auth-key', // Fixed key ID for device tokens
        typ: 'JWT',
        alg: 'HS256',
      },
    });
  }

  /**
   * Verify JWT access token
   */
  verifyJwt(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }
}
