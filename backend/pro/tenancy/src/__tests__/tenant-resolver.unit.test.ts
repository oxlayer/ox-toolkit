/**
 * Unit Tests for Tenant Resolver
 *
 * Tests tenant resolution, caching, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  InMemoryTenantResolver,
  CachedTenantResolver,
  type TenantResolver,
  type TenantConfig,
  type CacheStats,
} from '../resolver';
import {
  TenantNotFoundError,
  TenantNotReadyError,
  TenantDisabledError,
} from '../errors';

// Test tenant configurations
const createTestTenant = (id: string, state: TenantConfig['state'] = 'ready'): TenantConfig => ({
  tenantId: id,
  state,
  tier: 'b2c',
  region: 'us-east-1',
  isolation: {
    database: 'shared',
    cache: 'shared',
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: `db_${id}`,
    user: 'user',
    secretRef: `secret/${id}`,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('Tenant Resolver', () => {
  describe('InMemoryTenantResolver', () => {
    let resolver: InMemoryTenantResolver;
    let tenants: Map<string, TenantConfig>;

    beforeEach(() => {
      tenants = new Map([
        ['tenant-1', createTestTenant('tenant-1', 'ready')],
        ['tenant-2', createTestTenant('tenant-2', 'ready')],
        ['tenant-3', createTestTenant('tenant-3', 'provisioning')],
        ['tenant-4', createTestTenant('tenant-4', 'disabled')],
      ]);
      resolver = new InMemoryTenantResolver(tenants);
    });

    it('should resolve existing ready tenant', async () => {
      const tenant = await resolver.resolve('tenant-1');

      expect(tenant.tenantId).toBe('tenant-1');
      expect(tenant.state).toBe('ready');
    });

    it('should cache resolved tenant', async () => {
      await resolver.resolve('tenant-1');
      const stats = resolver.getStats();

      expect(stats.size).toBe(1);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
    });

    it('should return cached tenant on subsequent calls', async () => {
      await resolver.resolve('tenant-1');
      await resolver.resolve('tenant-1');
      const stats = resolver.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBe(0.5);
    });

    it('should throw TenantNotFoundError for non-existent tenant', async () => {
      await expect(resolver.resolve('non-existent')).rejects.toThrow(TenantNotFoundError);
    });

    it('should throw TenantNotReadyError for provisioning tenant', async () => {
      await expect(resolver.resolve('tenant-3')).rejects.toThrow(TenantNotReadyError);
    });

    it('should include current state in TenantNotReadyError', async () => {
      try {
        await resolver.resolve('tenant-3');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.currentState).toBe('provisioning');
      }
    });

    it('should throw TenantDisabledError for disabled tenant', async () => {
      await expect(resolver.resolve('tenant-4')).rejects.toThrow(TenantDisabledError);
    });

    it('should invalidate specific tenant cache', async () => {
      await resolver.resolve('tenant-1');
      resolver.invalidate('tenant-1');
      const stats = resolver.getStats();

      expect(stats.size).toBe(0);
    });

    it('should clear all cache', async () => {
      await resolver.resolve('tenant-1');
      await resolver.resolve('tenant-2');
      resolver.clear();
      const stats = resolver.getStats();

      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should track cache statistics accurately', async () => {
      await resolver.resolve('tenant-1'); // miss
      await resolver.resolve('tenant-1'); // hit
      await resolver.resolve('tenant-2'); // miss
      await resolver.resolve('tenant-2'); // hit
      await resolver.resolve('tenant-1'); // hit

      const stats = resolver.getStats();

      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.hitRatio).toBeCloseTo(0.6);
    });

    it('should return 0 hit ratio for empty cache', () => {
      const stats = resolver.getStats();

      expect(stats.hitRatio).toBe(0);
    });

    it('should use custom TTL', async () => {
      const customTTL = 100; // 100ms
      const customResolver = new InMemoryTenantResolver(tenants, customTTL);

      await customResolver.resolve('tenant-1');
      await new Promise((resolve) => setTimeout(resolve, 150));
      await customResolver.resolve('tenant-1');

      const stats = customResolver.getStats();
      expect(stats.misses).toBe(2); // Should be a miss after TTL expires
    });
  });

  describe('CachedTenantResolver', () => {
    class TestTenantResolver extends CachedTenantResolver {
      constructor(private tenants: Map<string, TenantConfig>, ttlMs?: number) {
        super(ttlMs);
      }

      protected async load(tenantId: string): Promise<TenantConfig> {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) {
          throw new TenantNotFoundError(tenantId);
        }
        return tenant;
      }

      // Expose cache for testing
      getCacheSize(): number {
        return this.cache.size;
      }
    }

    let resolver: TestTenantResolver;
    let tenants: Map<string, TenantConfig>;

    beforeEach(() => {
      tenants = new Map([
        ['tenant-1', createTestTenant('tenant-1', 'ready')],
        ['tenant-2', createTestTenant('tenant-2', 'provisioning')],
        ['tenant-3', createTestTenant('tenant-3', 'disabled')],
      ]);
      resolver = new TestTenantResolver(tenants);
    });

    it('should load tenant from source on cache miss', async () => {
      const tenant = await resolver.resolve('tenant-1');

      expect(tenant.tenantId).toBe('tenant-1');
      expect(resolver.getCacheSize()).toBe(1);
    });

    it('should cache loaded tenant', async () => {
      await resolver.resolve('tenant-1');
      await resolver.resolve('tenant-1');

      expect(resolver.getCacheSize()).toBe(1);

      const stats = resolver.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should throw TenantNotFoundError for non-existent tenant', async () => {
      await expect(resolver.resolve('non-existent')).rejects.toThrow(TenantNotFoundError);
    });

    it('should throw TenantNotReadyError for non-ready tenant', async () => {
      await expect(resolver.resolve('tenant-2')).rejects.toThrow(TenantNotReadyError);
    });

    it('should throw TenantDisabledError for disabled tenant', async () => {
      await expect(resolver.resolve('tenant-3')).rejects.toThrow(TenantDisabledError);
    });

    it('should not cache non-ready tenants', async () => {
      try {
        await resolver.resolve('tenant-2');
      } catch (e) {
        // Expected to throw
      }

      expect(resolver.getCacheSize()).toBe(0);
    });

    it('should invalidate specific tenant', async () => {
      await resolver.resolve('tenant-1');
      resolver.invalidate('tenant-1');

      expect(resolver.getCacheSize()).toBe(0);
    });

    it('should clear all cache', async () => {
      await resolver.resolve('tenant-1');
      resolver.clear();

      expect(resolver.getCacheSize()).toBe(0);
      expect(resolver.getStats().misses).toBe(0);
    });

    it('should track statistics', async () => {
      await resolver.resolve('tenant-1'); // miss
      await resolver.resolve('tenant-1'); // hit

      const stats = resolver.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(1);
    });

    it('should use custom TTL', async () => {
      const shortTTLResolver = new TestTenantResolver(tenants, 50);

      await shortTTLResolver.resolve('tenant-1');
      expect(shortTTLResolver.getCacheSize()).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await shortTTLResolver.resolve('tenant-1');
      const stats = shortTTLResolver.getStats();
      expect(stats.misses).toBe(2); // Cache expired
    });
  });

  describe('TenantResolver Interface', () => {
    it('should enforce interface contract', async () => {
      class CustomResolver implements TenantResolver {
        private cache = new Map<string, TenantConfig>();

        async resolve(tenantId: string): Promise<TenantConfig> {
          const cached = this.cache.get(tenantId);
          if (cached) {
            return cached;
          }

          const tenant = createTestTenant(tenantId);
          this.cache.set(tenantId, tenant);
          return tenant;
        }

        invalidate(tenantId: string): void {
          this.cache.delete(tenantId);
        }

        clear(): void {
          this.cache.clear();
        }

        getStats(): CacheStats {
          return {
            size: this.cache.size,
            hits: 0,
            misses: 0,
            hitRatio: 0,
          };
        }
      }

      const resolver = new CustomResolver();
      const tenant = await resolver.resolve('test-tenant');

      expect(tenant.tenantId).toBe('test-tenant');
      expect(resolver.getStats().size).toBe(1);

      resolver.invalidate('test-tenant');
      expect(resolver.getStats().size).toBe(0);
    });
  });

  describe('Cache Behavior', () => {
    it('should handle multiple tenants independently', async () => {
      const tenants = new Map([
        ['tenant-1', createTestTenant('tenant-1')],
        ['tenant-2', createTestTenant('tenant-2')],
        ['tenant-3', createTestTenant('tenant-3')],
      ]);

      const resolver = new InMemoryTenantResolver(tenants);

      await resolver.resolve('tenant-1');
      await resolver.resolve('tenant-2');
      await resolver.resolve('tenant-3');

      const stats = resolver.getStats();
      expect(stats.size).toBe(3);
    });

    it('should handle cache invalidation of non-existent tenant', () => {
      const resolver = new InMemoryTenantResolver(new Map());

      expect(() => resolver.invalidate('non-existent')).not.toThrow();
    });

    it('should handle multiple invalidations', async () => {
      const tenants = new Map([
        ['tenant-1', createTestTenant('tenant-1')],
        ['tenant-2', createTestTenant('tenant-2')],
      ]);

      const resolver = new InMemoryTenantResolver(tenants);

      await resolver.resolve('tenant-1');
      await resolver.resolve('tenant-2');

      resolver.invalidate('tenant-1');
      expect(resolver.getStats().size).toBe(1);

      resolver.invalidate('tenant-2');
      expect(resolver.getStats().size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tenant map', async () => {
      const resolver = new InMemoryTenantResolver(new Map());

      await expect(resolver.resolve('any-tenant')).rejects.toThrow(TenantNotFoundError);
    });

    it('should handle tenant with special characters in ID', async () => {
      const tenants = new Map([['tenant/with\\special"chars', createTestTenant('tenant/with\\special"chars')]]);
      const resolver = new InMemoryTenantResolver(tenants);

      const tenant = await resolver.resolve('tenant/with\\special"chars');
      expect(tenant.tenantId).toBe('tenant/with\\special"chars');
    });

    it('should handle very long tenant ID', async () => {
      const longId = 'a'.repeat(1000);
      const tenants = new Map([[longId, createTestTenant(longId)]]);
      const resolver = new InMemoryTenantResolver(tenants);

      const tenant = await resolver.resolve(longId);
      expect(tenant.tenantId).toBe(longId);
    });

    it('should handle zero TTL', async () => {
      const tenants = new Map([['tenant-1', createTestTenant('tenant-1')]]);
      const resolver = new InMemoryTenantResolver(tenants, 0);

      await resolver.resolve('tenant-1');
      await resolver.resolve('tenant-1'); // Should always be a miss with TTL 0

      const stats = resolver.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should handle very large TTL', async () => {
      const largeTTL = 365 * 24 * 60 * 60 * 1000; // 1 year
      const tenants = new Map([['tenant-1', createTestTenant('tenant-1')]]);
      const resolver = new InMemoryTenantResolver(tenants, largeTTL);

      await resolver.resolve('tenant-1');
      await resolver.resolve('tenant-1');

      const stats = resolver.getStats();
      expect(stats.hits).toBe(1);
    });
  });

  describe('Error Messages', () => {
    it('should include tenant ID in TenantNotFoundError', async () => {
      const resolver = new InMemoryTenantResolver(new Map());

      try {
        await resolver.resolve('missing-tenant');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('missing-tenant');
        expect(error.code).toBe('TENANT_NOT_FOUND');
      }
    });

    it('should include state in TenantNotReadyError', async () => {
      const tenants = new Map([['tenant-1', createTestTenant('tenant-1', 'migrating')]]);
      const resolver = new InMemoryTenantResolver(tenants);

      try {
        await resolver.resolve('tenant-1');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('tenant-1');
        expect(error.message).toContain('migrating');
        expect(error.currentState).toBe('migrating');
      }
    });

    it('should have correct error codes', async () => {
      const tenants = new Map([
        ['tenant-1', createTestTenant('tenant-1', 'provisioning')],
        ['tenant-2', createTestTenant('tenant-2', 'disabled')],
      ]);
      const resolver = new InMemoryTenantResolver(tenants);

      try {
        await resolver.resolve('tenant-1');
      } catch (error: any) {
        expect(error.code).toBe('TENANT_NOT_READY');
      }

      try {
        await resolver.resolve('tenant-2');
      } catch (error: any) {
        expect(error.code).toBe('TENANT_DISABLED');
      }
    });
  });
});
