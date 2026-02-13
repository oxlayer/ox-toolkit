/**
 * In-Memory Device Session Repository
 *
 * Simple in-memory implementation for testing without a database.
 * WARNING: Data is lost on server restart. Use PostgreSQL implementation for production.
 */

import type { IDeviceSessionRepository } from './index.js';
import type { DeviceSession } from '../domain/index.js';

interface StoredSession {
  session: DeviceSession;
  expiresAt: number;
}

/**
 * In-memory device session repository
 */
export class MemoryDeviceSessionRepository implements IDeviceSessionRepository {
  private readonly storage = new Map<string, StoredSession>();

  async save(session: DeviceSession): Promise<void> {
    const storageKey = this.getStorageKey(session.id);
    const expiresAt = session.expiresAt.getTime();

    this.storage.set(storageKey, { session, expiresAt });

    // Also index by device code and user code for lookups
    this.storage.set(`deviceCode:${session.deviceCode}`, storageKey);
    this.storage.set(`userCode:${session.userCode}`, storageKey);

    // Clean up expired sessions periodically
    this.cleanupExpired();
  }

  async findById(id: string): Promise<DeviceSession | null> {
    const storageKey = this.getStorageKey(id);
    const stored = this.storage.get(storageKey);

    if (!stored) return null;
    if (this.isExpired(stored)) {
      this.storage.delete(storageKey);
      return null;
    }

    return stored.session;
  }

  async findAll(): Promise<DeviceSession[]> {
    this.cleanupExpired();
    const sessions: DeviceSession[] = [];

    for (const [key, stored] of this.storage.entries()) {
      if (!key.endsWith(':main')) continue;
      if (this.isExpired(stored)) continue;
      sessions.push(stored.session);
    }

    return sessions;
  }

  async delete(id: string): Promise<void> {
    const storageKey = this.getStorageKey(id);
    const stored = this.storage.get(storageKey);

    if (stored) {
      // Remove from code indexes too
      this.storage.delete(`deviceCode:${stored.session.deviceCode}`);
      this.storage.delete(`userCode:${stored.session.userCode}`);
      this.storage.delete(storageKey);
    }
  }

  async exists(id: string): Promise<boolean> {
    const stored = this.storage.get(this.getStorageKey(id));
    if (!stored) return false;
    if (this.isExpired(stored)) {
      this.storage.delete(this.getStorageKey(id));
      return false;
    }
    return true;
  }

  async findByDeviceCode(code: string): Promise<DeviceSession | null> {
    const storageKey = this.storage.get(`deviceCode:${code}`);
    if (!storageKey) return null;

    const stored = this.storage.get(storageKey as string);
    if (!stored) return null;

    if (this.isExpired(stored)) {
      this.storage.delete(storageKey);
      return null;
    }

    return stored.session;
  }

  async findByUserCode(code: string): Promise<DeviceSession | null> {
    const storageKey = this.storage.get(`userCode:${code}`);
    if (!storageKey) return null;

    const stored = this.storage.get(storageKey as string);
    if (!stored) return null;

    if (this.isExpired(stored)) {
      this.storage.delete(storageKey);
      return null;
    }

    return stored.session;
  }

  async findPendingByOrganization(organizationId: string): Promise<DeviceSession[]> {
    this.cleanupExpired();
    const sessions: DeviceSession[] = [];

    for (const [key, stored] of this.storage.entries()) {
      if (!key.endsWith(':main')) continue;
      if (this.isExpired(stored)) continue;

      if (stored.session.organizationId === organizationId && stored.session.status === 'pending') {
        sessions.push(stored.session);
      }
    }

    return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteExpired(): Promise<number> {
    return this.cleanupExpired();
  }

  private getStorageKey(id: string): string {
    return `${id}:main`;
  }

  private isExpired(stored: StoredSession): boolean {
    return Date.now() > stored.expiresAt;
  }

  private cleanupExpired(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, stored] of this.storage.entries()) {
      if (now > stored.expiresAt) {
        this.storage.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}
