// src/persist/offline-storage/index.ts
var MemoryCache = class {
  cache = /* @__PURE__ */ new Map();
  // Returns the value or undefined if not found
  get(key) {
    return this.cache.get(key)?.value;
  }
  // Get full entry with metadata
  getEntry(key) {
    return this.cache.get(key);
  }
  // Check if key exists (including falsy values like "", "0", "false")
  has(key) {
    return this.cache.has(key);
  }
  set(key, entry) {
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
var OfflineStorage = class {
  memoryCache = new MemoryCache();
  pendingSyncs = /* @__PURE__ */ new Map();
  sqlite;
  debug;
  localStorageFallbackDelay;
  pendingWrites = /* @__PURE__ */ new Set();
  constructor(config) {
    this.sqlite = config.sqlite;
    this.debug = config.debug ?? false;
    this.localStorageFallbackDelay = config.localStorageFallbackDelay ?? 10;
  }
  log(...args) {
    if (this.debug) {
      console.log("[OfflineStorage]", ...args);
    }
  }
  /**
   * Read a value from storage with SQLite-first hierarchy
   *
   * Storage hierarchy (Decision A: localStorage never beats SQLite):
   * 1. In-memory cache (fastest)
   * 2. SQLite (source of truth - given head start)
   * 3. localStorage (fallback only if SQLite is slow/unavailable)
   * 4. API (optional, with version check)
   */
  async getItem(key, options) {
    const startTime = performance.now();
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.getEntry(key);
      return {
        data: this.parseJson(entry.value),
        source: "memory",
        latency: performance.now() - startTime,
        version: entry.version,
        updatedAt: entry.updatedAt
      };
    }
    const localResult = await this.readLocalWithPrecedence(key);
    if (localResult.value) {
      this.memoryCache.set(key, {
        value: localResult.value,
        version: localResult.version,
        updatedAt: localResult.updatedAt
      });
    }
    if (options?.raceWithApi && options.apiFetch) {
      const apiResult = await this.raceApiRead(key, options.apiFetch, {
        value: localResult.value,
        version: localResult.version,
        updatedAt: localResult.updatedAt
      });
      if (apiResult !== null) {
        const transformed = options.transform ? options.transform(apiResult.value) : apiResult.value;
        const serialized = JSON.stringify(transformed);
        if (!localResult.updatedAt || apiResult.updatedAt > localResult.updatedAt) {
          this.memoryCache.set(key, {
            value: serialized,
            version: apiResult.version,
            updatedAt: apiResult.updatedAt
          });
          this.writeToLocalStorage(key, serialized);
          this.writeToSQLite(key, serialized, apiResult.version, apiResult.updatedAt);
          return {
            data: transformed,
            source: "api",
            latency: performance.now() - startTime,
            version: apiResult.version,
            updatedAt: apiResult.updatedAt
          };
        } else {
          this.log("API data is stale, ignoring:", {
            key,
            apiUpdatedAt: apiResult.updatedAt,
            localUpdatedAt: localResult.updatedAt
          });
        }
      }
    }
    if (localResult.value) {
      return {
        data: this.parseJson(localResult.value),
        source: localResult.source,
        latency: performance.now() - startTime,
        version: localResult.version,
        updatedAt: localResult.updatedAt
      };
    }
    return {
      data: null,
      source: "memory",
      latency: performance.now() - startTime,
      version: null,
      updatedAt: null
    };
  }
  /**
   * SQLite-first read with localStorage as fallback
   *
   * Decision A: localStorage should NEVER beat SQLite
   * - SQLite gets a head start delay
   * - localStorage only wins if SQLite is slow/failed
   */
  async readLocalWithPrecedence(key) {
    try {
      const result = await Promise.any([
        // SQLite read (async, gets head start)
        this.readFromSQLite(key).then((v) => {
          if (v) {
            const stored = this.parseStoredValue(v);
            return { value: stored.value, source: "sqlite", version: stored.version, updatedAt: stored.updatedAt };
          }
          throw new Error("No value in SQLite");
        }),
        // localStorage read (delayed fallback - Fix Issue 1)
        new Promise((resolve, reject) => {
          setTimeout(() => {
            const v = this.readFromLocalStorage(key);
            if (v) {
              const stored = this.parseStoredValue(v);
              resolve({ value: stored.value, source: "local", version: stored.version, updatedAt: stored.updatedAt });
            } else {
              reject(new Error("No value in localStorage"));
            }
          }, this.localStorageFallbackDelay);
        })
      ]);
      return result;
    } catch {
      return { value: null, source: "memory", version: 0, updatedAt: 0 };
    }
  }
  /**
   * Proper API race with freshness check (Fix Issue 2)
   * Returns API result only if it's fresher than local, otherwise null
   */
  async raceApiRead(key, apiFetch, localValue) {
    const API_BUDGET_MS = 100;
    try {
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(null), API_BUDGET_MS);
      });
      const apiResult = await Promise.race([
        apiFetch(key),
        timeoutPromise
      ]);
      if (!apiResult) {
        return null;
      }
      if (localValue.updatedAt > 0 && apiResult.updatedAt <= localValue.updatedAt) {
        this.log("API data is stale, ignoring:", {
          key,
          apiUpdatedAt: apiResult.updatedAt,
          localUpdatedAt: localValue.updatedAt,
          apiVersion: apiResult.version,
          localVersion: localValue.version
        });
        return null;
      }
      return apiResult;
    } catch (error) {
      this.log("API fetch failed, using local:", error);
      return null;
    }
  }
  /**
   * Write a value to storage with multi-source strategy
   *
   * Strategy (SQLite as source of truth):
   * 1. Update in-memory cache immediately (sync, for UI)
   * 2. Write to SQLite OPFS immediately (async, persistent - source of truth)
   * 3. Write to localStorage for fast cold start only (sync, boot hint)
   * 4. Sync to API via Intent system (async, background)
   */
  async setItem(key, value, options) {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    const now = Date.now();
    const currentEntry = this.memoryCache.getEntry(key);
    const newVersion = (currentEntry?.version ?? 0) + 1;
    this.memoryCache.set(key, {
      value: serialized,
      version: newVersion,
      updatedAt: now
    });
    const sqliteWrite = this.writeToSQLite(key, serialized, newVersion, now);
    this.pendingWrites.add(sqliteWrite);
    sqliteWrite.finally(() => {
      this.pendingWrites.delete(sqliteWrite);
    });
    if (!options?.skipLocal) {
      this.writeToLocalStorage(key, serialized);
    }
    sqliteWrite.catch((err) => {
      console.warn("[OfflineStorage] SQLite write failed (data may be lost on refresh):", err);
    });
    if (!options?.skipApi && options?.apiSync) {
      this.syncToApi(key, serialized, newVersion, options.apiSync);
    }
  }
  /**
   * Remove a value from all storage sources
   */
  async removeItem(key, options) {
    this.memoryCache.delete(key);
    if (!options?.skipLocal) {
      try {
        localStorage.removeItem(key);
      } catch {
      }
    }
    const sqliteDelete = this.sqlite.removeItem(key);
    this.pendingWrites.add(sqliteDelete);
    sqliteDelete.finally(() => {
      this.pendingWrites.delete(sqliteDelete);
    });
    sqliteDelete.catch((error) => {
      console.warn("[OfflineStorage] Failed to remove from SQLite:", error);
    });
    if (!options?.skipApi && options?.apiSync) {
      this.syncToApi(key, "", 0, options.apiSync);
    }
  }
  /**
   * Get all keys from storage
   */
  async getAllKeys() {
    try {
      if (this.sqlite.getAllKeys) {
        const sqliteKeys = await this.sqlite.getAllKeys();
        if (sqliteKeys.length > 0) {
          return sqliteKeys;
        }
      }
    } catch {
    }
    try {
      const localKeys = Object.keys(localStorage);
      return localKeys;
    } catch {
      return [];
    }
  }
  /**
   * Clear all storage
   */
  async clear() {
    this.memoryCache.clear();
    try {
      localStorage.clear();
    } catch {
    }
    try {
      if (this.sqlite.clear) {
        await this.sqlite.clear();
      }
    } catch (error) {
      console.warn("[OfflineStorage] Failed to clear SQLite:", error);
    }
  }
  /**
   * Check if storage is ready
   */
  isReady() {
    return true;
  }
  /**
   * Initialize storage
   */
  async init() {
  }
  /**
   * Flush pending writes to ensure durability
   *
   * Use this before:
   * - Logout
   * - Export
   * - App close
   * - Tests
   *
   * (Fix Issue 4 - durability signal)
   */
  async flush() {
    await Promise.all(Array.from(this.pendingWrites));
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  async readFromSQLite(key) {
    try {
      return await this.sqlite.getItem(key);
    } catch {
      return null;
    }
  }
  readFromLocalStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  writeToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("[OfflineStorage] Failed to write to localStorage:", error);
    }
  }
  async writeToSQLite(key, value, version, updatedAt) {
    try {
      const storedValue = {
        value,
        version,
        updatedAt,
        source: "sqlite"
      };
      await this.sqlite.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn("[OfflineStorage] Failed to write to SQLite:", error);
      throw error;
    }
  }
  /**
   * Sync to API with latest value tracking (Fix Issue 3)
   *
   * If multiple updates happen while a sync is in flight,
   * we track the latest value and sync it after the current one finishes.
   */
  syncToApi(key, value, version, apiSync) {
    const existingSync = this.pendingSyncs.get(key);
    if (existingSync) {
      this.log("[OfflineStorage] Sync in progress, queuing latest value:", key);
      existingSync.latestValue = value;
      existingSync.latestVersion = version;
      return;
    }
    const syncPromise = (async () => {
      try {
        await apiSync(key, value, version);
        const pending = this.pendingSyncs.get(key);
        if (pending && pending.latestVersion > version) {
          this.log("[OfflineStorage] Newer value detected, re-syncing:", key);
          await apiSync(key, pending.latestValue, pending.latestVersion);
          pending.latestValue = "";
          pending.latestVersion = 0;
        }
      } catch (error) {
        console.warn("[OfflineStorage] API sync failed for key:", key, error);
      } finally {
        const pending = this.pendingSyncs.get(key);
        if (pending && pending.latestVersion === 0) {
          this.pendingSyncs.delete(key);
        }
      }
    })();
    this.pendingSyncs.set(key, {
      inFlight: syncPromise,
      latestValue: "",
      latestVersion: 0
    });
  }
  parseJson(value) {
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  /**
   * Parse a StoredValue from storage
   * Handles legacy values (plain strings) for backward compatibility
   */
  parseStoredValue(raw) {
    if (!raw) {
      return { value: "", version: 0, updatedAt: 0, source: "local" };
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
      updatedAt: Date.now(),
      source: "local"
    };
  }
};
var offlineStorageInstance = null;
function getOfflineStorage(config) {
  if (!offlineStorageInstance) {
    offlineStorageInstance = new OfflineStorage(config);
  }
  return offlineStorageInstance;
}
async function getItem(config, key, options) {
  const storage = getOfflineStorage(config);
  const result = await storage.getItem(key, options);
  return result.data;
}
async function setItem(config, key, value, options) {
  const storage = getOfflineStorage(config);
  return storage.setItem(key, value, options);
}
async function removeItem(config, key, options) {
  const storage = getOfflineStorage(config);
  return storage.removeItem(key, options);
}
async function getAllKeys(config) {
  const storage = getOfflineStorage(config);
  return storage.getAllKeys();
}
async function clearStorage(config) {
  const storage = getOfflineStorage(config);
  return storage.clear();
}
async function initStorage(config) {
  const storage = getOfflineStorage(config);
  return storage.init();
}
async function flushStorage(config) {
  const storage = getOfflineStorage(config);
  return storage.flush();
}

export { clearStorage, flushStorage, getAllKeys, getItem, getOfflineStorage, initStorage, removeItem, setItem };
//# sourceMappingURL=chunk-UUGOQKYV.js.map
//# sourceMappingURL=chunk-UUGOQKYV.js.map