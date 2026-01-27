// src/persist/pure-storage.ts
var MemoryCache = class {
  cache = /* @__PURE__ */ new Map();
  sizeLimit;
  constructor(sizeLimit = 1e3) {
    this.sizeLimit = sizeLimit;
  }
  get(key) {
    return this.cache.get(key);
  }
  has(key) {
    return this.cache.has(key);
  }
  set(key, entry) {
    if (this.sizeLimit > 0 && this.cache.size >= this.sizeLimit) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, entry);
  }
  delete(key) {
    this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
  get size() {
    return this.cache.size;
  }
};
var PureStorage = class {
  memoryCache;
  sqlite;
  debug;
  pendingWrites = /* @__PURE__ */ new Set();
  constructor(config) {
    this.sqlite = config.sqlite;
    this.debug = config.debug ?? false;
    this.memoryCache = new MemoryCache(config.cacheSizeLimit ?? 1e3);
  }
  log(...args) {
    if (this.debug) {
      console.log("[PureStorage]", ...args);
    }
  }
  /**
   * Get a value from storage with metadata
   *
   * Strategy:
   * 1. Check memory cache (fastest)
   * 2. Check SQLite (persistent)
   *
   * Returns StoredResult with version/updatedAt for Intent system
   */
  async get(key) {
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      this.log("get (memory)", key, entry.version);
      return {
        data: entry.value,
        version: entry.version,
        updatedAt: entry.updatedAt,
        source: "memory"
      };
    }
    try {
      const raw = await this.sqlite.getItem(key);
      if (raw) {
        const stored = this.parseStoredValue(raw);
        this.memoryCache.set(key, {
          value: stored.value,
          version: stored.version,
          updatedAt: stored.updatedAt
        });
        this.log("get (sqlite)", key, stored.version);
        return {
          data: stored.value,
          version: stored.version,
          updatedAt: stored.updatedAt,
          source: "sqlite"
        };
      }
    } catch (error) {
      console.error("[PureStorage] SQLite read failed:", error);
    }
    this.log("get (miss)", key);
    return {
      data: null,
      version: 0,
      updatedAt: 0,
      source: "sqlite"
    };
  }
  /**
   * Set a value in storage
   *
   * Strategy:
   * 1. Update memory cache immediately (sync)
   * 2. Write to SQLite (async, fire-and-forget)
   *
   * Returns version info for Intent system to use in API sync
   */
  async set(key, value) {
    const now = Date.now();
    const currentEntry = this.memoryCache.get(key);
    const newVersion = (currentEntry?.version ?? 0) + 1;
    const storedValue = {
      value,
      version: newVersion,
      updatedAt: now
    };
    this.memoryCache.set(key, {
      value,
      version: newVersion,
      updatedAt: now
    });
    const sqliteWrite = this.writeToSQLite(key, storedValue);
    this.pendingWrites.add(sqliteWrite);
    sqliteWrite.finally(() => {
      this.pendingWrites.delete(sqliteWrite);
    });
    sqliteWrite.catch((err) => {
      console.warn("[PureStorage] SQLite write failed (data may be lost on refresh):", err);
    });
    this.log("set", key, newVersion);
    return storedValue;
  }
  /**
   * Delete a value from storage
   */
  async delete(key) {
    this.memoryCache.delete(key);
    const sqliteDelete = this.sqlite.removeItem(key);
    this.pendingWrites.add(sqliteDelete);
    sqliteDelete.finally(() => {
      this.pendingWrites.delete(sqliteDelete);
    });
    this.log("delete", key);
  }
  /**
   * Get all keys from storage
   */
  async keys() {
    try {
      if (this.sqlite.getAllKeys) {
        return await this.sqlite.getAllKeys();
      }
    } catch (error) {
      console.error("[PureStorage] Failed to get keys:", error);
    }
    return [];
  }
  /**
   * Clear all storage
   */
  async clear() {
    this.memoryCache.clear();
    try {
      if (this.sqlite.clear) {
        await this.sqlite.clear();
      }
    } catch (error) {
      console.error("[PureStorage] Failed to clear SQLite:", error);
    }
    this.log("clear");
  }
  /**
   * Flush pending writes to ensure durability
   *
   * Use before:
   * - Logout
   * - Export
   * - App close
   * - Tests
   */
  async flush() {
    await Promise.all(Array.from(this.pendingWrites));
    this.log("flush");
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  async writeToSQLite(key, storedValue) {
    try {
      await this.sqlite.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("[PureStorage] SQLite write failed:", error);
      throw error;
    }
  }
  parseStoredValue(raw) {
    if (!raw) {
      return { value: null, version: 0, updatedAt: 0 };
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "value" in parsed && "version" in parsed && "updatedAt" in parsed) {
        return parsed;
      }
    } catch {
    }
    return {
      value: raw,
      version: 1,
      updatedAt: Date.now()
    };
  }
};
var pureStorageInstance = null;
function getPureStorage(config) {
  if (!pureStorageInstance) {
    pureStorageInstance = new PureStorage(config);
  }
  return pureStorageInstance;
}
async function getStoredValue(config, key) {
  const storage = getPureStorage(config);
  return storage.get(key);
}
async function setStoredValue(config, key, value) {
  const storage = getPureStorage(config);
  return storage.set(key, value);
}
async function deleteStoredValue(config, key) {
  const storage = getPureStorage(config);
  return storage.delete(key);
}
async function getStoredKeys(config) {
  const storage = getPureStorage(config);
  return storage.keys();
}
async function clearStoredValues(config) {
  const storage = getPureStorage(config);
  return storage.clear();
}
async function flushStorage(config) {
  const storage = getPureStorage(config);
  return storage.flush();
}

export { clearStoredValues, deleteStoredValue, flushStorage, getPureStorage, getStoredKeys, getStoredValue, setStoredValue };
//# sourceMappingURL=chunk-YHUYUKZ7.js.map
//# sourceMappingURL=chunk-YHUYUKZ7.js.map