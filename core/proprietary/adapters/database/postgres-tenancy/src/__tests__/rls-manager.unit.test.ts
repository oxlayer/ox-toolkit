/**
 * Unit Tests for RLS Manager
 *
 * Tests Row-Level Security management for multi-tenant PostgreSQL databases.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { RLSManager, createRLSManager, type RLSPolicyConfig, type TableMetadata } from '../rls-manager';

// Mock Database
const createMockDatabase = () => {
  const tables: string[] = ['users', 'products', 'orders'];
  const rlsEnabled = new Set<string>();
  const tenantColumns = new Set<string>(['users', 'products']);
  const policies = new Map<string, string[]>();

  const execute = jest.fn(async (query: string) => {
    // Handle enabling RLS
    if (query.includes('ENABLE ROW LEVEL SECURITY')) {
      const match = query.match(/ALTER TABLE (\w+\.\w+) ENABLE/);
      if (match) {
        const tableName = match[1].split('.')[1];
        rlsEnabled.add(tableName);
      }
    }

    // Handle adding tenant_id column
    if (query.includes('ADD COLUMN tenant_id')) {
      const match = query.match(/ALTER TABLE (\w+\.\w+) ADD COLUMN/);
      if (match) {
        const tableName = match[1].split('.')[1];
        tenantColumns.add(tableName);
      }
    }

    // Handle creating policy
    if (query.includes('CREATE POLICY')) {
      const match = query.match(/CREATE POLICY (\w+) ON (\w+\.\w+)/);
      if (match) {
        const policyName = match[1];
        const tableName = match[2].split('.')[1];
        if (!policies.has(tableName)) {
          policies.set(tableName, []);
        }
        policies.get(tableName)!.push(policyName);
      }
    }
  });

  const executeQuery = jest.fn(async (query: string) => {
    if (query.includes('information_schema.tables')) {
      return tables.map((table) => ({ table_name: table }));
    }

    if (query.includes('information_schema.columns')) {
      return [{ exists: true }];
    }

    if (query.includes('pg_class.relrowsecurity')) {
      return tables.map((table) => ({
        relrowsecurity: rlsEnabled.has(table),
      }));
    }

    if (query.includes('pg_policies')) {
      const result: any[] = [];
      for (const [table, tablePolicies] of policies.entries()) {
        for (const policy of tablePolicies) {
          result.push({ policyname: policy });
        }
      }
      return result;
    }

    return [];
  });

  return {
    execute,
    run: execute,
    executeQuery,
  };
};

describe('RLS Manager', () => {
  let manager: RLSManager;
  let mockDb: ReturnType<typeof createMockDatabase>;

  beforeEach(() => {
    mockDb = createMockDatabase();
    manager = new RLSManager(mockDb as any);
  });

  describe('enableRLSForAllTables()', () => {
    it('should enable RLS on all tables', async () => {
      const result = await manager.enableRLSForAllTables();

      expect(result.tables).toHaveLength(3);
      expect(result.tables).toContain('users');
      expect(result.tables).toContain('products');
      expect(result.tables).toContain('orders');
    });

    it('should add tenant_id column to tables missing it', async () => {
      const result = await manager.enableRLSForAllTables();

      expect(result.columnsAdded).toContain('orders');
      expect(result.columnsAdded).not.toContain('users');
      expect(result.columnsAdded).not.toContain('products');
    });

    it('should create tenant isolation policies', async () => {
      const result = await manager.enableRLSForAllTables();

      expect(result.policiesCreated).toHaveLength(3);
      expect(result.policiesCreated).toContain('tenant_isolation_users');
      expect(result.policiesCreated).toContain('tenant_isolation_products');
      expect(result.policiesCreated).toContain('tenant_isolation_orders');
    });

    it('should return no errors when successful', async () => {
      const result = await manager.enableRLSForAllTables();

      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors from individual tables', async () => {
      // Make one table fail
      mockDb.execute.mockImplementationOnce(() => {
        throw new Error('Table failure');
      });

      const result = await manager.enableRLSForAllTables();

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('setTenantContext()', () => {
    it('should set tenant context variable', async () => {
      await manager.setTenantContext('tenant-123');

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('SET app.current_tenant')
      );
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('tenant-123')
      );
    });

    it('should escape tenant ID in SQL', async () => {
      await manager.setTenantContext("tenant'with'quotes");

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("tenant''with''quotes")
      );
    });

    it('should use SET LOCAL by default', async () => {
      await manager.setTenantContext('tenant-123');

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('SET LOCAL')
      );
    });

    it('should use regular SET when useLocal is false', async () => {
      await manager.setTenantContext('tenant-123', false);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringMatching(/^SET app\.current_tenant/)
      );
      expect(mockDb.execute).not.toHaveBeenCalledWith(
        expect.stringContaining('SET LOCAL')
      );
    });
  });

  describe('resetTenantContext()', () => {
    it('should reset tenant context variable', async () => {
      await manager.resetTenantContext();

      expect(mockDb.execute).toHaveBeenCalledWith('RESET app.current_tenant');
    });
  });

  describe('Configuration Options', () => {
    it('should use custom schema name', async () => {
      const customManager = new RLSManager(mockDb as any, { schema: 'custom_schema' });
      await customManager.enableRLSForAllTables();

      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining("table_schema = 'custom_schema'")
      );
    });

    it('should use custom tenant column name', async () => {
      const customManager = new RLSManager(mockDb as any, { tenantColumn: 'org_id' });
      await customManager.enableRLSForAllTables();

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('ADD COLUMN org_id')
      );
    });

    it('should not add column when addColumnIfMissing is false', async () => {
      const customManager = new RLSManager(mockDb as any, { addColumnIfMissing: false });
      const result = await customManager.enableRLSForAllTables();

      expect(result.columnsAdded).toHaveLength(0);
    });

    it('should exclude specified tables', async () => {
      const customManager = new RLSManager(mockDb as any, {
        excludeTables: ['products'],
      });
      const result = await customManager.enableRLSForAllTables();

      expect(result.tables).not.toContain('products');
      expect(result.tables).toContain('users');
      expect(result.tables).toContain('orders');
    });

    it('should only include specified tables', async () => {
      const customManager = new RLSManager(mockDb as any, {
        includeTables: ['users', 'orders'],
      });
      const result = await customManager.enableRLSForAllTables();

      expect(result.tables).toEqual(['users', 'orders']);
      expect(result.tables).not.toContain('products');
    });

    it('should prioritize includeTables over excludeTables', async () => {
      const customManager = new RLSManager(mockDb as any, {
        includeTables: ['users'],
        excludeTables: ['users'],
      });
      const result = await customManager.enableRLSForAllTables();

      // include should win
      expect(result.tables).toContain('users');
    });
  });

  describe('SQL Escaping', () => {
    it('should escape identifiers with quotes', async () => {
      const customManager = new RLSManager(mockDb as any, { schema: 'public' });
      await customManager.enableRLSForAllTables();

      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining("table_schema = 'public'")
      );
    });

    it('should escape table names in queries', async () => {
      const customManager = new RLSManager(mockDb as any, { schema: 'test' });
      await customManager.enableRLSForAllTables();

      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining("table_schema = 'test'")
      );
    });

    it('should escape literal values', async () => {
      await manager.setTenantContext("tenant'O'Reilly");

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("tenant''O''Reilly")
      );
    });
  });

  describe('Database Interface Compatibility', () => {
    it('should work with databases that have execute method', async () => {
      const dbWithExecute = {
        execute: jest.fn(),
      };

      const manager = new RLSManager(dbWithExecute as any);
      await manager.setTenantContext('tenant-1');

      expect(dbWithExecute.execute).toHaveBeenCalled();
    });

    it('should work with databases that have run method', async () => {
      const dbWithRun = {
        run: jest.fn(),
      };

      const manager = new RLSManager(dbWithRun as any);
      await manager.setTenantContext('tenant-1');

      expect(dbWithRun.run).toHaveBeenCalled();
    });

    it('should throw error for databases without execute or run', async () => {
      const invalidDb = {};

      const manager = new RLSManager(invalidDb as any);

      await expect(manager.setTenantContext('tenant-1')).rejects.toThrow(
        'Database does not support direct SQL execution'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle individual table errors gracefully', async () => {
      let callCount = 0;
      mockDb.execute.mockImplementation(async () => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Table error');
        }
      });

      const result = await manager.enableRLSForAllTables();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.tables.length).toBeGreaterThan(0);
    });

    it('should include error details in result', async () => {
      mockDb.execute.mockImplementation(() => {
        throw new Error('Specific error message');
      });

      const result = await manager.enableRLSForAllTables();

      result.errors.forEach((error) => {
        expect(error.table).toBeDefined();
        expect(error.error).toBeDefined();
      });
    });
  });

  describe('createRLSManager()', () => {
    it('should create RLS manager instance', () => {
      const manager = createRLSManager(mockDb as any);

      expect(manager).toBeInstanceOf(RLSManager);
    });

    it('should pass configuration to manager', () => {
      const config: RLSPolicyConfig = {
        schema: 'custom',
        tenantColumn: 'org_id',
        excludeTables: ['migrations'],
      };

      const manager = createRLSManager(mockDb as any, config);

      expect(manager).toBeInstanceOf(RLSManager);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty schema', async () => {
      mockDb.executeQuery.mockResolvedValueOnce([]);

      const result = await manager.enableRLSForAllTables();

      expect(result.tables).toHaveLength(0);
    });

    it('should handle tables with special characters in names', async () => {
      mockDb.executeQuery.mockResolvedValueOnce([
        { table_name: 'table-with-dashes' },
        { table_name: 'table_with_underscores' },
      ]);

      const result = await manager.enableRLSForAllTables();

      expect(result.tables).toContain('table-with-dashes');
      expect(result.tables).toContain('table_with_underscores');
    });

    it('should handle very long tenant IDs', async () => {
      const longTenantId = 'a'.repeat(1000);

      await manager.setTenantContext(longTenantId);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining(longTenantId)
      );
    });

    it('should handle Unicode in tenant ID', async () => {
      const unicodeTenantId = 'tenant-中文-🎉';

      await manager.setTenantContext(unicodeTenantId);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('tenant-中文-🎉')
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete full RLS setup workflow', async () => {
      // Enable RLS
      const enableResult = await manager.enableRLSForAllTables();
      expect(enableResult.tables.length).toBeGreaterThan(0);

      // Set tenant context
      await manager.setTenantContext('tenant-123');
      expect(mockDb.execute).toHaveBeenCalled();

      // Reset context
      await manager.resetTenantContext();
      expect(mockDb.execute).toHaveBeenCalledWith('RESET app.current_tenant');
    });

    it('should support switching between tenants', async () => {
      await manager.setTenantContext('tenant-1');
      await manager.setTenantContext('tenant-2');
      await manager.setTenantContext('tenant-3');

      expect(mockDb.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent RLS operations', async () => {
      const operations = [
        manager.enableRLSForAllTables(),
        manager.setTenantContext('tenant-1'),
        manager.resetTenantContext(),
      ];

      await Promise.all(operations);

      expect(mockDb.execute).toHaveBeenCalled();
    });
  });
});
