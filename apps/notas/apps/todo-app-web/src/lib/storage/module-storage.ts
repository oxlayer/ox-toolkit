/**
 * ModuleStorage API
 *
 * A unified storage interface that supports two modes:
 * - Anonymous/Offline-only: Simple key-value storage, no sync
 * - Logged-in/Offline-first: Key-value with metadata, sync, LRU management
 *
 * Inspired by Notion's offline architecture:
 * - Single table storage (key | value)
 * - Metadata for selective offline tracking (logged-in mode only)
 * - Export/import for portability (both modes)
 */

import { sqliteStorage } from '@oxlayer/capabilities-web-state';
import type { Workspace } from '@/lib/workspace/api';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Storage mode determined by authentication state
 */
export type StorageMode = 'anonymous' | 'authenticated';

/**
 * Reasons why a module is stored offline (logged-in mode only)
 */
export type OfflineReason = 'manual' | 'recent' | 'favorite' | 'workspace';

/**
 * Module metadata for logged-in mode
 */
export interface ModuleMetadata {
    updatedAt: number;           // Last modification time
    version: number;             // For conflict resolution
    reasons: OfflineReason[];    // Why this module is offline
    syncedAt?: number;           // Last successful sync timestamp
    size?: number;               // Estimated size in bytes
}

/**
 * Storage entry with optional metadata
 */
export interface StorageEntry {
    key: string;
    value: unknown;
    metadata?: ModuleMetadata;
}

/**
 * Change record for incremental sync
 */
export interface StorageChange {
    key: string;
    value: unknown;
    updatedAt: number;
    version: number;
}

/**
 * Module storage interface
 *
 * Same API for both modes, behavior differs based on authentication.
 */
export interface ModuleStorage {
    /**
     * Get a module by key
     */
    get(key: string): Promise<unknown | null>;

    /**
     * Set a module value
     */
    set(key: string, value: unknown): Promise<void>;

    /**
     * Remove a module
     */
    remove(key: string): Promise<void>;

    /**
     * List all module keys
     */
    listKeys(): Promise<string[]>;

    /**
     * Get changes since timestamp (logged-in mode only)
     * Returns all changes in anonymous mode
     */
    getChangesSince(timestamp: number): Promise<StorageChange[]>;

    /**
     * Export all data as JSON blob
     */
    export(): Promise<Blob>;

    /**
     * Import data from JSON blob
     */
    import(blob: Blob): Promise<void>;

    /**
     * Get current storage mode
     */
    getMode(): StorageMode;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Check if a workspace is local (created while anonymous)
 */
function isLocalWorkspace(workspace: Workspace | null): boolean {
    if (!workspace) return false;
    if ('isLocalOnly' in workspace && workspace.isLocalOnly) {
        return true;
    }
    return workspace.id.startsWith('local_ws_') || workspace.id.startsWith('imported_');
}

/**
 * Generate storage key for a workspace
 */
function getWorkspaceStorageKey(workspaceId: string, moduleKey: string): string {
    return `ws:${workspaceId}:${moduleKey}`;
}

/**
 * Parse storage key to extract workspace ID and module key
 * (Commented out - kept for future use)
 */
/* function parseStorageKey(key: string): { workspaceId: string; moduleKey: string } | null {
    const match = key.match(/^ws:([^:]+):(.+)$/);
    if (!match) return null;
    return { workspaceId: match[1], moduleKey: match[2] };
} */

/**
 * Calculate approximate size of a value in bytes
 */
function calculateSize(value: unknown): number {
    return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
}

/**
 * Anonymous mode storage implementation
 *
 * - Simple key-value storage
 * - No sync, no metadata
 * - Export/import for portability
 */
class AnonymousModuleStorage implements ModuleStorage {
    private workspaceId: string;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    getMode(): StorageMode {
        return 'anonymous';
    }

    async get(key: string): Promise<unknown | null> {
        const storageKey = getWorkspaceStorageKey(this.workspaceId, key);
        const result = await sqliteStorage.getItem(storageKey);
        if (!result) return null;

        try {
            // Handle both plain values and wrapped values
            if (typeof result === 'string') {
                return JSON.parse(result);
            }
            if (result && typeof result === 'object' && 'value' in result) {
                return (result as { value: unknown }).value;
            }
            return result;
        } catch {
            return result;
        }
    }

    async set(key: string, value: unknown): Promise<void> {
        const storageKey = getWorkspaceStorageKey(this.workspaceId, key);
        const valueStr = JSON.stringify(value);
        await sqliteStorage.setItem(storageKey, valueStr);
    }

    async remove(key: string): Promise<void> {
        const storageKey = getWorkspaceStorageKey(this.workspaceId, key);
        await sqliteStorage.removeItem(storageKey);
    }

    async listKeys(): Promise<string[]> {
        const allKeys = await sqliteStorage.getAllKeys();
        const prefix = `ws:${this.workspaceId}:`;
        return allKeys
            .filter(key => key.startsWith(prefix))
            .map(key => key.slice(prefix.length));
    }

    async getChangesSince(_timestamp: number): Promise<StorageChange[]> {
        // Anonymous mode doesn't track changes
        // Return empty array - sync is not supported
        return [];
    }

    async export(): Promise<Blob> {
        const keys = await this.listKeys();
        const data: Record<string, unknown> = {};

        for (const key of keys) {
            data[key] = await this.get(key);
        }

        const exportData = {
            version: 1,
            exportedAt: Date.now(),
            workspaceId: this.workspaceId,
            mode: 'anonymous' as const,
            data,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        });
        return blob;
    }

    async import(blob: Blob): Promise<void> {
        const text = await blob.text();
        const importData = JSON.parse(text);

        if (importData.version !== 1) {
            throw new Error('Unsupported export version');
        }

        if (importData.mode !== 'anonymous') {
            throw new Error('Cannot import non-anonymous data in anonymous mode');
        }

        const { data } = importData;
        for (const [key, value] of Object.entries(data)) {
            await this.set(key, value);
        }
    }
}

/**
 * Authenticated mode storage implementation
 *
 * - Key-value storage with metadata
 * - Track changes for incremental sync
 * - LRU + manual pin management
 * - Conflict resolution support
 */
class AuthenticatedModuleStorage implements ModuleStorage {
    private workspaceId: string;
    private storageLimit = 50 * 1024 * 1024; // 50MB default

    constructor(workspaceId: string, storageLimit?: number) {
        this.workspaceId = workspaceId;
        if (storageLimit) {
            this.storageLimit = storageLimit;
        }
    }

    getMode(): StorageMode {
        return 'authenticated';
    }

    async get(key: string): Promise<unknown | null> {
        const storageKey = getWorkspaceStorageKey(this.workspaceId, key);
        const result = await sqliteStorage.getItem(storageKey);
        if (!result) return null;

        try {
            if (typeof result === 'string') {
                return JSON.parse(result);
            }
            if (result && typeof result === 'object' && 'value' in result) {
                return (result as { value: unknown }).value;
            }
            return result;
        } catch {
            return result;
        }
    }

    async set(key: string, value: unknown, options?: { reasons?: OfflineReason[] }): Promise<void> {
        const storageKey = getWorkspaceStorageKey(this.workspaceId, key);
        const now = Date.now();
        const size = calculateSize(value);

        // Get existing metadata if any
        const existing = await this.getWithMetadata(key);
        const metadata: ModuleMetadata = {
            updatedAt: now,
            version: existing?.metadata ? existing.metadata.version + 1 : 1,
            reasons: options?.reasons || existing?.metadata?.reasons || ['recent'],
            syncedAt: undefined, // Will be set on sync
            size,
        };

        const entry: StorageEntry = {
            key: storageKey,
            value,
            metadata,
        };

        await sqliteStorage.setItem(storageKey, JSON.stringify(entry));

        // Check storage limit and prune if necessary
        await this.checkAndPrune();
    }

    async remove(key: string): Promise<void> {
        const storageKey = getWorkspaceStorageKey(this.workspaceId, key);
        await sqliteStorage.removeItem(storageKey);
    }

    async listKeys(): Promise<string[]> {
        const allKeys = await sqliteStorage.getAllKeys();
        const prefix = `ws:${this.workspaceId}:`;
        return allKeys
            .filter(key => key.startsWith(prefix))
            .map(key => key.slice(prefix.length));
    }

    async getChangesSince(timestamp: number): Promise<StorageChange[]> {
        const keys = await this.listKeys();
        const changes: StorageChange[] = [];

        for (const key of keys) {
            const entry = await this.getWithMetadata(key);
            if (entry?.metadata && entry.metadata.updatedAt > timestamp) {
                changes.push({
                    key,
                    value: entry.value,
                    updatedAt: entry.metadata.updatedAt,
                    version: entry.metadata.version,
                });
            }
        }

        return changes.sort((a, b) => a.updatedAt - b.updatedAt);
    }

    /**
     * Get entry with metadata
     */
    async getWithMetadata(key: string): Promise<StorageEntry | null> {
        const storageKey = getWorkspaceStorageKey(this.workspaceId, key);
        const result = await sqliteStorage.getItem(storageKey);
        if (!result) return null;

        try {
            if (typeof result === 'string') {
                const parsed = JSON.parse(result);
                if ('metadata' in parsed) {
                    return parsed as StorageEntry;
                }
                // Legacy format - wrap it
                return {
                    key: storageKey,
                    value: parsed,
                    metadata: {
                        updatedAt: Date.now(),
                        version: 1,
                        reasons: ['recent'],
                    },
                };
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Check storage usage and prune old entries if needed
     */
    private async checkAndPrune(): Promise<void> {
        const keys = await this.listKeys();
        let totalSize = 0;

        // Calculate total size
        for (const key of keys) {
            const entry = await this.getWithMetadata(key);
            if (entry?.metadata?.size) {
                totalSize += entry.metadata.size;
            }
        }

        // If over limit, prune entries that are only 'recent' (not manually pinned)
        if (totalSize > this.storageLimit) {
            const entries: Array<{ key: string; entry: StorageEntry }> = [];

            for (const key of keys) {
                const entry = await this.getWithMetadata(key);
                if (entry?.metadata && entry.metadata.reasons.includes('recent')) {
                    entries.push({ key, entry });
                }
            }

            // Sort by updated_at (oldest first) and remove until under limit
            entries.sort((a, b) => (a.entry.metadata?.updatedAt || 0) - (b.entry.metadata?.updatedAt || 0));

            for (const { key, entry } of entries) {
                if (totalSize <= this.storageLimit * 0.8) break; // Target 80% of limit

                await this.remove(key);
                totalSize -= entry.metadata?.size || 0;
                console.log(`[ModuleStorage] Pruned module: ${key}`);
            }
        }
    }

    async export(): Promise<Blob> {
        const keys = await this.listKeys();
        const data: Record<string, { value: unknown; metadata?: ModuleMetadata }> = {};

        for (const key of keys) {
            const entry = await this.getWithMetadata(key);
            if (entry) {
                data[key] = {
                    value: entry.value,
                    metadata: entry.metadata,
                };
            }
        }

        const exportData = {
            version: 1,
            exportedAt: Date.now(),
            workspaceId: this.workspaceId,
            mode: 'authenticated' as const,
            data,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        });
        return blob;
    }

    async import(blob: Blob): Promise<void> {
        const text = await blob.text();
        const importData = JSON.parse(text);

        if (importData.version !== 1) {
            throw new Error('Unsupported export version');
        }

        const { data } = importData;
        for (const [key, item] of Object.entries(data)) {
            if (item && typeof item === 'object' && 'value' in item) {
                const entry = item as { value: unknown; metadata?: ModuleMetadata };
                await this.set(key, entry.value, {
                    reasons: entry.metadata?.reasons,
                });
            }
        }
    }

    /**
     * Mark a module as manually available offline
     */
    async pin(key: string): Promise<void> {
        const entry = await this.getWithMetadata(key);
        const reasons = entry?.metadata?.reasons || [];
        if (!reasons.includes('manual')) {
            reasons.push('manual');
        }
        await this.set(key, entry?.value || {}, { reasons });
    }

    /**
     * Unpin a module (remove manual offline flag)
     */
    async unpin(key: string): Promise<void> {
        const entry = await this.getWithMetadata(key);
        let reasons = entry?.metadata?.reasons || [];
        reasons = reasons.filter(r => r !== 'manual');

        // Keep at least 'recent' if there are other reasons
        if (reasons.length === 0) {
            reasons = ['recent'];
        }

        await this.set(key, entry?.value || {}, { reasons });
    }

    /**
     * Record access to a module (updates LRU)
     */
    async access(key: string): Promise<void> {
        const entry = await this.getWithMetadata(key);
        const reasons = entry?.metadata?.reasons || [];

        // Add 'recent' reason if not present
        if (!reasons.includes('recent')) {
            reasons.push('recent');
        }

        await this.set(key, entry?.value || {}, { reasons });
    }

    /**
     * Get list of modules that are available offline
     */
    async getOfflineModules(): Promise<string[]> {
        const keys = await this.listKeys();
        const offlineKeys: string[] = [];

        for (const key of keys) {
            const entry = await this.getWithMetadata(key);
            if (entry?.metadata && entry.metadata.reasons.length > 0) {
                offlineKeys.push(key);
            }
        }

        return offlineKeys;
    }
}

// ============================================================================
// FACTORY
// ============================================================================

let currentStorage: ModuleStorage | null = null;
let currentWorkspaceId: string | null = null;

/**
 * Get or create ModuleStorage instance for current workspace
 *
 * Automatically selects mode based on authentication and workspace type:
 * - Anonymous users: always anonymous mode
 * - Local workspaces: anonymous mode (even when authenticated)
 * - Server workspaces: authenticated mode
 */
export async function getModuleStorage(
    workspaceId: string,
    isAuthenticated: boolean,
    workspace?: Workspace | null
): Promise<ModuleStorage> {
    // Check if we need to create a new storage instance
    if (currentStorage && currentWorkspaceId === workspaceId) {
        return currentStorage;
    }

    // Determine mode
    const isLocal = workspace ? isLocalWorkspace(workspace) : !isAuthenticated;

    if (isLocal) {
        console.log('[ModuleStorage] Creating anonymous mode storage for workspace:', workspaceId);
        currentStorage = new AnonymousModuleStorage(workspaceId);
    } else {
        console.log('[ModuleStorage] Creating authenticated mode storage for workspace:', workspaceId);
        currentStorage = new AuthenticatedModuleStorage(workspaceId);
    }

    currentWorkspaceId = workspaceId;
    return currentStorage;
}

/**
 * Reset current storage instance (e.g., on workspace switch)
 */
export function resetModuleStorage(): void {
    currentStorage = null;
    currentWorkspaceId = null;
}

/**
 * Export utilities
 */
export const exportUtils = {
    /**
     * Download export as file
     */
    async downloadExport(workspaceId: string, storage: ModuleStorage): Promise<void> {
        const blob = await storage.export();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workspace-${workspaceId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Import from file input
     */
    async importFromFile(file: File, storage: ModuleStorage): Promise<void> {
        await storage.import(file);
    },
};
