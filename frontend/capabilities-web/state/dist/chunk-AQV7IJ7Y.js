import { __esm, __export } from './chunk-4CV4JOE5.js';
import { observable, batch, computed } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';

function generateIntentId() {
  return `intent_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
function getIntentLogKey(workspaceId) {
  return `${INTENT_LOG_PREFIX}${workspaceId}`;
}
function createIntentLog(workspaceId) {
  const log$ = observable(
    synced({
      initial: {
        workspaceId,
        intents: [],
        pendingCount: 0,
        failedCount: 0
      },
      persist: {
        name: getIntentLogKey(workspaceId),
        plugin: ObservablePersistLocalStorage,
        retrySync: true
      },
      // No server sync - intent log is local-only
      // Individual intents are synced separately by sync engine
      get: void 0,
      set: void 0
    })
  );
  return log$;
}
function getIntentLog(workspaceId) {
  if (!intentLogs.has(workspaceId)) {
    intentLogs.set(workspaceId, createIntentLog(workspaceId));
  }
  return intentLogs.get(workspaceId);
}
function recordIntent(workspaceId, intent) {
  console.log("[recordIntent] Called", { workspaceId, intent });
  const log = getIntentLog(workspaceId);
  const current = log.get();
  const entry = {
    ...intent,
    id: generateIntentId(),
    workspaceId,
    createdAt: Date.now(),
    status: "local",
    retries: 0
  };
  console.log("[recordIntent] Creating entry", { entry, currentIntentsCount: current.intents.length });
  log.set({
    ...current,
    intents: [...current.intents, entry],
    pendingCount: current.pendingCount + 1
  });
  console.log("[recordIntent] Intent logged", { newPendingCount: current.pendingCount + 1, totalIntents: current.intents.length + 1 });
  return entry;
}
function recordIntentSimple(workspaceId, domain, type, entityType, payload, entityId, policy) {
  return recordIntent(workspaceId, {
    domain,
    type,
    entityType,
    entityId: entityId || `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    payload,
    policy
  });
}
function updateIntentStatus(workspaceId, intentId, status, result) {
  const log = getIntentLog(workspaceId);
  const current = log.get();
  const index = current.intents.findIndex((i) => i.id === intentId);
  if (index === -1) return;
  const updated = {
    ...current.intents[index],
    status,
    ...result,
    confirmedAt: result?.confirmedAt || (status === "confirmed" ? Date.now() : void 0),
    retryAt: result?.retryAt,
    retries: result?.retries ?? current.intents[index].retries
  };
  const pendingCount = current.intents.filter(
    (i) => i.id !== intentId ? i.status === "local" || i.status === "queued" || i.status === "sending" : status === "local" || status === "queued" || status === "sending"
  ).length;
  const failedCount = current.intents.filter(
    (i) => i.id !== intentId ? i.status === "failed" : status === "failed"
  ).length;
  log.set({
    ...current,
    intents: [
      ...current.intents.slice(0, index),
      updated,
      ...current.intents.slice(index + 1)
    ],
    pendingCount,
    failedCount
  });
}
function getPendingIntents(workspaceId, maxRetries) {
  const log = getIntentLog(workspaceId);
  const current = log.get();
  const now = Date.now();
  return (current.intents || []).filter((intent) => {
    if (intent.status === "local") return true;
    if (intent.status === "sending") {
      const stuckDuration = now - intent.createdAt;
      return stuckDuration > 3e4;
    }
    if (intent.status === "queued") {
      if (maxRetries !== void 0 && intent.retries >= maxRetries) {
        return false;
      }
      if (!intent.retryAt) return true;
      return now >= intent.retryAt;
    }
    return false;
  });
}
function getFailedIntents(workspaceId) {
  const log = getIntentLog(workspaceId);
  const current = log.get();
  return current.intents.filter((intent) => intent.status === "failed");
}
function clearIntents(workspaceId) {
  const log = getIntentLog(workspaceId);
  log.set({
    workspaceId,
    intents: [],
    pendingCount: 0,
    failedCount: 0
  });
}
function deleteIntentLog(workspaceId) {
  intentLogs.delete(workspaceId);
  localStorage.removeItem(getIntentLogKey(workspaceId));
}
function getEntityIntentStatus(workspaceId, entityId) {
  const log = getIntentLog(workspaceId);
  const current = log.get();
  const entityIntents = current.intents.filter((i) => i.entityId === entityId).sort((a, b) => b.createdAt - a.createdAt);
  return entityIntents[0]?.status;
}
function getIntentsByDomain(workspaceId, domain) {
  const log = getIntentLog(workspaceId);
  const current = log.get();
  return current.intents.filter(
    (intent) => intent.domain === domain
  );
}
function getIntentsByEntity(workspaceId, entityId) {
  const log = getIntentLog(workspaceId);
  const current = log.get();
  return current.intents.filter(
    (intent) => intent.entityId === entityId
  );
}
function getFailedIntentsObservable(workspaceId) {
  const log = getIntentLog(workspaceId);
  return computed(() => {
    const current = log.get();
    return (current.intents || []).filter((intent) => intent.status === "failed");
  });
}
function getFailedIntentsCountObservable(workspaceId) {
  const log = getIntentLog(workspaceId);
  return computed(() => log.get().failedCount ?? 0);
}
var intentLogs, INTENT_LOG_PREFIX;
var init_intent_log = __esm({
  "src/intent/intent-log.ts"() {
    intentLogs = /* @__PURE__ */ new Map();
    INTENT_LOG_PREFIX = "oxlayer_intent_log_";
  }
});

// src/intent/sync-engine.ts
var sync_engine_exports = {};
__export(sync_engine_exports, {
  SyncEngine: () => SyncEngine,
  getSyncEngine: () => getSyncEngine,
  registerApiAdapter: () => registerApiAdapter,
  registerApiAdapters: () => registerApiAdapters,
  stopSyncEngine: () => stopSyncEngine,
  unregisterApiAdapter: () => unregisterApiAdapter
});
function registerApiAdapter(domain, entityType, adapter) {
  if (!apiAdapters.has(domain)) {
    apiAdapters.set(domain, /* @__PURE__ */ new Map());
  }
  apiAdapters.get(domain).set(entityType, adapter);
}
function unregisterApiAdapter(domain, entityType) {
  const domainAdapters = apiAdapters.get(domain);
  if (domainAdapters) {
    domainAdapters.delete(entityType);
    if (domainAdapters.size === 0) {
      apiAdapters.delete(domain);
    }
  }
}
function getApiAdapter(domain, entityType) {
  const domainAdapters = apiAdapters.get(domain);
  return domainAdapters?.get(entityType);
}
function getSyncEngine(workspaceId, config) {
  console.log("[getSyncEngine] Called", { workspaceId, config, existingEngine: syncEngines.has(workspaceId) });
  if (!syncEngines.has(workspaceId)) {
    const engine = new SyncEngine(workspaceId, config);
    syncEngines.set(workspaceId, engine);
    console.log("[getSyncEngine] Created new engine", { workspaceId, enableSync: engine.config.enableSync });
    if (engine.config.enableSync) {
      console.log("[getSyncEngine] Starting engine because enableSync=true");
      engine.start();
    } else {
      console.log("[getSyncEngine] NOT starting engine because enableSync=false");
    }
  } else if (config) {
    const engine = syncEngines.get(workspaceId);
    const wasEnabled = engine.config.enableSync;
    Object.assign(engine.config, config);
    console.log("[getSyncEngine] Updated existing engine config", { workspaceId, wasEnabled, nowEnabled: engine.config.enableSync });
    if (!wasEnabled && engine.config.enableSync) {
      console.log("[getSyncEngine] Starting engine (was disabled, now enabled)");
      engine.start();
    } else if (wasEnabled && !engine.config.enableSync) {
      console.log("[getSyncEngine] Stopping engine (was enabled, now disabled)");
      engine.stop();
    }
  }
  return syncEngines.get(workspaceId);
}
function stopSyncEngine(workspaceId) {
  const engine = syncEngines.get(workspaceId);
  if (engine) {
    engine.stop();
    syncEngines.delete(workspaceId);
  }
}
function registerApiAdapters(adapters) {
  for (const [key, adapter] of Object.entries(adapters)) {
    const [domain, entityType] = key.split(".");
    registerApiAdapter(domain, entityType, adapter);
  }
}
var DEFAULT_CONFIG, apiAdapters, SyncEngine, syncEngines;
var init_sync_engine = __esm({
  "src/intent/sync-engine.ts"() {
    init_intent_log();
    DEFAULT_CONFIG = {
      maxRetries: 5,
      retryDelay: 1e3,
      syncInterval: 2e3,
      enableSync: true
    };
    apiAdapters = /* @__PURE__ */ new Map();
    SyncEngine = class {
      config;
      state = observable({
        isRunning: false,
        isOnline: true,
        isSyncing: false,
        lastSyncAt: null,
        syncCount: 0,
        errorCount: 0,
        lastError: null
      });
      intervalId = null;
      workspaceId;
      constructor(workspaceId, config = {}) {
        this.workspaceId = workspaceId;
        this.config = { ...DEFAULT_CONFIG, ...config };
      }
      /**
       * Start the sync engine
       */
      start() {
        if (this.state.isRunning.get()) return;
        this.state.isRunning.set(true);
        this.state.isOnline.set(navigator.onLine);
        window.addEventListener("online", this.handleOnline);
        window.addEventListener("offline", this.handleOffline);
        this.intervalId = setInterval(() => {
          if (this.state.isOnline.get() && this.config.enableSync) {
            this.processPendingIntents();
          }
        }, this.config.syncInterval);
        if (this.config.enableSync) {
          this.processPendingIntents();
        }
      }
      /**
       * Stop the sync engine
       */
      stop() {
        if (!this.state.isRunning.get()) return;
        this.state.isRunning.set(false);
        window.removeEventListener("online", this.handleOnline);
        window.removeEventListener("offline", this.handleOffline);
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }
      /**
        * Process all pending intents
        *
      * Policy-aware:
      * - Skips intents that require immediate delivery when offline
      * - Respects intent retry policies
      * - Processes by priority (higher first)
        */
      async processPendingIntents() {
        if (!this.config.enableSync) return;
        if (this.state.isSyncing.get()) return;
        const pending = getPendingIntents(this.workspaceId, this.config.maxRetries);
        if (pending.length === 0) return;
        this.state.isSyncing.set(true);
        const sorted = [...pending].sort((a, b) => {
          const aPriority = a.policy?.priority || 0;
          const bPriority = b.policy?.priority || 0;
          return bPriority - aPriority;
        });
        for (const intent of sorted) {
          await this.processIntent(intent);
        }
        this.state.isSyncing.set(false);
        this.state.lastSyncAt.set(Date.now());
        this.state.syncCount.set(this.state.syncCount.get() + 1);
      }
      /**
        * Process a single intent
        *
      * Policy-aware execution based on intent's policy.
        */
      async processIntent(intent) {
        const policy = intent.policy;
        const adapter = getApiAdapter(intent.domain, intent.entityType);
        if (intent.retries >= this.config.maxRetries && intent.status !== "confirmed" && intent.status !== "acknowledged") {
          console.error(`[SyncEngine] Max retries (${this.config.maxRetries}) exceeded for intent ${intent.id}, marking as failed`);
          batch(() => {
            updateIntentStatus(
              this.workspaceId,
              intent.id,
              "failed",
              { error: intent.error || "Max retries exceeded" }
            );
            this.state.errorCount.set(this.state.errorCount.get() + 1);
          });
          return;
        }
        if (!adapter) {
          console.warn(`[SyncEngine] No adapter found for domain: ${intent.domain}, entityType: ${intent.entityType}`);
          return;
        }
        if (policy?.writeMode === "local-only") {
          console.error(`[SyncEngine] CRITICAL: local-only intent should never reach sync engine: ${intent.id}`);
          updateIntentStatus(this.workspaceId, intent.id, "failed", {
            error: "Local-only intent cannot be synced - this is a bug"
          });
          return;
        }
        if (policy?.writeMode === "api-first") {
          console.log(`[SyncEngine] API-first intent, skipping local state: ${intent.id}`);
        }
        if (policy?.delivery === "immediate" && !this.state.isOnline.get()) {
          updateIntentStatus(this.workspaceId, intent.id, "queued", {
            error: "Offline - immediate delivery required"
          });
          return;
        }
        if (policy?.retry === "none" && intent.retries > 0) {
          updateIntentStatus(this.workspaceId, intent.id, "failed", {
            error: "Retry policy: none"
          });
          return;
        }
        console.log(`[SyncEngine] Processing intent ${intent.id} (attempt ${intent.retries + 1}, type: ${intent.type}, entity: ${intent.entityType})`);
        updateIntentStatus(this.workspaceId, intent.id, "sending");
        try {
          let result;
          switch (intent.type) {
            case "create":
              if (adapter.create) {
                result = await adapter.create(intent.payload);
              }
              break;
            case "update":
              if (adapter.update) {
                result = await adapter.update(intent.entityId, intent.payload);
              }
              break;
            case "delete":
              if (adapter.delete) {
                await adapter.delete(intent.entityId);
                result = {};
              }
              break;
            case "custom":
              if (adapter.custom) {
                result = await adapter.custom(intent.entityType, intent.payload);
              }
              break;
          }
          updateIntentStatus(
            this.workspaceId,
            intent.id,
            "acknowledged",
            {
              serverId: result?.id
            }
          );
          setTimeout(() => {
            updateIntentStatus(
              this.workspaceId,
              intent.id,
              "confirmed",
              {
                confirmedAt: Date.now()
              }
            );
          }, 500);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          const shouldRetry = policy?.retry === "auto" || (!policy || policy.retry === void 0);
          if (shouldRetry && intent.retries < this.config.maxRetries) {
            const delay = Math.min(
              policy ? (intent.retries + 1) * this.config.retryDelay : this.config.retryDelay * Math.pow(2, intent.retries),
              6e4
              // Max 60 seconds
            );
            const retryAt = Date.now() + delay;
            console.log(`[SyncEngine] Scheduling retry ${intent.retries + 1}/${this.config.maxRetries} for intent ${intent.id} in ${delay}ms (at ${new Date(retryAt).toISOString()})`);
            updateIntentStatus(
              this.workspaceId,
              intent.id,
              "queued",
              { error: errorMessage, retryAt, retries: intent.retries + 1 }
            );
          } else {
            console.error(`[SyncEngine] Max retries (${this.config.maxRetries}) reached for intent ${intent.id}, marking as failed. Error: ${errorMessage}`);
            batch(() => {
              updateIntentStatus(
                this.workspaceId,
                intent.id,
                "failed",
                { error: errorMessage }
              );
              this.state.errorCount.set(this.state.errorCount.get() + 1);
              this.state.lastError.set(errorMessage);
            });
          }
        }
      }
      /**
       * Handle online event
       */
      handleOnline = () => {
        this.state.isOnline.set(true);
        if (this.config.enableSync) {
          this.processPendingIntents();
        }
      };
      /**
       * Handle offline event
       */
      handleOffline = () => {
        this.state.isOnline.set(false);
      };
      /**
       * Get the sync engine state
       */
      getState() {
        return this.state;
      }
      /**
       * Manually trigger a sync
       */
      async syncNow() {
        if (!this.config.enableSync) return;
        await this.processPendingIntents();
      }
    };
    syncEngines = /* @__PURE__ */ new Map();
  }
});

// src/intent/policy.ts
var policy_exports = {};
__export(policy_exports, {
  IntentPresets: () => IntentPresets,
  allowsApiSync: () => allowsApiSync,
  allowsAutoRetry: () => allowsAutoRetry,
  allowsLocalPersistence: () => allowsLocalPersistence,
  areIntentsInConflict: () => areIntentsInConflict,
  getDefaultPolicy: () => getDefaultPolicy,
  getRetryDelay: () => getRetryDelay,
  isApiFirst: () => isApiFirst,
  isLocalOnly: () => isLocalOnly,
  isOptimistic: () => isOptimistic,
  normalizePolicy: () => normalizePolicy,
  requiresImmediateDelivery: () => requiresImmediateDelivery,
  resolveConflict: () => resolveConflict
});
function getDefaultPolicy() {
  return IntentPresets.optimistic;
}
function normalizePolicy(partial) {
  const writeMode = partial.writeMode ?? "offline-first";
  return {
    writeMode,
    ux: partial.ux ?? "optimistic",
    delivery: partial.delivery ?? "eventual",
    retry: partial.retry ?? "auto",
    conflict: partial.conflict ?? "latest",
    timeout: partial.timeout,
    priority: partial.priority ?? 0
  };
}
function isOptimistic(policy) {
  return policy.ux === "optimistic";
}
function requiresImmediateDelivery(policy) {
  return policy.delivery === "immediate";
}
function allowsAutoRetry(policy) {
  return policy.retry === "auto";
}
function allowsLocalPersistence(policy) {
  return policy.writeMode === "offline-first" || policy.writeMode === "hybrid" || policy.writeMode === "local-only";
}
function isApiFirst(policy) {
  return policy.writeMode === "api-first";
}
function isLocalOnly(policy) {
  return policy.writeMode === "local-only";
}
function allowsApiSync(policy) {
  return policy.writeMode === "offline-first" || policy.writeMode === "hybrid" || policy.writeMode === "api-first";
}
function getRetryDelay(policy, attemptNumber) {
  return Math.min(1e3 * Math.pow(2, attemptNumber), 3e4);
}
function areIntentsInConflict(intentA, intentB) {
  const sameEntity = intentA.entityId === intentB.entityId;
  const bothReads = intentA.type === "read" && intentB.type === "read";
  return sameEntity && !bothReads;
}
function resolveConflict(localIntent, serverIntent) {
  const { conflict } = localIntent.policy;
  if (conflict === "manual") {
    return "manual";
  }
  if (conflict === "server") {
    return "server";
  }
  return localIntent.createdAt > serverIntent.createdAt ? "local" : "server";
}
var IntentPresets;
var init_policy = __esm({
  "src/intent/policy.ts"() {
    IntentPresets = {
      /**
       * WhatsApp-style messaging (offline-first)
       * - Immediate UI update
       * - Offline allowed
       * - Auto retry
       * - Last write wins
       * - Durable local state
       * - Async API delivery
       */
      optimistic: {
        writeMode: "offline-first",
        ux: "optimistic",
        delivery: "eventual",
        retry: "auto",
        conflict: "latest"
      },
      /**
       * Critical operations like payments (API-first)
       * - Wait for confirmation
       * - Must be online
       * - Fail fast
       * - Server wins
       * - NO local state mutation
       */
      critical: {
        writeMode: "api-first",
        ux: "blocking",
        delivery: "immediate",
        retry: "none",
        conflict: "server"
      },
      /**
       * Collaborative edits (CRM, docs) - offline-first
       * - Immediate UI update
       * - Offline allowed
       * - Auto retry
       * - Manual conflict resolution
       * - Durable local state
       */
      collaborative: {
        writeMode: "offline-first",
        ux: "optimistic",
        delivery: "eventual",
        retry: "auto",
        conflict: "manual"
      },
      /**
       * User-initiated, explicit actions (API-first)
       * - Wait for confirmation
       * - Must be online
       * - Manual retry (show button)
       * - Server wins
       * - NO local state mutation
       */
      explicit: {
        writeMode: "api-first",
        ux: "blocking",
        delivery: "immediate",
        retry: "manual",
        conflict: "server"
      },
      /**
       * Background sync (analytics, telemetry) - hybrid
       * - No UI change
       * - Offline allowed
       * - Auto retry
       * - Server wins
       * - Policy decides persistence
       */
      background: {
        writeMode: "hybrid",
        ux: "readonly",
        delivery: "eventual",
        retry: "auto",
        conflict: "server"
      },
      /**
       * Local-only mode (air-gapped)
       * - Durable local storage
       * - NO network ever
       * - Export/import is only sync
       * - Deterministic, reproducible
       *
       * Use cases:
       * - Security-sensitive apps
       * - Air-gapped environments
       * - Personal knowledge bases
       * - Encrypted local vaults
       * - Compliance-restricted software
       *
       * Note: This preset is intentionally incomplete. Local-only mode requires
       * an `apply` function which is app-specific. Use `createLocalOnlyPolicy()`
       * or provide your own apply function:
       *
       * ```ts
       * recordIntent(workspaceId, {
       *   domain: 'notes',
       *   type: 'create',
       *   entityType: 'note',
       *   entityId: 'note_1',
       *   payload: { title: 'My Note' },
       *   policy: {
       *     ...IntentPresets.localOnly,
       *     apply: (state) => { ... },
       *   },
       * });
       * ```
       */
      localOnly: {
        writeMode: "local-only",
        ux: "optimistic",
        delivery: "never",
        retry: "none",
        conflict: "latest"
      }
    };
  }
});

export { IntentPresets, SyncEngine, allowsApiSync, allowsAutoRetry, allowsLocalPersistence, areIntentsInConflict, clearIntents, createIntentLog, deleteIntentLog, generateIntentId, getDefaultPolicy, getEntityIntentStatus, getFailedIntents, getFailedIntentsCountObservable, getFailedIntentsObservable, getIntentLog, getIntentLogKey, getIntentsByDomain, getIntentsByEntity, getPendingIntents, getRetryDelay, getSyncEngine, init_intent_log, init_policy, init_sync_engine, isApiFirst, isLocalOnly, isOptimistic, normalizePolicy, policy_exports, recordIntent, recordIntentSimple, registerApiAdapter, registerApiAdapters, requiresImmediateDelivery, resolveConflict, stopSyncEngine, sync_engine_exports, unregisterApiAdapter, updateIntentStatus };
//# sourceMappingURL=chunk-AQV7IJ7Y.js.map
//# sourceMappingURL=chunk-AQV7IJ7Y.js.map