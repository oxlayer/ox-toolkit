/**
 * PostgreSQL Device Session Repository
 *
 * Implements device session persistence using PostgreSQL with Drizzle ORM
 */

import { eq, and, gt, isNull, desc } from 'drizzle-orm';
import type { IDeviceSessionRepository } from './index.js';
import type { DeviceSession } from '../domain/index.js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema.js';
import type * as schema from '../db/schema.js';

/**
 * PostgreSQL device session repository
 */
export class PostgresDeviceSessionRepository implements IDeviceSessionRepository {
  constructor(
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  async save(session: DeviceSession): Promise<void> {
    const props = session.toPersistence();
    const data = {
      id: props.id,
      deviceCode: props.deviceCode,
      userCode: props.userCode,
      organizationId: props.organizationId,
      developerId: props.developerId,
      deviceName: props.deviceName,
      environment: props.environment,
      status: props.status,
      scopes: props.scopes,
      expiresAt: props.expiresAt,
      approvedAt: props.approvedAt,
      approvedBy: props.approvedBy,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    await this.db
      .insert(schema.deviceSessions)
      .values(data)
      .onConflictDoUpdate({
        target: schema.deviceSessions.id,
        set: {
          status: data.status,
          organizationId: data.organizationId,
          developerId: data.developerId,
          approvedAt: data.approvedAt,
          approvedBy: data.approvedBy,
          updatedAt: data.updatedAt,
        },
      });
  }

  async findById(id: string): Promise<DeviceSession | null> {
    const result = await this.db
      .select()
      .from(schema.deviceSessions)
      .where(eq(schema.deviceSessions.id, id))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async findAll(options?: any): Promise<DeviceSession[]> {
    let query = this.db.select().from(schema.deviceSessions).$dynamic();

    const results = await query;
    return results.map((row: any) => this.mapToDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.deviceSessions).where(eq(schema.deviceSessions.id, id));
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: schema.deviceSessions.id })
      .from(schema.deviceSessions)
      .where(eq(schema.deviceSessions.id, id))
      .limit(1);

    return !!result[0];
  }

  async findByDeviceCode(code: string): Promise<DeviceSession | null> {
    const result = await this.db
      .select()
      .from(schema.deviceSessions)
      .where(eq(schema.deviceSessions.deviceCode, code))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async findByUserCode(code: string): Promise<DeviceSession | null> {
    const result = await this.db
      .select()
      .from(schema.deviceSessions)
      .where(eq(schema.deviceSessions.userCode, code))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async findPendingByOrganization(organizationId: string): Promise<DeviceSession[]> {
    const results = await this.db
      .select()
      .from(schema.deviceSessions)
      .where(
        and(
          eq(schema.deviceSessions.organizationId, organizationId),
          eq(schema.deviceSessions.status, 'pending')
        )
      )
      .orderBy(desc(schema.deviceSessions.createdAt));

    return results.map((row: any) => this.mapToDomain(row));
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(schema.deviceSessions)
      .where(gt(schema.deviceSessions.expiresAt, now));

    return result.rowCount ?? 0;
  }

  private mapToDomain(row: any): DeviceSession {
    return DeviceSession.fromPersistence({
      id: row.id,
      deviceCode: row.device_code,
      userCode: row.user_code,
      organizationId: row.organization_id,
      developerId: row.developer_id,
      deviceName: row.device_name,
      environment: row.environment,
      status: row.status,
      scopes: row.scopes,
      expiresAt: new Date(row.expires_at),
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
      approvedBy: row.approved_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
