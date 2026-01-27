import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

// src/persist/sqlite-wasm/index.ts
var DEFAULT_CONFIG = {
  // Use OPFS for persistent SQLite database
  // Falls back to in-memory if OPFS is not available
  filename: "file:oxlayer-db?vfs=opfs",
  debug: false
};
var initPromise = null;
var workerPromiser = null;
var databaseId = null;
var config = DEFAULT_CONFIG;
function log(...args) {
  if (config.debug) {
    console.log("[SQLiteWasm]", ...args);
  }
}
function logError(...args) {
  console.error("[SQLiteWasm]", ...args);
}
async function initSQLite(customConfig) {
  if (workerPromiser) {
    log("Already initialized, skipping");
    return;
  }
  if (initPromise) {
    log("Initialization already in progress, waiting...");
    return initPromise;
  }
  config = { ...DEFAULT_CONFIG, ...customConfig };
  log("Creating initialization promise...");
  initPromise = (async () => {
    try {
      log("Initializing SQLite WASM...");
      const promiser = await sqlite3Worker1Promiser({
        onerror: (error) => {
          logError("Worker error:", error);
        }
      });
      log("sqlite3Worker1Promiser resolved, workerPromiser type:", typeof promiser);
      if (typeof promiser !== "function") {
        throw new Error(`workerPromiser is not a function, it's a ${typeof promiser}`);
      }
      workerPromiser = promiser;
      log("Promiser stored, initializing database...");
      await initializeDatabase(workerPromiser);
      log("Database initialized successfully");
    } catch (err) {
      logError("Failed to initialize:", err);
      throw err;
    }
  })();
  return initPromise;
}
async function initializeDatabase(workerFunc) {
  log("initializeDatabase called, workerFunc type:", typeof workerFunc);
  if (typeof workerFunc !== "function") {
    logError("workerFunc is not a function!", typeof workerFunc, workerFunc);
    throw new Error(`workerFunc is not a function, it's a ${typeof workerFunc}`);
  }
  try {
    const configResponse = await workerFunc("config-get", {});
    log("config response:", configResponse);
    log("SQLite version:", configResponse.result?.version?.libVersion);
  } catch (err) {
    logError("config-get error:", err);
  }
  const dbOptions = [
    config.filename,
    // Try OPFS first
    ":memory:"
    // Fall back to in-memory
  ];
  for (const filename of dbOptions) {
    log("Trying to open database with filename:", filename);
    try {
      const openResponse = await workerFunc("open", { filename });
      log("open response:", openResponse);
      if (!openResponse.result) {
        log("open returned no result for", filename);
        continue;
      }
      databaseId = openResponse.result.dbId;
      log("Successfully opened database with dbId:", databaseId, "filename:", filename);
      break;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      log("open failed for", filename, ":", errorMessage);
    }
  }
  if (databaseId === null) {
    throw new Error("Failed to open database with any option");
  }
  await workerFunc("exec", {
    dbId: databaseId,
    sql: `
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_storage_key ON storage(key);
    `
  });
  log("Schema initialized, dbId:", databaseId);
}
async function getWorker() {
  if (!workerPromiser) {
    await initSQLite();
  }
  return workerPromiser;
}
async function getDatabaseId() {
  if (databaseId === null) {
    await initSQLite();
  }
  return databaseId;
}
var sqliteStorage = {
  /**
   * Initialize SQLite WASM
   */
  async init(customConfig) {
    return initSQLite(customConfig);
  },
  /**
   * Get a value from storage
   */
  async getItem(key) {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();
      const result = await workerFunc("exec", {
        dbId: db,
        sql: "SELECT value FROM storage WHERE key = ? LIMIT 1",
        bind: [key],
        rowMode: "object",
        returnValue: "resultRows"
      });
      if (result && result.result && Array.isArray(result.result) && result.result.length > 0) {
        const row = result.result[0];
        return row.value;
      }
      return null;
    } catch (err) {
      logError("getItem error:", err);
      return null;
    }
  },
  /**
   * Set a value in storage
   */
  async setItem(key, value) {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();
      await workerFunc("exec", {
        dbId: db,
        sql: `
          INSERT INTO storage (key, value, updated_at)
          VALUES (?, ?, strftime('%s', 'now'))
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = strftime('%s', 'now')
        `,
        bind: [key, value]
      });
      log("setItem success for key:", key);
    } catch (err) {
      logError("setItem error:", err);
      throw err;
    }
  },
  /**
   * Remove a value from storage
   */
  async removeItem(key) {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();
      await workerFunc("exec", {
        dbId: db,
        sql: "DELETE FROM storage WHERE key = ?",
        bind: [key]
      });
    } catch (err) {
      logError("removeItem error:", err);
      throw err;
    }
  },
  /**
   * Get all keys from storage
   */
  async getAllKeys() {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();
      const result = await workerFunc("exec", {
        dbId: db,
        sql: "SELECT key FROM storage ORDER BY key",
        rowMode: "object",
        returnValue: "resultRows"
      });
      if (result && result.result && Array.isArray(result.result)) {
        return result.result.map((row) => row.key);
      }
      return [];
    } catch (err) {
      logError("getAllKeys error:", err);
      return [];
    }
  },
  /**
   * Clear all storage
   */
  async clear() {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();
      await workerFunc("exec", {
        dbId: db,
        sql: "DELETE FROM storage"
      });
    } catch (err) {
      logError("clear error:", err);
      throw err;
    }
  },
  /**
   * Check if SQLite is ready
   */
  isReady() {
    return workerPromiser !== null;
  }
};
function createSqliteWasmAdapter(storage = sqliteStorage) {
  return {
    get: async (key) => {
      const value = await storage.getItem(key);
      if (!value) return void 0;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
    set: async (key, value) => {
      await storage.setItem(key, JSON.stringify(value));
    },
    delete: async (key) => {
      await storage.removeItem(key);
    }
  };
}
function createSqliteAdapter(adapter) {
  return createSqliteWasmAdapter(adapter);
}

export { createSqliteAdapter, createSqliteWasmAdapter, sqliteStorage };
//# sourceMappingURL=chunk-JRPYVFRC.js.map
//# sourceMappingURL=chunk-JRPYVFRC.js.map