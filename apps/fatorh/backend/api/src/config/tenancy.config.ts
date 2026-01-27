/**
 * Tenant Resolver Configuration
 */

import { ENV } from './app.config';

/**
 * Tenant configuration interface
 */
export interface TenantConfig {
  id: string;
  state: 'ready' | 'provisioning' | 'suspended';
  tier: 'b2b' | 'b2c';
  region: string;
  isolation: {
    database: 'shared' | 'dedicated';
    cache: 'shared' | 'dedicated';
    storage: 'shared' | 'dedicated';
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
  };
  cache: {
    host: string;
    port: number;
    db: number;
  };
}

/**
 * In-memory tenant resolver for development
 *
 * Simple implementation that returns a default tenant configuration
 * without requiring a control database. In production, this would be
 * replaced by a full tenant resolver with database backend.
 */
export function createInMemoryTenantResolver() {
  const tenants = new Map<string, TenantConfig>([
    [
      'default',
      {
        id: 'default',
        state: 'ready',
        tier: 'b2b',
        region: 'us-east-1',
        isolation: {
          database: 'shared',
          cache: 'shared',
          storage: 'shared',
        },
        database: {
          host: ENV.POSTGRES_HOST,
          port: ENV.POSTGRES_PORT,
          name: ENV.POSTGRES_DATABASE,
          user: ENV.POSTGRES_USER,
        },
        cache: {
          host: ENV.REDIS_HOST,
          port: ENV.REDIS_PORT,
          db: ENV.REDIS_DB,
        },
      },
    ],
  ]);

  return {
    async resolve(tenantId: string): Promise<TenantConfig> {
      const tenant = tenants.get(tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }
      return tenant;
    },
    async invalidate(tenantId: string): Promise<void> {
      // No-op for in-memory resolver
    },
    async list(): Promise<TenantConfig[]> {
      return Array.from(tenants.values());
    },
  };
}

/**
 * Extract tenant from request context
 *
 * This would typically extract from JWT token or API key
 */
export function extractTenantFromRequest(request: any): string {
  // Try to get from JWT claims
  if (request.user?.tenantId) {
    return request.user.tenantId;
  }

  // Try to get from API key
  if (request.apiKey?.tenantId) {
    return request.apiKey.tenantId;
  }

  // Default tenant for development
  return 'default';
}
