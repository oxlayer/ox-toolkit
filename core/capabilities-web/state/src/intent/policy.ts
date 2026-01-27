/**
 * @oxlayer/capabilities-web-state/intent
 *
 * Intent Policies - Declarative UX and sync behavior
 *
 * Business code declares intent + policy.
 * Oxlayer handles execution, delivery, and conflict resolution.
 *
 * Key principle: "Business code never talks about sync, retry, or offline.
 * It only declares intent + policy. Everything else is Oxlayer's job."
 */

// ============================================================================
// WRITE MODE - The Core Invariant
// ============================================================================

/**
 * Write Mode - Answers ONE question only:
 *
 * "Is this mutation allowed to touch durable local state?"
 *
 * This is the fundamental architectural invariant that prevents:
 * - Auth tokens from being written to SQLite
 * - Payments from having offline state
 * - Server commands from being over-modeled
 *
 * Everything else (retry, optimistic UI, conflict resolution) builds on this.
 */
export type WriteMode =
  /** Durable local write + async delivery (Intent + SQLite + API) */
  | 'offline-first'
  /** Network-only, no local persistence (API only) */
  | 'api-first'
  /** Policy decides at runtime (conditional persistence) */
  | 'hybrid'
  /** Local durable only, no network ever (air-gapped mode) */
  | 'local-only';

// ============================================================================
// EXISTING POLICY TYPES
// ============================================================================

/**
 * UX Policy - How the UI responds to the intent
 *
 * - 'optimistic': UI updates immediately, shows delivery state (WhatsApp style)
 * - 'blocking': UI waits for server acknowledgment before showing success
 * - 'readonly': No local mutation, query-only
 */
export type IntentUxPolicy = 'optimistic' | 'blocking' | 'readonly';

/**
 * Delivery Policy - When/how the intent is delivered to server
 *
 * - 'eventual': Offline allowed, queued until online (default for most actions)
 * - 'immediate': Must be online, fails if offline (payments, critical operations)
 * - 'never': Never delivers to server (local-only mode)
 */
export type IntentDeliveryPolicy = 'eventual' | 'immediate' | 'never';

/**
 * Retry Policy - How failures are handled
 *
 * - 'auto': Background retries with exponential backoff (default)
 * - 'manual': User must retry (show error, require action)
 * - 'none': Fail fast, no retries (idempotent operations, explicit user choice)
 */
export type IntentRetryPolicy = 'auto' | 'manual' | 'none';

/**
 * Conflict Policy - How server conflicts are resolved
 *
 * - 'latest': Last write wins (local timestamps)
 * - 'server': Server wins always (authoritative)
 * - 'manual': User must resolve (show diff, require choice)
 */
export type IntentConflictPolicy = 'latest' | 'server' | 'manual';

// ============================================================================
// COMPILE-TIME GUARDS: Making illegal states unrepresentable
// ============================================================================

/**
 * Base policy interface - applies to all write modes
 */
interface BasePolicy extends Record<string, unknown> {
  writeMode: WriteMode;
  ux: IntentUxPolicy;
  delivery: IntentDeliveryPolicy;
  retry: IntentRetryPolicy;
  conflict: IntentConflictPolicy;
  timeout?: number;
  priority?: number;
}

/**
 * Local-first policy - allows local state mutation
 *
 * These modes CAN write to SQLite and CAN sync to API (optional)
 */
export interface LocalFirstPolicy extends BasePolicy {
  writeMode: 'offline-first' | 'hybrid';
  /** Function to apply this intent to local state */
  apply?: (state: unknown) => unknown;
  /** Optional: API adapter for sync */
  api?: unknown;
}

/**
 * Local-only policy - local durable storage, NEVER touches network
 *
 * - Air-gapped mode
 * - No API sync ever
 * - Export/import is only sync mechanism
 */
export interface LocalOnlyPolicy extends BasePolicy {
  writeMode: 'local-only';
  /** Function to apply this intent to local state (REQUIRED) */
  apply: (state: unknown) => unknown;
  /** API adapter is FORBIDDEN - compile-time error if present */
  api?: never;
}

/**
 * API-first policy - NEVER allows local state mutation
 *
 * The `apply` property is explicitly forbidden (compile-time error if present)
 */
export interface ApiFirstPolicy extends BasePolicy {
  writeMode: 'api-first';
  /** This property CANNOT exist - TypeScript will error if you try to add it */
  apply?: never;
}

/**
 * Intent Policy - Declarative behavior for an intent
 *
 * Discriminated union based on writeMode ensures:
 * - API-first intents can NEVER have an `apply` function
 * - Local-only intents MUST have an `apply` function and CANNOT have an `api` adapter
 * - Offline-first/hybrid intents MAY have both
 */
export type IntentPolicy = LocalOnlyPolicy | LocalFirstPolicy | ApiFirstPolicy;

// ============================================================================
// PRESET POLICIES
// ============================================================================

/**
 * Preset policies for common use cases
 *
 * These serve as both documentation and convenience.
 *
 * Note: These are base policy templates. Some presets (like localOnly)
 * may require additional properties (like `apply`) to become complete policies.
 *
 * Type assertion is used here because:
 * - localOnly intentionally omits `apply` (it's app-specific)
 * - offline-first/hybrid may optionally include `apply` and `api`
 * - api-first never has `apply` (enforced by types)
 */
export const IntentPresets = {
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
    writeMode: 'offline-first',
    ux: 'optimistic',
    delivery: 'eventual',
    retry: 'auto',
    conflict: 'latest',
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
    writeMode: 'api-first',
    ux: 'blocking',
    delivery: 'immediate',
    retry: 'none',
    conflict: 'server',
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
    writeMode: 'offline-first',
    ux: 'optimistic',
    delivery: 'eventual',
    retry: 'auto',
    conflict: 'manual',
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
    writeMode: 'api-first',
    ux: 'blocking',
    delivery: 'immediate',
    retry: 'manual',
    conflict: 'server',
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
    writeMode: 'hybrid',
    ux: 'readonly',
    delivery: 'eventual',
    retry: 'auto',
    conflict: 'server',
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
    writeMode: 'local-only',
    ux: 'optimistic' as const,
    delivery: 'never' as const,
    retry: 'none' as const,
    conflict: 'latest' as const,
  },
} as const; // Type: typeof IntentPresets

/**
 * Type for accessing preset values (partial policies that may need extension)
 */
export type IntentPreset = (typeof IntentPresets)[keyof typeof IntentPresets];

// ============================================================================
// POLICY HELPERS
// ============================================================================

/**
 * Get the default policy (optimistic offline-first)
 */
export function getDefaultPolicy(): IntentPolicy {
  return IntentPresets.optimistic as IntentPolicy;
}

/**
 * Merge partial policy with defaults
 *
 * Note: For local-only mode, you must provide an `apply` function.
 * This function normalizes only the common policy fields.
 */
export function normalizePolicy(
  partial: Partial<Omit<IntentPolicy, 'apply' | 'api'>>
): Omit<IntentPolicy, 'apply' | 'api'> {
  const writeMode = partial.writeMode ?? 'offline-first';

  return {
    writeMode,
    ux: partial.ux ?? 'optimistic',
    delivery: partial.delivery ?? 'eventual',
    retry: partial.retry ?? 'auto',
    conflict: partial.conflict ?? 'latest',
    timeout: partial.timeout,
    priority: partial.priority ?? 0,
  };
}

/**
 * Check if policy allows optimistic updates
 */
export function isOptimistic(policy: IntentPolicy): boolean {
  return policy.ux === 'optimistic';
}

/**
 * Check if policy requires immediate delivery (no offline)
 */
export function requiresImmediateDelivery(policy: IntentPolicy): boolean {
  return policy.delivery === 'immediate';
}

/**
 * Check if policy allows automatic retries
 */
export function allowsAutoRetry(policy: IntentPolicy): boolean {
  return policy.retry === 'auto';
}

/**
 * Check if policy allows local state persistence
 *
 * This is the CORE GUARD for the writeMode invariant.
 */
export function allowsLocalPersistence(policy: IntentPolicy): boolean {
  return policy.writeMode === 'offline-first' ||
         policy.writeMode === 'hybrid' ||
         policy.writeMode === 'local-only';
}

/**
 * Check if policy is API-first (NEVER touches local state)
 *
 * Use this to prevent accidental SQLite writes.
 */
export function isApiFirst(policy: IntentPolicy): boolean {
  return policy.writeMode === 'api-first';
}

/**
 * Check if policy is local-only (air-gapped mode)
 *
 * Local-only apps:
 * - Never sync to API
 * - Use export/import as sync mechanism
 * - Have deterministic state
 */
export function isLocalOnly(policy: IntentPolicy): boolean {
  return policy.writeMode === 'local-only';
}

/**
 * Check if policy allows API sync
 *
 * Returns false for local-only mode
 */
export function allowsApiSync(policy: IntentPolicy): boolean {
  return policy.writeMode === 'offline-first' ||
         policy.writeMode === 'hybrid' ||
         policy.writeMode === 'api-first';
}

/**
 * Get retry delay for a policy with exponential backoff
 */
export function getRetryDelay(policy: IntentPolicy, attemptNumber: number): number {
  // Base delay: 1s, doubling each attempt, max 30s
  return Math.min(1000 * Math.pow(2, attemptNumber), 30000);
}

/**
 * Check if two intents are in conflict based on policy
 *
 * Two intents conflict if:
 * - They operate on the same entity
 * - At least one is a write operation
 * - The policy says to handle conflicts
 */
export function areIntentsInConflict(
  intentA: { entityId: string; type: string; policy: IntentPolicy },
  intentB: { entityId: string; type: string; policy: IntentPolicy }
): boolean {
  // Same entity + at least one is mutation
  const sameEntity = intentA.entityId === intentB.entityId;
  const bothReads = intentA.type === 'read' && intentB.type === 'read';

  return sameEntity && !bothReads;
}

/**
 * Resolve a conflict based on policy
 *
 * Returns which intent should win: 'local', 'server', or 'manual'
 */
export function resolveConflict(
  localIntent: { createdAt: number; policy: IntentPolicy },
  serverIntent: { createdAt: number; policy: IntentPolicy }
): 'local' | 'server' | 'manual' {
  const { conflict } = localIntent.policy;

  if (conflict === 'manual') {
    return 'manual';
  }

  if (conflict === 'server') {
    return 'server';
  }

  // 'latest' - compare timestamps
  return localIntent.createdAt > serverIntent.createdAt ? 'local' : 'server';
}
