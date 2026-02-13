/**
 * Device Session Domain Entity
 *
 * Represents a device authorization session for CLI login flow (OAuth 2.0 Device Authorization Grant).
 * This enables browser-based authentication without copying API keys.
 *
 * Flow:
 * 1. CLI requests device code
 * 2. User approves in browser
 * 3. CLI polls for completion
 * 4. Access token is returned
 */

import { Entity } from '@oxlayer/foundation-domain-kit';
import { BusinessRuleViolationError, ValidationError } from '@oxlayer/foundation-domain-kit';
import { randomBytes, createHash } from 'crypto';
import type { Environment } from './types.js';

/**
 * Device session status
 */
export type DeviceSessionStatus = 'pending' | 'approved' | 'expired' | 'revoked' | 'consumed';

/**
 * Device session properties
 */
export interface DeviceSessionProps {
  id: string;
  deviceCode: string;
  deviceCodeHash: string;
  userCode: string;
  organizationId: string | null;
  developerId: string | null;
  deviceName: string;
  deviceFingerprint: string | null;
  environment: Environment;
  status: DeviceSessionStatus;
  scopes: string[];
  expiresAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validation constants
 */
const DEVICE_CODE_LENGTH = 32;
const USER_CODE_LENGTH = 8;
const USER_CODE_CHARSET = 'BCDFGHJKLMNPQRSTVWXZ';
const DEFAULT_EXPIRES_IN = 900;
const MAX_DEVICE_NAME_LENGTH = 100;

/**
 * Device session entity
 */
export class DeviceSession extends Entity<string> {
  private props: DeviceSessionProps;

  private constructor(props: DeviceSessionProps) {
    super(props.id);
    this.props = props;
  }

  get deviceCode(): string {
    return this.props.deviceCode;
  }

  get userCode(): string {
    return this.props.userCode;
  }

  get organizationId(): string | null {
    return this.props.organizationId;
  }

  get developerId(): string | null {
    return this.props.developerId;
  }

  get deviceName(): string {
    return this.props.deviceName;
  }

  get deviceFingerprint(): string | null {
    return this.props.deviceFingerprint;
  }

  get environment(): Environment {
    return this.props.environment;
  }

  get status(): DeviceSessionStatus {
    return this.props.status;
  }

  get scopes(): string[] {
    return [...this.props.scopes];
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get approvedAt(): Date | null {
    return this.props.approvedAt;
  }

  get approvedBy(): string | null {
    return this.props.approvedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  isPending(): boolean {
    return this.props.status === 'pending' && !this.isExpired();
  }

  isValid(): boolean {
    return this.props.status === 'approved' && !this.isExpired();
  }

  approve(developerId: string, organizationId: string): void {
    if (this.props.status !== 'pending') {
      throw new BusinessRuleViolationError(
        'status',
        `Cannot approve session with status: ${this.props.status}`
      );
    }

    if (this.isExpired()) {
      throw new BusinessRuleViolationError(
        'expiresAt',
        'Cannot approve expired session'
      );
    }

    this.props.status = 'approved';
    this.props.approvedAt = new Date();
    this.props.approvedBy = developerId;
    this.props.organizationId = organizationId;
    this.props.developerId = developerId;
    this.touch();
  }

  revoke(): void {
    if (this.props.status === 'revoked') return;
    this.props.status = 'revoked';
    this.touch();
  }

  markExpired(): void {
    if (this.props.status === 'expired') return;
    this.props.status = 'expired';
    this.touch();
  }

  consume(): void {
    if (this.props.status !== 'approved') {
      throw new BusinessRuleViolationError(
        'status',
        `Cannot consume session with status: ${this.props.status}`
      );
    }
    this.props.status = 'consumed';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(data: {
    deviceName: string;
    environment: Environment;
    scopes?: string[];
    expiresInSeconds?: number;
    deviceFingerprint?: string | null;
  }): DeviceSession {
    const deviceName = validateDeviceName(data.deviceName);
    const deviceCode = generateDeviceCode();
    const deviceCodeHash = hashDeviceCode(deviceCode);
    const userCode = generateUserCode();
    const scopes = data.scopes ?? ['read', 'install'];
    const expiresInSeconds = data.expiresInSeconds ?? DEFAULT_EXPIRES_IN;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const id = `device_${randomBytes(16).toString('hex')}`;

    return new DeviceSession({
      id,
      deviceCode,
      deviceCodeHash,
      userCode,
      organizationId: null,
      developerId: null,
      deviceName,
      deviceFingerprint: data.deviceFingerprint ?? null,
      environment: data.environment,
      status: 'pending',
      scopes,
      expiresAt,
      approvedAt: null,
      approvedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: DeviceSessionProps): DeviceSession {
    return new DeviceSession(props);
  }

  toPersistence(): DeviceSessionProps {
    return { ...this.props };
  }

  toInitiateResponse(baseUrl: string): {
    deviceCode: string;
    userCode: string;
    verificationUrl: string;
    pollEndpoint: string;
    expiresAt: string;
    interval: number;
  } {
    return {
      deviceCode: this.props.deviceCode,
      userCode: this.props.userCode,
      verificationUrl: `${baseUrl}/v1/device?code=${this.props.userCode}`,
      pollEndpoint: `${baseUrl}/v1/cli/device/poll`,
      expiresAt: this.props.expiresAt.toISOString(),
      interval: 5,
    };
  }

  toTokenResponse(accessToken: string): {
    accessToken: string;
    tokenInfo: {
      deviceId: string;
      scopes: string[];
      expiresAt: string;
    };
    organizationId: string;
    pending?: boolean;
    error?: string;
  } {
    if (this.props.status !== 'approved' || !this.props.organizationId) {
      return {
        accessToken: '',
        tokenInfo: {
          deviceId: this.props.id,
          scopes: this.props.scopes,
          expiresAt: this.props.expiresAt.toISOString(),
        },
        organizationId: '',
        pending: true,
      };
    }

    return {
      accessToken,
      tokenInfo: {
        deviceId: this.props.id,
        scopes: this.props.scopes,
        expiresAt: this.props.expiresAt.toISOString(),
      },
      organizationId: this.props.organizationId,
    };
  }
}

function generateDeviceCode(): string {
  return randomBytes(DEVICE_CODE_LENGTH).toString('hex');
}

function hashDeviceCode(deviceCode: string): string {
  return createHash('sha256').update(deviceCode, 'utf-8').digest('hex');
}

function generateUserCode(): string {
  let code = '';
  for (let i = 0; i < USER_CODE_LENGTH; i++) {
    if (i === 4) code += '-';
    code += USER_CODE_CHARSET[Math.floor(Math.random() * USER_CODE_CHARSET.length)];
  }
  return code;
}

function validateDeviceName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('deviceName', 'Device name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('deviceName', 'Device name cannot be empty');
  }

  if (trimmed.length > MAX_DEVICE_NAME_LENGTH) {
    throw new ValidationError(
      'deviceName',
      `Device name cannot exceed ${MAX_DEVICE_NAME_LENGTH} characters`
    );
  }

  return trimmed;
}
