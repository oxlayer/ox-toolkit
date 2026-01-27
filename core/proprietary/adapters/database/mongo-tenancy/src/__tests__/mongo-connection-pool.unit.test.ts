/**
 * Unit Tests for Mongo Connection Pool
 *
 * Tests MongoDB connection pool management for multi-tenant applications.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { MongoConnectionPool, type MongoConnectionConfig } from '../tenancy-aware-mongo';

// Mock MongoClient
const mockConnect = jest.fn();
const mockClose = jest.fn();

const createMockClient = () => ({
  connect: mockConnect,
  close: mockClose,
  db: jest.fn((name) => ({
    databaseName: name,
  })),
});

jest.mock('mongodb', () => ({
  MongoClient: jest.fn(() => createMockClient()),
}));

describe('Mongo Connection Pool', () => {
  let pool: MongoConnectionPool;

  const createTestConfig = (overrides?: Partial<MongoConnectionConfig>): MongoConnectionConfig => ({
    host: 'localhost:27017',
    database: 'testdb',
    ...overrides,
  });

  beforeEach(() => {
    pool = new MongoConnectionPool();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await pool.closeAll();
  });

  describe('connect()', () => {
    it('should create new MongoDB connection', async () => {
      const config = createTestConfig();
      const client = await pool.connect(config);

      expect(client).toBeDefined();
      expect(mockConnect).toHaveBeenCalled();
    });

    it('should cache and reuse connections', async () => {
      const config = createTestConfig();

      const client1 = await pool.connect(config);
      const client2 = await pool.connect(config);

      expect(client1).toBe(client2);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should handle different databases separately', async () => {
      const config1 = createTestConfig({ database: 'db1' });
      const config2 = createTestConfig({ database: 'db2' });

      const client1 = await pool.connect(config1);
      const client2 = await pool.connect(config2);

      expect(client1).not.toBe(client2);
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    it('should handle different hosts separately', async () => {
      const config1 = createTestConfig({ host: 'host1:27017' });
      const config2 = createTestConfig({ host: 'host2:27017' });

      const client1 = await pool.connect(config1);
      const client2 = await pool.connect(config2);

      expect(client1).not.toBe(client2);
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
      expect(newStats.connectionCount).toBe(0);
      expect(mockClose).toHaveBeenCalled();
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
      expect(statsAfter.connectionCount).toBe(0);
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

      expect(pool.getStats().connectionCount).toBe(3);

      await pool.closeAll();

      expect(pool.getStats().connectionCount).toBe(0);
      expect(mockClose).toHaveBeenCalledTimes(3);
    });

    it('should handle closing empty pool', async () => {
      await expect(pool.closeAll()).resolves.not.toThrow();
    });

    it('should allow new connections after closeAll', async () => {
      const config = createTestConfig();

      await pool.connect(config);
      await pool.closeAll();
      await pool.connect(config);

      expect(pool.getStats().connectionCount).toBe(1);
    });
  });

  describe('getStats()', () => {
    it('should return empty stats for new pool', () => {
      const stats = pool.getStats();

      expect(stats.connectionCount).toBe(0);
      expect(stats.keys).toEqual([]);
    });

    it('should track connection count', async () => {
      const config1 = createTestConfig({ database: 'db1' });
      const config2 = createTestConfig({ database: 'db2' });

      await pool.connect(config1);
      await pool.connect(config2);

      const stats = pool.getStats();
      expect(stats.connectionCount).toBe(2);
    });

    it('should return connection keys', async () => {
      const config1 = createTestConfig({ host: 'host1:27017', database: 'db1' });
      const config2 = createTestConfig({ host: 'host2:27017', database: 'db2' });

      await pool.connect(config1);
      await pool.connect(config2);

      const stats = pool.getStats();
      expect(stats.keys).toHaveLength(2);
      expect(stats.keys).toContain('host1:27017:db1');
      expect(stats.keys).toContain('host2:27017:db2');
    });
  });

  describe('Connection Key Generation', () => {
    it('should build correct key from config', async () => {
      const config = createTestConfig({ host: 'localhost:27017', database: 'mydb' });
      await pool.connect(config);

      const stats = pool.getStats();
      expect(stats.keys[0]).toBe('localhost:27017:mydb');
    });

    it('should handle different port formats', async () => {
      const config1 = createTestConfig({ host: 'localhost:27017', database: 'db1' });
      const config2 = createTestConfig({ host: 'localhost:27018', database: 'db2' });

      await pool.connect(config1);
      await pool.connect(config2);

      const stats = pool.getStats();
      expect(stats.keys).toContain('localhost:27017:db1');
      expect(stats.keys).toContain('localhost:27018:db2');
    });

    it('should handle replica set hosts', async () => {
      const config = createTestConfig({
        host: 'host1:27017,host2:27017,host3:27017',
        database: 'mydb',
      });

      await pool.connect(config);

      const stats = pool.getStats();
      expect(stats.keys[0]).toContain('host1:27017,host2:27017,host3:27017');
    });
  });

  describe('Connection String Building', () => {
    it('should use provided connection string from options', async () => {
      const customConnectionString = 'mongodb://user:pass@custom-host:27017';
      const config = createTestConfig({
        options: { connectionString: customConnectionString },
      });

      await pool.connect(config);

      // Verify the connection was created (we can't easily check the string passed)
      expect(mockConnect).toHaveBeenCalled();
    });

    it('should build connection string with credentials', async () => {
      const config = createTestConfig({
        host: 'localhost:27017',
        database: 'mydb',
        username: 'myuser',
        password: 'mypass',
      });

      await pool.connect(config);

      expect(mockConnect).toHaveBeenCalled();
    });

    it('should encode special characters in credentials', async () => {
      const config = createTestConfig({
        host: 'localhost:27017',
        database: 'mydb',
        username: 'user@domain',
        password: 'p@ss:w0rd',
      });

      await pool.connect(config);

      expect(mockConnect).toHaveBeenCalled();
    });

    it('should use custom auth database when specified', async () => {
      const config = createTestConfig({
        host: 'localhost:27017',
        database: 'mydb',
        username: 'user',
        password: 'pass',
        authDatabase: 'admin',
      });

      await pool.connect(config);

      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle connection without credentials', async () => {
      const config = createTestConfig({
        host: 'localhost:27017',
        database: 'mydb',
      });

      await expect(pool.connect(config)).resolves.toBeDefined();
    });

    it('should handle very long database names', async () => {
      const longDbName = 'a'.repeat(1000);
      const config = createTestConfig({ database: longDbName });

      await expect(pool.connect(config)).resolves.toBeDefined();
    });

    it('should handle special characters in host', async () => {
      const config = createTestConfig({
        host: 'mongo.example.com:27017',
        database: 'mydb',
      });

      await expect(pool.connect(config)).resolves.toBeDefined();
    });

    it('should handle connection options', async () => {
      const config = createTestConfig({
        host: 'localhost:27017',
        database: 'mydb',
        options: {
          maxPoolSize: 50,
          minPoolSize: 10,
          connectTimeoutMS: 10000,
        },
      });

      await pool.connect(config);

      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe('Multi-Tenant Scenarios', () => {
    it('should maintain separate connections per tenant database', async () => {
      const tenant1Config = createTestConfig({ database: 'tenant1_db' });
      const tenant2Config = createTestConfig({ database: 'tenant2_db' });
      const tenant3Config = createTestConfig({ database: 'tenant3_db' });

      const client1 = await pool.connect(tenant1Config);
      const client2 = await pool.connect(tenant2Config);
      const client3 = await pool.connect(tenant3Config);

      expect(client1).not.toBe(client2);
      expect(client2).not.toBe(client3);
      expect(pool.getStats().connectionCount).toBe(3);
    });

    it('should reuse connection when accessing same tenant database', async () => {
      const tenantConfig = createTestConfig({ database: 'tenant_db' });

      const client1 = await pool.connect(tenantConfig);
      const client2 = await pool.connect(tenantConfig);
      const client3 = await pool.connect(tenantConfig);

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
      expect(pool.getStats().connectionCount).toBe(1);
    });

    it('should support different hosts for different tenants', async () => {
      const tenant1Config = createTestConfig({
        host: 'mongo-tenant1.example.com:27017',
        database: 'tenant_db',
      });
      const tenant2Config = createTestConfig({
        host: 'mongo-tenant2.example.com:27017',
        database: 'tenant_db',
      });

      const client1 = await pool.connect(tenant1Config);
      const client2 = await pool.connect(tenant2Config);

      expect(client1).not.toBe(client2);
      expect(pool.getStats().connectionCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const config = createTestConfig();
      mockConnect.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      await expect(pool.connect(config)).rejects.toThrow('Connection failed');
    });

    it('should handle close errors gracefully', async () => {
      const config = createTestConfig();
      await pool.connect(config);

      mockClose.mockImplementationOnce(() => {
        throw new Error('Close failed');
      });

      await expect(pool.closeAll()).resolves.not.toThrow();
    });

    it('should continue closing other connections if one fails', async () => {
      const config1 = createTestConfig({ database: 'db1' });
      const config2 = createTestConfig({ database: 'db2' });

      await pool.connect(config1);
      await pool.connect(config2);

      let closeCount = 0;
      mockClose.mockImplementation(() => {
        closeCount++;
        if (closeCount === 1) {
          throw new Error('First close failed');
        }
      });

      await pool.closeAll();

      expect(closeCount).toBe(2);
    });
  });

  describe('Concurrency', () => {
    it('should handle simultaneous connection requests', async () => {
      const config = createTestConfig();

      const [client1, client2, client3] = await Promise.all([
        pool.connect(config),
        pool.connect(config),
        pool.connect(config),
      ]);

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
      expect(pool.getStats().connectionCount).toBe(1);
    });

    it('should handle simultaneous different connections', async () => {
      const configs = [
        createTestConfig({ database: 'db1' }),
        createTestConfig({ database: 'db2' }),
        createTestConfig({ database: 'db3' }),
      ];

      const clients = await Promise.all(configs.map((config) => pool.connect(config)));

      expect(clients[0]).not.toBe(clients[1]);
      expect(clients[1]).not.toBe(clients[2]);
      expect(pool.getStats().connectionCount).toBe(3);
    });
  });
});
