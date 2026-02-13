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

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

export interface InitiateDeviceAuthRequest {
  deviceName: string;
  environment: Environment;
  scopes?: string[];
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
    private readonly deviceSessionRepo: IDeviceSessionRepository
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

    if (!session.isValid()) {
      return {
        pending: false,
        error: 'Session is not valid',
      };
    }

    const accessToken = this.generateJwt(session);

    return session.toTokenResponse(accessToken);
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

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
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
