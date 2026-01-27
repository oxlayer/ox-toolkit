/**
 * @oxlayer/capabilities-web-state/intent
 *
 * Intent-first architecture with WhatsApp-like delivery states
 *
 * "UI reacts to intent, not to HTTP."
 * "Business code never talks about sync, retry, or offline.
 *  It only declares intent + policy. Everything else is Oxlayer's job."
 *
 * Domain-agnostic: Works for todos, CRM, ERP, ecommerce, chat, food delivery, etc.
 */

// Intent Log
export {
  recordIntent,
  recordIntentSimple,
  updateIntentStatus,
  getPendingIntents,
  getFailedIntents,
  getFailedIntentsObservable,
  getFailedIntentsCountObservable,
  clearIntents,
  deleteIntentLog,
  getEntityIntentStatus,
  getIntentsByDomain,
  getIntentsByEntity,
  getIntentLog,
  getIntentLogKey,
  generateIntentId,
  createIntentLog,
  type IntentLogEntry,
  type IntentLogState,
} from './intent-log';

// Sync Engine
export {
  getSyncEngine,
  stopSyncEngine,
  registerApiAdapter,
  unregisterApiAdapter,
  registerApiAdapters,
  type SyncEngineConfig,
  type SyncEngineState,
  type ApiAdapter,
} from './sync-engine';

// Export the class separately
export { SyncEngine } from './sync-engine';

// Policy
export {
  type IntentPolicy,
  type IntentUxPolicy,
  type IntentDeliveryPolicy,
  type IntentRetryPolicy,
  type IntentConflictPolicy,
  IntentPresets,
  getDefaultPolicy,
  normalizePolicy,
  isOptimistic,
  requiresImmediateDelivery,
  allowsAutoRetry,
  getRetryDelay,
  areIntentsInConflict,
  resolveConflict,
} from './policy';
