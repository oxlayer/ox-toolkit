/**
 * Device Session Repository
 *
 * Interface for persisting device authorization sessions
 */

import type { Repository, ReadRepository } from '@oxlayer/foundation-persistence-kit';
import type { DeviceSession } from '../domain/index.js';

export interface IDeviceSessionRepository
  extends Repository<DeviceSession>,
    ReadRepository<DeviceSession> {
  findByDeviceCode(code: string): Promise<DeviceSession | null>;
  findByUserCode(code: string): Promise<DeviceSession | null>;
  findByUserCodeForUpdate(code: string): Promise<DeviceSession | null>;
  findPendingByOrganization(organizationId: string): Promise<DeviceSession[]>;
  deleteExpired(): Promise<number>;
}
