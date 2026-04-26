/**
 * Unit Tests for Tenant Indexing Manager
 *
 * Tests MongoDB tenant_id index management for multi-tenant collections.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { TenantIndexingManager } from '../tenancy-aware-mongo';

// Mock MongoDB Db
const createMockDb = () => {
  const indexes = new Map<string, any[]>();

  return {
    listCollections: jest.fn(() => ({
      toArray: async () => [
        { name: 'users' },
        { name: 'products' },
        { name: 'orders' },
        { name: 'migrations' },
      ],
    })),

    collection: jest.fn((name: string) => {
      return {
        indexes: async () => indexes.get(name) || [],
        createIndex: jest.fn(async (spec: any, options?: any) => {
          if (!indexes.has(name)) {
            indexes.set(name, []);
          }
          const existing = indexes.get(name)!;
          existing.push({
            key: spec,
            name: options?.name || 'index',
            ...options,
          });
        }),
      };
    }),
  };
};

describe('Tenant Indexing Manager', () => {
  let manager: TenantIndexingManager;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    manager = new TenantIndexingManager(mockDb as any, 'tenant_id');
  });

  describe('enableTenantIndexing()', () => {
    it('should list all collections in database', async () => {
      const result = await manager.enableTenantIndexing();

      expect(result.collections).toHaveLength(4);
      expect(result.collections).toContain('users');
      expect(result.collections).toContain('products');
      expect(result.collections).toContain('orders');
      expect(result.collections).toContain('migrations');
    });

    it('should create tenant_id index on collections without it', async () => {
      const result = await manager.enableTenantIndexing();

      expect(result.indexesCreated).toHaveLength(4);
      expect(result.indexesCreated).toContain('users');
      expect(result.indexesCreated).toContain('products');
      expect(result.indexesCreated).toContain('orders');
      expect(result.indexesCreated).toContain('migrations');
    });

    it('should create indexes with correct specification', async () => {
      await manager.enableTenantIndexing();

      const usersCollection = mockDb.collection('users');
      expect(usersCollection.createIndex).toHaveBeenCalledWith(
        { tenant_id: 1 },
        expect.objectContaining({
          name: 'tenant_idx_users',
          background: true,
        })
      );
    });

    it('should not create index if already exists', async () => {
      // Mock existing indexes
      const mockDbWithIndexes = createMockDb();
      mockDbWithIndexes.collection = jest.fn((_name: string) => {
        return {
          indexes: async () => [{ key: { tenant_id: 1 }, name: 'existing_tenant_idx' }],
          createIndex: jest.fn(),
        };
      });

      const managerWithIndexes = new TenantIndexingManager(mockDbWithIndexes as any, 'tenant_id');
      const result = await managerWithIndexes.enableTenantIndexing();

      expect(result.indexesCreated).toHaveLength(0);
    });

    it('should return no errors when successful', async () => {
      const result = await manager.enableTenantIndexing();

      expect(result.errors).toHaveLength(0);
    });

    it('should continue processing other collections if one fails', async () => {
      const mockDbWithError = createMockDb();
      let _callCount = 0;
      mockDbWithError.collection = jest.fn((name: string) => {
        _callCount++;
        if (name === 'products') {
          return {
            indexes: async () => [],
            createIndex: jest.fn(() => {
              throw new Error('Index creation failed');
            }),
          };
        }
        return {
          indexes: async () => [],
          createIndex: jest.fn(),
        };
      });

      const managerWithError = new TenantIndexingManager(mockDbWithError as any, 'tenant_id');
      const result = await managerWithError.enableTenantIndexing();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].collection).toBe('products');
      expect(result.indexesCreated.length).toBeGreaterThan(0); // Others should succeed
    });

    it('should include error details for failed collections', async () => {
      const mockDbWithError = createMockDb();
      mockDbWithError.collection = jest.fn((_name: string) => {
        return {
          indexes: async () => [],
          createIndex: jest.fn(() => {
            throw new Error('Connection timeout');
          }),
        };
      });

      const managerWithError = new TenantIndexingManager(mockDbWithError as any, 'tenant_id');
      const result = await managerWithError.enableTenantIndexing();

      result.errors.forEach((error) => {
        expect(error.collection).toBeDefined();
        expect(error.error).toBeDefined();
        expect(error.error).toContain('Connection timeout');
      });
    });
  });

  describe('Custom Tenant Column', () => {
    it('should use custom tenant column name', async () => {
      const customManager = new TenantIndexingManager(mockDb as any, 'org_id');

      await customManager.enableTenantIndexing();

      const usersCollection = mockDb.collection('users');
      expect(usersCollection.createIndex).toHaveBeenCalledWith(
        { org_id: 1 },
        expect.any(Object)
      );
    });

    it('should create indexes with custom column in name', async () => {
      const customManager = new TenantIndexingManager(mockDb as any, 'org_id');

      await customManager.enableTenantIndexing();

      const ordersCollection = mockDb.collection('orders');
      expect(ordersCollection.createIndex).toHaveBeenCalledWith(
        { org_id: 1 },
        expect.objectContaining({
          name: 'tenant_idx_orders',
        })
      );
    });
  });

  describe('Index Options', () => {
    it('should create background indexes by default', async () => {
      await manager.enableTenantIndexing();

      const usersCollection = mockDb.collection('users');
      expect(usersCollection.createIndex).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          background: true,
        })
      );
    });

    it('should use collection name in index name', async () => {
      await manager.enableTenantIndexing();

      const productsCollection = mockDb.collection('products');
      expect(productsCollection.createIndex).toHaveBeenCalledWith(
        { tenant_id: 1 },
        expect.objectContaining({
          name: 'tenant_idx_products',
        })
      );
    });
  });

  describe('Empty Database', () => {
    it('should handle empty database', async () => {
      const emptyDb = createMockDb();
      emptyDb.listCollections = jest.fn(() => ({
        toArray: async () => [],
      }));

      const emptyManager = new TenantIndexingManager(emptyDb as any, 'tenant_id');
      const result = await emptyManager.enableTenantIndexing();

      expect(result.collections).toHaveLength(0);
      expect(result.indexesCreated).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Large Collections', () => {
    it('should handle many collections', async () => {
      const largeDb = createMockDb();
      const collectionNames = Array.from({ length: 100 }, (_, i) => `collection_${i}`);

      largeDb.listCollections = jest.fn(() => ({
        toArray: async () => collectionNames.map((name) => ({ name })),
      }));

      const largeManager = new TenantIndexingManager(largeDb as any, 'tenant_id');
      const result = await largeManager.enableTenantIndexing();

      expect(result.collections).toHaveLength(100);
      expect(result.indexesCreated).toHaveLength(100);
    });
  });

  describe('Existing Indexes', () => {
    it('should skip collections with existing tenant_id index', async () => {
      const dbWithIndexes = createMockDb();
      let _callCount = 0;
      dbWithIndexes.collection = jest.fn((name: string) => {
        _callCount++;
        return {
          indexes: async () => {
            if (name === 'users') {
              return [{ key: { tenant_id: 1 }, name: 'tenant_idx_users' }];
            }
            return [];
          },
          createIndex: jest.fn(),
        };
      });

      const managerWithIndexes = new TenantIndexingManager(dbWithIndexes as any, 'tenant_id');
      const result = await managerWithIndexes.enableTenantIndexing();

      expect(result.indexesCreated).not.toContain('users');
      expect(result.indexesCreated.length).toBeGreaterThan(0);
    });

    it('should detect tenant_id index regardless of index name', async () => {
      const dbWithIndexes = createMockDb();
      dbWithIndexes.collection = jest.fn((_name: string) => {
        return {
          indexes: async () => [
            { key: { _id: 1 }, name: '_id_' },
            { key: { tenant_id: 1 }, name: 'custom_tenant_index' },
            { key: { email: 1 }, name: 'email_idx' },
          ],
          createIndex: jest.fn(),
        };
      });

      const managerWithIndexes = new TenantIndexingManager(dbWithIndexes as any, 'tenant_id');
      const result = await managerWithIndexes.enableTenantIndexing();

      expect(result.indexesCreated).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle collection names with special characters', async () => {
      const dbWithSpecialNames = createMockDb();
      dbWithSpecialNames.listCollections = jest.fn(() => ({
        toArray: async () => [
          { name: 'collection-with-dashes' },
          { name: 'collection_with_underscores' },
          { name: 'collection.with.dots' },
        ],
      }));

      const managerWithSpecial = new TenantIndexingManager(dbWithSpecialNames as any, 'tenant_id');
      const result = await managerWithSpecial.enableTenantIndexing();

      expect(result.collections).toHaveLength(3);
      expect(result.indexesCreated).toHaveLength(3);
    });

    it('should handle very long collection names', async () => {
      const longName = 'a'.repeat(1000);
      const dbWithLongName = createMockDb();
      dbWithLongName.listCollections = jest.fn(() => ({
        toArray: async () => [{ name: longName }],
      }));

      const managerWithLong = new TenantIndexingManager(dbWithLongName as any, 'tenant_id');
      const result = await managerWithLong.enableTenantIndexing();

      expect(result.collections).toContain(longName);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle listCollections errors', async () => {
      const failingDb = createMockDb();
      failingDb.listCollections = jest.fn(() => {
        throw new Error('Cannot list collections');
      });

      const failingManager = new TenantIndexingManager(failingDb as any, 'tenant_id');

      await expect(failingManager.enableTenantIndexing()).rejects.toThrow(
        'Cannot list collections'
      );
    });

    it('should handle indexes() errors gracefully', async () => {
      const dbWithError = createMockDb();
      dbWithError.collection = jest.fn((_name: string) => {
        return {
          indexes: async () => {
            throw new Error('Cannot get indexes');
          },
          createIndex: jest.fn(),
        };
      });

      const managerWithError = new TenantIndexingManager(dbWithError as any, 'tenant_id');
      const result = await managerWithError.enableTenantIndexing();

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle partial failures', async () => {
      const dbWithPartialFailure = createMockDb();
      let callCount = 0;
      dbWithPartialFailure.collection = jest.fn((_name: string) => {
        callCount++;
        return {
          indexes: async () => [],
          createIndex: jest.fn(() => {
            if (callCount === 2) {
              throw new Error('Index creation failed');
            }
          }),
        };
      });

      const managerWithPartial = new TenantIndexingManager(dbWithPartialFailure as any, 'tenant_id');
      const result = await managerWithPartial.enableTenantIndexing();

      expect(result.errors).toHaveLength(1);
      expect(result.indexesCreated.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle real-world workflow', async () => {
      // First run - create all indexes
      const result1 = await manager.enableTenantIndexing();
      expect(result1.indexesCreated.length).toBeGreaterThan(0);

      // Second run - should skip existing indexes
      const mockDbWithIndexes = createMockDb();
      mockDbWithIndexes.collection = jest.fn((name: string) => {
        return {
          indexes: async () => [{ key: { tenant_id: 1 }, name: `tenant_idx_${name}` }],
          createIndex: jest.fn(),
        };
      });

      const managerWithIndexes = new TenantIndexingManager(mockDbWithIndexes as any, 'tenant_id');
      const result2 = await managerWithIndexes.enableTenantIndexing();

      expect(result2.indexesCreated).toHaveLength(0);
      expect(result2.errors).toHaveLength(0);
    });
  });
});
