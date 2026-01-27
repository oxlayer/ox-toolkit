/**
 * Unit Tests for Database Pool
 *
 * Tests PostgreSQL connection pool management for multi-tenant applications.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DatabasePool, type DatabaseConnectionConfig, type ConnectionResult } from '../database-pool';

// Mock postgres
const mockEnd = jest.fn();
const mockPostgres = jest.fn(() => ({
  end: mockEnd,
}));

jest.mock('postgres', () => {
  return jest.fn((connectionString: string, options: any) => mockPostgres(connectionString, options));
});

// Mock drizzle
const mockDrizzle = jest.fn(() => ({}));

jest.mock('drizzle-orm/postgres-js', () => ({
  drizzle: mockDrizzle,
  default: mockDrizzle,
}));

describe('Database Pool', () => {
  let pool: DatabasePool;

  const createTestConfig = (overrides?: Partial<DatabaseConnectionConfig>): DatabaseConnectionConfig => ({
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    user: 'testuser',
    password: 'testpass',
    poolSize: 5,
    ...overrides,
  });

  beforeEach(() => {
    pool = new DatabasePool();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await pool.closeAll();
  });

  describe('connect()', () => {
    it('should create new database connection', async () => {
      const config = createTestConfig();
      const db = await pool.connect(config);

      expect(db).toBeDefined();
      expect(mockPostgres).toHaveBeenCalledWith(
        expect.stringContaining('postgresql://testuser:testpass@localhost:5432/testdb'),
        expect.objectContaining({ max: 5 })
      );
      expect(mockDrizzle).toHaveBeenCalled();
    });

    it('should cache and reuse connections', async () => {
      const config = createTestConfig();

      const db1 = await pool.connect(config);
      const db2 = await pool.connect(config);

      expect(db1).toBe(db2);
      expect(mockPostgres).toHaveBeenCalledTimes(1);
    });

    it('should handle different databases separately', async () => {
      const config1 = createTestConfig({ database: 'db1' });
      const config2 = createTestConfig({ database: 'db2' });

      const db1 = await pool.connect(config1);
      const db2 = await pool.connect(config2);

      expect(db1).not.toBe(db2);
      expect(mockPostgres).toHaveBeenCalledTimes(2);
    });

    it('should handle different hosts separately', async () => {
      const config1 = createTestConfig({ host: 'host1' });
      const config2 = createTestConfig({ host: 'host2' });

      const db1 = await pool.connect(config1);
      const db2 = await pool.connect(config2);

      expect(db1).not.toBe(db2);
    });

    it('should handle different ports separately', async () => {
      const config1 = createTestConfig({ port: 5432 });
      const config2 = createTestConfig({ port: 5433 });

      const db1 = await pool.connect(config1);
      const db2 = await pool.connect(config2);

      expect(db1).not.toBe(db2);
    });

    it('should use default pool size when not specified', async () => {
      const config = createTestConfig({ poolSize: undefined });
      await pool.connect(config);

      expect(mockPostgres).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ max: 10 })
      );
    });

    it('should set search_path when schema provided', async () => {
      const mockExecute = jest.fn();
      mockDrizzle.mockReturnValue({ execute: mockExecute });

      const config = createTestConfig({ schema: 'tenant_schema' });
      await pool.connect(config);

      expect(mockExecute).toHaveBeenCalledWith('SET search_path TO tenant_schema');
    });

    it('should handle SSL configuration', async () => {
      const config = createTestConfig({ ssl: true });
      await pool.connect(config);

      expect(mockPostgres).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ ssl: true })
      );
    });

    it('should handle SSL with rejectUnauthorized', async () => {
      const config = createTestConfig({ ssl: { rejectUnauthorized: false } });
      await pool.connect(config);

      expect(mockPostgres).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ ssl: { rejectUnauthorized: false } })
      );
    });
  });

  describe('connectWithMetadata()', () => {
    it('should return connection result with metadata', async () => {
      const config = createTestConfig();
      const result = await pool.connectWithMetadata(config);

      expect(result.db).toBeDefined();
      expect(result.key).toBeDefined();
      expect(result.cached).toBe(false);
    });

    it('should indicate cached connection', async () => {
      const config = createTestConfig();

      const result1 = await pool.connectWithMetadata(config);
      const result2 = await pool.connectWithMetadata(config);

      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(true);
      expect(result1.key).toBe(result2.key);
    });

    it('should build correct connection key', async () => {
      const config = createTestConfig({ host: 'db.example.com', port: 5433, database: 'mydb' });
      const result = await pool.connectWithMetadata(config);

      expect(result.key).toBe('db.example.com:5433:mydb');
    });
  });

  describe('close()', () => {
    it('should close specific connection', async () => {
      const config = createTestConfig();
      await pool.connect(config);

      const stats = pool.getStats();
      const key = stats.keys[0];

      await pool.close(key);

      const newStats = pool.getStats();
      expect(newStats.poolCount).toBe(0);
      expect(mockEnd).toHaveBeenCalled();
    });

    it('should handle closing non-existent connection', async () => {
      await expect(pool.close('non-existent-key')).resolves.not.toThrow();
    });

    it('should remove from pool after closing', async () => {
      const config = createTestConfig();
      await pool.connect(config);

      const statsBefore = pool.getStats();
      await pool.close(statsBefore.keys[0]);

      const statsAfter = pool.getStats();
      expect(statsAfter.poolCount).toBe(0);
    });
  });

  describe('closeAll()', () => {
    it('should close all connections', async () => {
      const config1 = createTestConfig({ database: 'db1' });
      const config2 = createTestConfig({ database: 'db2' });
      const config3 = createTestConfig({ database: 'db3' });

      await pool.connect(config1);
      await pool.connect(config2);
      await pool.connect(config3);

      expect(pool.getStats().poolCount).toBe(3);

      await pool.closeAll();

      expect(pool.getStats().poolCount).toBe(0);
      expect(mockEnd).toHaveBeenCalledTimes(3);
    });

    it('should handle closing empty pool', async () => {
      await expect(pool.closeAll()).resolves.not.toThrow();
    });

    it('should allow new connections after closeAll', async () => {
      const config = createTestConfig();

      await pool.connect(config);
      await pool.closeAll();
      await pool.connect(config);

      expect(pool.getStats().poolCount).toBe(1);
    });
  });

  describe('getStats()', () => {
    it('should return empty stats for new pool', () => {
      const stats = pool.getStats();

      expect(stats.poolCount).toBe(0);
      expect(stats.keys).toEqual([]);
    });

    it('should track connection count', async () => {
      const config1 = createTestConfig({ database: 'db1' });
      const config2 = createTestConfig({ database: 'db2' });

      await pool.connect(config1);
      await pool.connect(config2);

      const stats = pool.getStats();
      expect(stats.poolCount).toBe(2);
    });

    it('should return connection keys', async () => {
      const config1 = createTestConfig({ database: 'db1' });
      const config2 = createTestConfig({ database: 'db2' });

      await pool.connect(config1);
      await pool.connect(config2);

      const stats = pool.getStats();
      expect(stats.keys).toHaveLength(2);
      expect(stats.keys).toContain('localhost:5432:db1');
      expect(stats.keys).toContain('localhost:5432:db2');
    });
  });

  describe('hasConnection()', () => {
    it('should return false for non-existent connection', () => {
      const config = createTestConfig();
      expect(pool.hasConnection(config)).toBe(false);
    });

    it('should return true for existing connection', async () => {
      const config = createTestConfig();
      await pool.connect(config);

      expect(pool.hasConnection(config)).toBe(true);
    });

    it('should check before creating connection', () => {
      const config = createTestConfig();
      expect(pool.hasConnection(config)).toBe(false);

      pool.connect(config); // Don't await
      expect(pool.hasConnection(config)).toBe(false); // Still false before promise resolves
    });
  });

  describe('buildConnectionKey()', () => {
    it('should build correct key', () => {
      const config = createTestConfig({ host: 'localhost', port: 5432, database: 'testdb' });
      const key = pool.buildConnectionKey(config);

      expect(key).toBe('localhost:5432:testdb');
    });

    it('should handle IPv6 addresses', () => {
      const config = createTestConfig({ host: '::1', port: 5432, database: 'testdb' });
      const key = pool.buildConnectionKey(config);

      expect(key).toBe('::1:5432:testdb');
    });

    it('should handle long hostnames', () => {
      const longHost = 'very-long-database-server-name.example.com';
      const config = createTestConfig({ host: longHost, port: 5432, database: 'testdb' });
      const key = pool.buildConnectionKey(config);

      expect(key).toBe(`${longHost}:5432:testdb`);
    });
  });

  describe('Connection String Building', () => {
    it('should build correct connection string', async () => {
      const config = createTestConfig({
        host: 'db.example.com',
        port: 5433,
        database: 'mydb',
        user: 'myuser',
        password: 'mypass',
      });

      await pool.connect(config);

      expect(mockPostgres).toHaveBeenCalledWith(
        'postgresql://myuser:mypass@db.example.com:5433/mydb',
        expect.any(Object)
      );
    });

    it('should handle special characters in password', async () => {
      const config = createTestConfig({ password: 'p@ss:w0rd/abc' });

      await pool.connect(config);

      const connectionString = mockPostgres.mock.calls[0][0];
      expect(connectionString).toContain('p%40ss%3Aw0rd%2Fabc');
    });

    it('should handle special characters in username', async () => {
      const config = createTestConfig({ user: 'user@domain' });

      await pool.connect(config);

      const connectionString = mockPostgres.mock.calls[0][0];
      expect(connectionString).toContain('user%40domain');
    });
  });

  describe('Edge Cases', () => {
    it('should handle connection with minimal config', async () => {
      const minimalConfig = createTestConfig();
      delete (minimalConfig as any).poolSize;
      delete (minimalConfig as any).schema;
      delete (minimalConfig as any).ssl;

      await expect(pool.connect(minimalConfig)).resolves.toBeDefined();
    });

    it('should handle very large pool size', async () => {
      const config = createTestConfig({ poolSize: 1000 });
      await pool.connect(config);

      expect(mockPostgres).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ max: 1000 })
      );
    });

    it('should handle connection with default port', async () => {
      const config = createTestConfig({ port: 5432 });
      await pool.connect(config);

      const key = pool.buildConnectionKey(config);
      expect(key).toContain('5432');
    });

    it('should handle multiple connections to same database', async () => {
      const config = createTestConfig();

      const db1 = await pool.connect(config);
      const db2 = await pool.connect(config);
      const db3 = await pool.connect(config);

      expect(db1).toBe(db2);
      expect(db2).toBe(db3);
      expect(pool.getStats().poolCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const config = createTestConfig();
      mockPostgres.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      await expect(pool.connect(config)).rejects.toThrow('Connection failed');
    });

    it('should handle close errors gracefully', async () => {
      const config = createTestConfig();
      await pool.connect(config);

      mockEnd.mockImplementationOnce(() => {
        throw new Error('Close failed');
      });

      await expect(pool.closeAll()).resolves.not.toThrow();
    });
  });

  describe('Multi-Tenant Scenarios', () => {
    it('should maintain separate connections per tenant database', async () => {
      const tenant1Config = createTestConfig({ database: 'tenant1_db' });
      const tenant2Config = createTestConfig({ database: 'tenant2_db' });
      const tenant3Config = createTestConfig({ database: 'tenant3_db' });

      const db1 = await pool.connect(tenant1Config);
      const db2 = await pool.connect(tenant2Config);
      const db3 = await pool.connect(tenant3Config);

      expect(db1).not.toBe(db2);
      expect(db2).not.toBe(db3);
      expect(pool.getStats().poolCount).toBe(3);
    });

    it('should reuse connection when accessing same tenant database', async () => {
      const tenantConfig = createTestConfig({ database: 'tenant_db' });

      const db1 = await pool.connect(tenantConfig);
      const db2 = await pool.connect(tenantConfig);
      const db3 = await pool.connect(tenantConfig);

      expect(db1).toBe(db2);
      expect(db2).toBe(db3);
      expect(pool.getStats().poolCount).toBe(1);
    });

    it('should support tenant-specific schemas', async () => {
      const mockExecute = jest.fn();
      mockDrizzle.mockReturnValue({ execute: mockExecute });

      const tenant1Config = createTestConfig({ database: 'shared_db', schema: 'tenant1' });
      const tenant2Config = createTestConfig({ database: 'shared_db', schema: 'tenant2' });

      await pool.connect(tenant1Config);
      await pool.connect(tenant2Config);

      expect(mockExecute).toHaveBeenCalledWith('SET search_path TO tenant1');
      expect(mockExecute).toHaveBeenCalledWith('SET search_path TO tenant2');
    });
  });
});
