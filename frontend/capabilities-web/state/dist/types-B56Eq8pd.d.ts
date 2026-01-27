/**
 * @oxlayer/capabilities-state
 *
 * Shared types for local-first state management.
 *
 * This package is domain-agnostic. It can be used for:
 * - Todo apps
 * - CRM systems
 * - ERP/Accounting
 * - Ecommerce
 * - Chat/Messaging
 * - Food delivery
 * - Any user-action-driven application
 */
/**
 * Delivery status for user intent (WhatsApp-like)
 * - 'local': Optimistic only (created locally)
 * - 'queued': Waiting to sync (offline or retry)
 * - 'sending': In-flight to server
 * - 'acknowledged': Server accepted (id assigned)
 * - 'confirmed': Server processed + visible elsewhere
 * - 'failed': Conflict / rejected
 */
type DeliveryStatus = 'local' | 'queued' | 'sending' | 'acknowledged' | 'confirmed' | 'failed';
/**
 * Intent action types
 *
 * Generic verbs that apply across domains:
 * - 'create': Add new entity
 * - 'update': Modify existing entity
 * - 'delete': Remove entity
 * - 'custom': Domain-specific action (can be extended by apps)
 */
type IntentActionType = 'create' | 'update' | 'delete' | 'custom';
/**
 * User Intent - The core primitive for intent-first architecture
 *
 * Every user action becomes an append-only fact.
 * Legend State holds it. React Query reconciles it. API confirms it.
 *
 * UI reacts to intent, not to HTTP.
 * HTTP is just one transport.
 *
 * Generic across ALL domains - not tied to Todo, Project, etc.
 *
 * @template T - The payload type (domain-specific data)
 * @template P - Optional policy override (uses default if not provided)
 */
interface UserIntent<T = unknown, P = Record<string, unknown>> {
    /** Unique intent ID (client-generated) */
    id: string;
    /** Domain identifier (e.g., 'todo', 'order', 'message', 'lead') */
    domain: string;
    /** Action type */
    type: IntentActionType;
    /** Entity type (e.g., 'item', 'task', 'conversation') */
    entityType: string;
    /** Entity ID (for update/delete, or temp ID for create) */
    entityId: string;
    /** Action payload (domain-specific) */
    payload: T;
    /** Optional policy override (uses default if not provided) */
    policy?: P;
    /** When the intent was created */
    createdAt: number;
    /** Current delivery status */
    status: DeliveryStatus;
    /** Number of retry attempts */
    retries: number;
    /** When to retry (timestamp for backoff scheduling) */
    retryAt?: number;
    /** Error message if failed */
    error?: string;
    /** Server-assigned ID (after confirmation) */
    serverId?: string;
    /** When server confirmed the intent */
    confirmedAt?: number;
}
/**
 * Generic workspace data container
 *
 * Apps define their own entity types.
 * This just provides the container structure.
 *
 * @template T - The shape of the entities object (e.g., { todos: [], projects: [] })
 */
interface WorkspaceData<T = Record<string, unknown>> {
    workspaceId: string;
    entities: T;
    settings: Record<string, unknown>;
}
/**
 * Sync status for an entity (WhatsApp-like ticks)
 *
 * Can be applied to ANY entity type, not just todos.
 */
type EntitySyncStatus = DeliveryStatus;
/**
 * Workspace export format
 *
 * Generic export format that works with any workspace type.
 *
 * @template T - The shape of the entities object
 * @template W - The workspace type (apps define their own)
 */
interface WorkspaceExport<T = Record<string, unknown>, W = Record<string, unknown>> {
    version: string;
    exportedAt: string;
    workspace: W;
    data: WorkspaceData<T>;
    metadata: {
        exportType: 'full' | 'incremental';
        itemCount: number;
        checksum: string;
    };
    type?: 'single' | 'multi-workspace';
    workspaces?: WorkspaceExport<T, W>[];
}
/**
 * Sync state for an observable
 */
interface SyncStatus {
    isPersistLoaded: boolean;
    isPersistEnabled: boolean;
    isLoaded: boolean;
    isSyncEnabled: boolean;
    lastSync: number | null;
    syncCount: number;
    isSyncing: boolean;
    error: Error | null;
}
/**
 * Sync configuration options
 */
interface SyncOptions {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
    retrySync: boolean;
    maxRetries: number;
    conflictResolution: 'local' | 'server' | 'latest';
}

export type { DeliveryStatus as D, EntitySyncStatus as E, IntentActionType as I, SyncOptions as S, UserIntent as U, WorkspaceData as W, SyncStatus as a, WorkspaceExport as b };
