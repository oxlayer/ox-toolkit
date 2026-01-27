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
type WriteMode = 
/** Durable local write + async delivery (Intent + SQLite + API) */
'offline-first'
/** Network-only, no local persistence (API only) */
 | 'api-first'
/** Policy decides at runtime (conditional persistence) */
 | 'hybrid'
/** Local durable only, no network ever (air-gapped mode) */
 | 'local-only';
/**
 * UX Policy - How the UI responds to the intent
 *
 * - 'optimistic': UI updates immediately, shows delivery state (WhatsApp style)
 * - 'blocking': UI waits for server acknowledgment before showing success
 * - 'readonly': No local mutation, query-only
 */
type IntentUxPolicy = 'optimistic' | 'blocking' | 'readonly';
/**
 * Delivery Policy - When/how the intent is delivered to server
 *
 * - 'eventual': Offline allowed, queued until online (default for most actions)
 * - 'immediate': Must be online, fails if offline (payments, critical operations)
 * - 'never': Never delivers to server (local-only mode)
 */
type IntentDeliveryPolicy = 'eventual' | 'immediate' | 'never';
/**
 * Retry Policy - How failures are handled
 *
 * - 'auto': Background retries with exponential backoff (default)
 * - 'manual': User must retry (show error, require action)
 * - 'none': Fail fast, no retries (idempotent operations, explicit user choice)
 */
type IntentRetryPolicy = 'auto' | 'manual' | 'none';
/**
 * Conflict Policy - How server conflicts are resolved
 *
 * - 'latest': Last write wins (local timestamps)
 * - 'server': Server wins always (authoritative)
 * - 'manual': User must resolve (show diff, require choice)
 */
type IntentConflictPolicy = 'latest' | 'server' | 'manual';
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
interface LocalFirstPolicy extends BasePolicy {
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
interface LocalOnlyPolicy extends BasePolicy {
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
interface ApiFirstPolicy extends BasePolicy {
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
type IntentPolicy = LocalOnlyPolicy | LocalFirstPolicy | ApiFirstPolicy;
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
declare const IntentPresets: {
    /**
     * WhatsApp-style messaging (offline-first)
     * - Immediate UI update
     * - Offline allowed
     * - Auto retry
     * - Last write wins
     * - Durable local state
     * - Async API delivery
     */
    readonly optimistic: {
        readonly writeMode: "offline-first";
        readonly ux: "optimistic";
        readonly delivery: "eventual";
        readonly retry: "auto";
        readonly conflict: "latest";
    };
    /**
     * Critical operations like payments (API-first)
     * - Wait for confirmation
     * - Must be online
     * - Fail fast
     * - Server wins
     * - NO local state mutation
     */
    readonly critical: {
        readonly writeMode: "api-first";
        readonly ux: "blocking";
        readonly delivery: "immediate";
        readonly retry: "none";
        readonly conflict: "server";
    };
    /**
     * Collaborative edits (CRM, docs) - offline-first
     * - Immediate UI update
     * - Offline allowed
     * - Auto retry
     * - Manual conflict resolution
     * - Durable local state
     */
    readonly collaborative: {
        readonly writeMode: "offline-first";
        readonly ux: "optimistic";
        readonly delivery: "eventual";
        readonly retry: "auto";
        readonly conflict: "manual";
    };
    /**
     * User-initiated, explicit actions (API-first)
     * - Wait for confirmation
     * - Must be online
     * - Manual retry (show button)
     * - Server wins
     * - NO local state mutation
     */
    readonly explicit: {
        readonly writeMode: "api-first";
        readonly ux: "blocking";
        readonly delivery: "immediate";
        readonly retry: "manual";
        readonly conflict: "server";
    };
    /**
     * Background sync (analytics, telemetry) - hybrid
     * - No UI change
     * - Offline allowed
     * - Auto retry
     * - Server wins
     * - Policy decides persistence
     */
    readonly background: {
        readonly writeMode: "hybrid";
        readonly ux: "readonly";
        readonly delivery: "eventual";
        readonly retry: "auto";
        readonly conflict: "server";
    };
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
    readonly localOnly: {
        readonly writeMode: "local-only";
        readonly ux: "optimistic";
        readonly delivery: "never";
        readonly retry: "none";
        readonly conflict: "latest";
    };
};
/**
 * Get the default policy (optimistic offline-first)
 */
declare function getDefaultPolicy(): IntentPolicy;
/**
 * Merge partial policy with defaults
 *
 * Note: For local-only mode, you must provide an `apply` function.
 * This function normalizes only the common policy fields.
 */
declare function normalizePolicy(partial: Partial<Omit<IntentPolicy, 'apply' | 'api'>>): Omit<IntentPolicy, 'apply' | 'api'>;
/**
 * Check if policy allows optimistic updates
 */
declare function isOptimistic(policy: IntentPolicy): boolean;
/**
 * Check if policy requires immediate delivery (no offline)
 */
declare function requiresImmediateDelivery(policy: IntentPolicy): boolean;
/**
 * Check if policy allows automatic retries
 */
declare function allowsAutoRetry(policy: IntentPolicy): boolean;
/**
 * Check if policy allows local state persistence
 *
 * This is the CORE GUARD for the writeMode invariant.
 */
declare function allowsLocalPersistence(policy: IntentPolicy): boolean;
/**
 * Check if policy is API-first (NEVER touches local state)
 *
 * Use this to prevent accidental SQLite writes.
 */
declare function isApiFirst(policy: IntentPolicy): boolean;
/**
 * Check if policy is local-only (air-gapped mode)
 *
 * Local-only apps:
 * - Never sync to API
 * - Use export/import as sync mechanism
 * - Have deterministic state
 */
declare function isLocalOnly(policy: IntentPolicy): boolean;
/**
 * Check if policy allows API sync
 *
 * Returns false for local-only mode
 */
declare function allowsApiSync(policy: IntentPolicy): boolean;
/**
 * Get retry delay for a policy with exponential backoff
 */
declare function getRetryDelay(policy: IntentPolicy, attemptNumber: number): number;
/**
 * Check if two intents are in conflict based on policy
 *
 * Two intents conflict if:
 * - They operate on the same entity
 * - At least one is a write operation
 * - The policy says to handle conflicts
 */
declare function areIntentsInConflict(intentA: {
    entityId: string;
    type: string;
    policy: IntentPolicy;
}, intentB: {
    entityId: string;
    type: string;
    policy: IntentPolicy;
}): boolean;
/**
 * Resolve a conflict based on policy
 *
 * Returns which intent should win: 'local', 'server', or 'manual'
 */
declare function resolveConflict(localIntent: {
    createdAt: number;
    policy: IntentPolicy;
}, serverIntent: {
    createdAt: number;
    policy: IntentPolicy;
}): 'local' | 'server' | 'manual';

export { type IntentConflictPolicy as I, type WriteMode as W, type IntentDeliveryPolicy as a, type IntentPolicy as b, IntentPresets as c, type IntentRetryPolicy as d, type IntentUxPolicy as e, allowsApiSync as f, allowsAutoRetry as g, allowsLocalPersistence as h, areIntentsInConflict as i, getDefaultPolicy as j, getRetryDelay as k, isApiFirst as l, isLocalOnly as m, isOptimistic as n, normalizePolicy as o, resolveConflict as p, requiresImmediateDelivery as r };
