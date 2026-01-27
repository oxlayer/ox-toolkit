/**
 * OfflineManager
 *
 * Manages offline module tracking for logged-in users.
 * Inspired by Notion's offline_action approach:
 * - Track reasons why each module is offline
 * - LRU cache for recent modules
 * - Storage limit management
 * - Manual pin/unpin
 */

import type { ModuleStorage, OfflineReason } from './module-storage';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Offline module info
 */
export interface OfflineModuleInfo {
    key: string;
    reasons: OfflineReason[];
    lastAccessedAt: number;
    size: number;
}

/**
 * LRU cache entry
 */
interface LRUEntry {
    key: string;
    accessedAt: number;
}

// ============================================================================
// CONFIG
// ============================================================================

const DEFAULT_MAX_RECENT = 20; // Keep 20 most recent modules
const STORAGE_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

// ============================================================================
// OFFLINE MANAGER
// ============================================================================

export class OfflineManager {
    private storage: ModuleStorage;
    private recentLRU: LRUEntry[] = [];
    private maxRecent: number;
    private checkInterval: number | null = null;

    constructor(storage: ModuleStorage, maxRecent: number = DEFAULT_MAX_RECENT) {
        this.storage = storage;
        this.maxRecent = maxRecent;
    }

    /**
     * Start periodic storage checks
     */
    start(): void {
        if (this.checkInterval) return;

        this.checkInterval = window.setInterval(() => {
            this.pruneIfNeeded().catch(error => {
                console.error('[OfflineManager] Prune check failed:', error);
            });
        }, STORAGE_CHECK_INTERVAL);
    }

    /**
     * Stop periodic storage checks
     */
    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Pin a module as manually available offline
     */
    async pin(key: string): Promise<void> {
        if (this.storage.getMode() !== 'authenticated') {
            console.warn('[OfflineManager] Pin only available in authenticated mode');
            return;
        }

        const storage = this.storage as any; // AuthenticatedModuleStorage
        await storage.pin(key);
        console.log('[OfflineManager] Pinned module:', key);
    }

    /**
     * Unpin a module (remove manual offline flag)
     */
    async unpin(key: string): Promise<void> {
        if (this.storage.getMode() !== 'authenticated') {
            console.warn('[OfflineManager] Unpin only available in authenticated mode');
            return;
        }

        const storage = this.storage as any; // AuthenticatedModuleStorage
        await storage.unpin(key);
        console.log('[OfflineManager] Unpinned module:', key);
    }

    /**
     * Record access to a module (updates LRU)
     */
    async access(key: string): Promise<void> {
        if (this.storage.getMode() !== 'authenticated') {
            return;
        }

        const storage = this.storage as any; // AuthenticatedModuleStorage
        await storage.access(key);

        // Update LRU
        const now = Date.now();
        this.recentLRU = this.recentLRU.filter(entry => entry.key !== key);
        this.recentLRU.push({ key, accessedAt: now });

        // Trim to max size
        if (this.recentLRU.length > this.maxRecent) {
            this.recentLRU.sort((a, b) => b.accessedAt - a.accessedAt);
            this.recentLRU = this.recentLRU.slice(0, this.maxRecent);
        }
    }

    /**
     * Get list of modules available offline
     */
    async getOfflineModules(): Promise<string[]> {
        if (this.storage.getMode() !== 'authenticated') {
            const keys = await this.storage.listKeys();
            return keys; // All modules are offline in anonymous mode
        }

        const storage = this.storage as any; // AuthenticatedModuleStorage
        return await storage.getOfflineModules();
    }

    /**
     * Get detailed info about offline modules
     */
    async getOfflineModuleInfo(): Promise<OfflineModuleInfo[]> {
        const keys = await this.storage.listKeys();
        const info: OfflineModuleInfo[] = [];

        for (const key of keys) {
            // Check if in LRU
            const lruEntry = this.recentLRU.find(e => e.key === key);

            if (lruEntry) {
                info.push({
                    key,
                    reasons: ['recent'],
                    lastAccessedAt: lruEntry.accessedAt,
                    size: 0, // Would need to fetch from storage
                });
            }
        }

        return info;
    }

    /**
     * Check storage usage and prune if needed
     */
    private async pruneIfNeeded(): Promise<void> {
        if (this.storage.getMode() !== 'authenticated') {
            return;
        }

        // The AuthenticatedModuleStorage handles pruning automatically
        // This is a hook for additional logic if needed
        console.log('[OfflineManager] Checking storage usage...');
    }

    /**
     * Clear all offline modules (use with caution)
     */
    async clearAllOffline(): Promise<void> {
        const keys = await this.storage.listKeys();
        for (const key of keys) {
            await this.storage.remove(key);
        }
        this.recentLRU = [];
        console.log('[OfflineManager] Cleared all offline modules');
    }
}

// ============================================================================
// INSTANCE
// ============================================================================

let currentManager: OfflineManager | null = null;

/**
 * Get or create OfflineManager instance
 */
export function getOfflineManager(storage: ModuleStorage): OfflineManager {
    if (!currentManager || currentManager['storage'] !== storage) {
        currentManager = new OfflineManager(storage);
    }
    return currentManager;
}

/**
 * Reset current manager
 */
export function resetOfflineManager(): void {
    if (currentManager) {
        currentManager.stop();
        currentManager = null;
    }
}
