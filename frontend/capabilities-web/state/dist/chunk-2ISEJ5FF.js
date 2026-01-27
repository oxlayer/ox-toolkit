// src/persist/sqlite-wasm/shared-adapter.ts
var sharedWorker = null;
var workerPort = null;
var tabWorker = null;
var clientId = null;
var isReady = false;
var pendingQueries = /* @__PURE__ */ new Map();
var queryId = 0;
async function initSharedWorker() {
  if (sharedWorker) {
    return;
  }
  try {
    const coordinatorUrl = new URL(
      "./workers/sqlite-coordinator.shared.js",
      import.meta.url
    );
    sharedWorker = new SharedWorker(coordinatorUrl, {
      type: "module",
      name: "oxlayer-sqlite-coordinator"
    });
    workerPort = sharedWorker.port;
    workerPort.start();
    workerPort.onmessage = handleCoordinatorMessage;
    console.log("[SharedSQLite] SharedWorker connected");
  } catch (error) {
    console.error("[SharedSQLite] Failed to create SharedWorker:", error);
    throw new Error(
      "SharedWorker not supported. Consider using sqliteStorage instead for single-tab usage."
    );
  }
}
async function initTabWorker() {
  if (tabWorker) {
    return;
  }
  try {
    const workerUrl = new URL("./workers/sqlite-worker.js", import.meta.url);
    tabWorker = new Worker(workerUrl, { type: "module" });
    const channel = new MessageChannel();
    tabWorker.postMessage({}, [channel.port2]);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Worker init timeout")), 5e3);
      channel.port1.onmessage = (e) => {
        if (e.data.type === "ready") {
          clearTimeout(timeout);
          resolve();
        }
      };
      tabWorker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
    console.log("[SharedSQLite] Tab worker ready");
  } catch (error) {
    console.error("[SharedSQLite] Failed to create tab worker:", error);
    throw error;
  }
}
function handleCoordinatorMessage(e) {
  const msg = e.data;
  switch (msg.type) {
    case "set-active":
      console.log("[SharedSQLite] Tab is now active:", msg.active);
      break;
    case "sqlite-result":
      const query = pendingQueries.get(queryId);
      if (query) {
        pendingQueries.delete(queryId);
        if (msg.error) {
          query.reject(new Error(msg.error));
        } else {
          query.resolve(msg.result);
        }
      }
      break;
  }
}
async function sendQuery(method, key, value) {
  if (!workerPort) {
    throw new Error("SharedWorker not connected. Call init() first.");
  }
  const id = ++queryId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingQueries.delete(id);
      reject(new Error("Query timeout"));
    }, 1e4);
    pendingQueries.set(id, {
      resolve: (value2) => {
        clearTimeout(timeout);
        resolve(value2);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    });
    workerPort.postMessage({
      type: "sqlite-query",
      query: { method, key, value }
    });
  });
}
var sharedSqliteStorage = {
  /**
   * Initialize SharedWorker and tab worker
   */
  async init() {
    if (isReady) {
      return;
    }
    try {
      await initSharedWorker();
      await initTabWorker();
      clientId = crypto.randomUUID();
      workerPort.postMessage({
        type: "register",
        clientId
      });
      await sendQuery("init");
      isReady = true;
      console.log("[SharedSQLite] Ready");
    } catch (error) {
      console.error("[SharedSQLite] Init failed:", error);
      throw error;
    }
  },
  /**
   * Get a value from storage
   */
  async getItem(key) {
    const result = await sendQuery("getItem", key);
    return result;
  },
  /**
   * Set a value in storage
   */
  async setItem(key, value) {
    await sendQuery("setItem", key, value);
  },
  /**
   * Remove a value from storage
   */
  async removeItem(key) {
    await sendQuery("removeItem", key);
  },
  /**
   * Get all keys from storage
   */
  async getAllKeys() {
    const result = await sendQuery("getAllKeys");
    return result || [];
  },
  /**
   * Clear all storage
   */
  async clear() {
    await sendQuery("clear");
  },
  /**
   * Check if storage is ready
   */
  isReady() {
    return isReady;
  }
};
function isSharedWorkerSupported() {
  try {
    return typeof SharedWorker !== "undefined";
  } catch {
    return false;
  }
}
async function getAutoSqliteStorage() {
  if (isSharedWorkerSupported()) {
    return sharedSqliteStorage;
  }
  const { sqliteStorage } = await import('./persist/sqlite-wasm/index.js');
  return sqliteStorage;
}

export { getAutoSqliteStorage, isSharedWorkerSupported, sharedSqliteStorage };
//# sourceMappingURL=chunk-2ISEJ5FF.js.map
//# sourceMappingURL=chunk-2ISEJ5FF.js.map