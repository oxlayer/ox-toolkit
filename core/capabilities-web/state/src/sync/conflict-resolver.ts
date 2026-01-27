/**
 * @oxlayer/capabilities-state/sync
 *
 * Conflict detection and resolution for sync operations.
 */

import type { TodoEntity, ProjectEntity, SectionEntity } from '../types';

/**
 * Sync conflict types
 */
export type ConflictType = 'modified' | 'deleted' | 'created';

/**
 * Sync conflict for any entity type
 */
export interface SyncConflict<T = TodoEntity | ProjectEntity | SectionEntity> {
  itemType: 'todo' | 'project' | 'section';
  itemId: string;
  localVersion: T | null;
  serverVersion: T | null;
  conflictType: ConflictType;
}

/**
 * Conflict resolution strategy
 */
export type ConflictResolution = 'local' | 'server' | 'latest' | 'manual';

/**
 * Conflict resolver result
 */
export interface ConflictResolutionResult<T> {
  resolved: T | null;
  strategy: ConflictResolution;
  hadConflict: boolean;
}

/**
 * Conflict resolver class
 *
 * Detects and resolves conflicts between local and server data.
 */
export class ConflictResolver {
  private strategy: ConflictResolution = 'latest';

  /**
   * Set the default conflict resolution strategy
   */
  setStrategy(strategy: ConflictResolution): void {
    this.strategy = strategy;
  }

  /**
   * Get the default conflict resolution strategy
   */
  getStrategy(): ConflictResolution {
    return this.strategy;
  }

  /**
   * Detect conflicts between local and server data
   */
  detectConflicts<T extends { id: string; updatedAt: string }>(
    localItems: T[],
    serverItems: T[],
    itemType: 'todo' | 'project' | 'section'
  ): SyncConflict<T>[] {
    const conflicts: SyncConflict<T>[] = [];
    const localMap = new Map(localItems.map((item) => [item.id, item]));
    const serverMap = new Map(serverItems.map((item) => [item.id, item]));

    // Check for modifications
    for (const [id, localItem] of localMap) {
      const serverItem = serverMap.get(id);

      if (serverItem && localItem.updatedAt !== serverItem.updatedAt) {
        conflicts.push({
          itemType,
          itemId: id,
          localVersion: localItem,
          serverVersion: serverItem,
          conflictType: 'modified',
        });
      }
    }

    return conflicts;
  }

  /**
   * Resolve a single conflict
   */
  resolveConflict<T extends { updatedAt: string }>(
    conflict: SyncConflict<T>,
    strategy?: ConflictResolution
  ): ConflictResolutionResult<T | null> {
    const resolution = strategy ?? this.strategy;

    switch (resolution) {
      case 'local':
        return {
          resolved: conflict.localVersion,
          strategy: 'local',
          hadConflict: true,
        };

      case 'server':
        return {
          resolved: conflict.serverVersion,
          strategy: 'server',
          hadConflict: true,
        };

      case 'latest':
        return {
          resolved: this.resolveByTimestamp(conflict.localVersion, conflict.serverVersion),
          strategy: 'latest',
          hadConflict: true,
        };

      case 'manual':
        return {
          resolved: conflict.serverVersion,
          strategy: 'manual',
          hadConflict: true,
        };

      default:
        return {
          resolved: conflict.serverVersion,
          strategy: 'server',
          hadConflict: true,
        };
    }
  }

  /**
   * Resolve by timestamp (latest wins)
   */
  private resolveByTimestamp<T extends { updatedAt: string }>(
    local: T | null,
    server: T | null
  ): T | null {
    if (!local) return server;
    if (!server) return local;

    return local.updatedAt > server.updatedAt ? local : server;
  }
}

/**
 * Default singleton instance of ConflictResolver
 */
export const conflictResolver = new ConflictResolver();
