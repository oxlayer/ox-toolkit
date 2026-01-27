/**
 * @oxlayer/capabilities-state/export
 *
 * Workspace import manager for .oxlayer files.
 *
 * Generic import manager that works with any workspace type.
 */

import type { WorkspaceExport, WorkspaceData } from '../types';
import { getWorkspaceDataKey } from '../data/workspace-data-store';
import { exportManager } from './export-manager';

/**
 * Import options
 */
export interface ImportOptions {
  merge?: boolean;
  newName?: string;
  validateChecksum?: boolean;
}

/**
 * Import result
 *
 * @template W - The workspace type (apps define their own)
 */
export interface ImportResult<W = Record<string, unknown>> {
  workspace: W;
  wasMerged: boolean;
  itemCount: number;
}

/**
 * Import manager class
 *
 * Handles importing workspaces from .oxlayer files.
 *
 * @template W - The workspace type (apps define their own)
 * @template T - The shape of the entities object
 *
 * @example
 * ```ts
 * import { ImportManager } from '@oxlayer/capabilities-state/export';
 *
 * const importManager = new ImportManager();
 *
 * // Import from file
 * const result = await importManager.importFromFile(file, {
 *   addWorkspace: (workspace) => myWorkspaces.push(workspace),
 *   saveWorkspaceData: (id, data) => saveData(id, data),
 * });
 *
 * // Validate before importing
 * const isValid = await importManager.validateFile(file);
 * ```
 */
export class ImportManager<W = Record<string, unknown>, T = Record<string, unknown>> {
  /**
   * Import a workspace from a File object
   */
  async importFromFile(
    file: File,
    options: ImportOptions & {
      addWorkspace: (workspace: W) => void;
      saveWorkspaceData: (workspaceId: string, data: WorkspaceData<T>) => void;
    }
  ): Promise<ImportResult<W>> {
    const content = await this.readFile(file);
    const data = JSON.parse(content) as WorkspaceExport<T, W>;

    return this.importFromData(data, options);
  }

  /**
   * Import a workspace from parsed export data
   */
  async importFromData(
    exportData: WorkspaceExport<T, W>,
    options: ImportOptions & {
      addWorkspace: (workspace: W) => void;
      saveWorkspaceData: (workspaceId: string, data: WorkspaceData<T>) => void;
    }
  ): Promise<ImportResult<W>> {
    const { addWorkspace, saveWorkspaceData, validateChecksum = true, merge, newName } = options;

    // Validate the export
    if (validateChecksum) {
      (exportManager.validateExport as (data: WorkspaceExport<T, W>) => boolean)(exportData);
    }

    // Check if workspace already exists (app should provide this logic)
    const existingWorkspaces = this.getLocalWorkspaces(addWorkspace);
    const existing = existingWorkspaces.find(
      (ws) => (ws as Record<string, unknown>).id === (exportData.workspace as Record<string, unknown>).id
    );

    if (existing) {
      if (merge) {
        return this.mergeWorkspaceData(existing, exportData, addWorkspace, saveWorkspaceData);
      } else {
        const workspaceName = (exportData.workspace as Record<string, unknown>).name as string;
        throw new Error(
          `Workspace "${workspaceName}" already exists. Use merge option to combine.`
        );
      }
    }

    // Import as new workspace
    const newWorkspace = this.createWorkspaceFromExport(exportData, newName);

    addWorkspace(newWorkspace);
    saveWorkspaceData((newWorkspace as Record<string, unknown>).id as string, exportData.data);

    return {
      workspace: newWorkspace,
      wasMerged: false,
      itemCount: exportData.metadata.itemCount,
    };
  }

  /**
   * Import multiple workspaces from a multi-workspace export file
   */
  async importMultipleFromFile(
    file: File,
    options: ImportOptions & {
      addWorkspace: (workspace: W) => void;
      saveWorkspaceData: (workspaceId: string, data: WorkspaceData<T>) => void;
    }
  ): Promise<ImportResult<W>[]> {
    const content = await this.readFile(file);
    const data = JSON.parse(content);

    if (data.type === 'multi-workspace') {
      if (!data.workspaces) {
        throw new Error('Invalid multi-workspace export: missing workspaces array');
      }
      const results: ImportResult<W>[] = [];

      for (const exportData of data.workspaces) {
        try {
          const result = await this.importFromData(exportData, options);
          results.push(result);
        } catch (error) {
          console.error(`Failed to import workspace:`, error);
        }
      }

      return results;
    } else {
      // Single workspace export
      const result = await this.importFromData(data, options);
      return [result];
    }
  }

  /**
   * Read a file as text
   */
  private async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Get all local workspaces
   *
   * This is a placeholder - apps should implement their own workspace storage logic.
   * The addWorkspace function is used as a proxy to check if workspaces exist.
   */
  private getLocalWorkspaces(addWorkspace: (workspace: W) => void): W[] {
    // This is a simplified implementation
    // In a real app, you'd have a proper workspace store
    return [];
  }

  /**
   * Create a new workspace from export data
   */
  private createWorkspaceFromExport(
    exportData: WorkspaceExport<T, W>,
    newName?: string
  ): W {
    const baseWorkspace = exportData.workspace as Record<string, unknown>;
    return {
      ...baseWorkspace,
      id: `imported_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      name: newName || `${baseWorkspace.name as string} (Imported)`,
    } as W;
  }

  /**
   * Merge workspace data
   */
  private mergeWorkspaceData(
    existing: W,
    importData: WorkspaceExport<T, W>,
    addWorkspace: (workspace: W) => void,
    saveWorkspaceData: (workspaceId: string, data: WorkspaceData<T>) => void
  ): ImportResult<W> {
    const existingId = (existing as Record<string, unknown>).id as string;
    const dataKey = getWorkspaceDataKey(existingId);
    const existingDataStr = localStorage.getItem(dataKey);

    // Parse existing data
    let existingData: WorkspaceData<T> = {
      workspaceId: existingId,
      entities: {} as T,
      settings: {},
    };

    if (existingDataStr) {
      try {
        existingData = JSON.parse(existingDataStr) as WorkspaceData<T>;
      } catch (error) {
        console.error('Failed to parse existing workspace data:', error);
      }
    }

    // Merge entities (deep merge arrays by ID)
    const mergedEntities = this.mergeEntities(existingData.entities, importData.data.entities);

    // Merge settings
    const mergedSettings = {
      ...existingData.settings,
      ...importData.data.settings,
    };

    const mergedData: WorkspaceData<T> = {
      workspaceId: existingId,
      entities: mergedEntities,
      settings: mergedSettings,
    };

    // Save merged data
    saveWorkspaceData(existingId, mergedData);

    // Update workspace metadata
    const updatedWorkspace: W = {
      ...existing,
      updatedAt: new Date().toISOString(),
    } as W;

    addWorkspace(updatedWorkspace);

    // Count merged items
    const itemCount = this.countEntityItems(mergedEntities);

    return {
      workspace: updatedWorkspace,
      wasMerged: true,
      itemCount,
    };
  }

  /**
   * Merge entities from two workspace data objects
   *
   * Merges arrays by ID to avoid duplicates.
   */
  private mergeEntities(existing: T, imported: T): T {
    const merged = { ...existing };

    for (const key in imported) {
      const existingArray = (merged as Record<string, unknown>)[key];
      const importedArray = (imported as Record<string, unknown>)[key];

      if (Array.isArray(existingArray) && Array.isArray(importedArray)) {
        // Merge arrays by ID
        (merged as Record<string, unknown>)[key] = this.mergeArraysById(
          existingArray,
          importedArray
        );
      } else if (importedArray !== undefined) {
        // No existing array, use imported
        (merged as Record<string, unknown>)[key] = importedArray;
      }
    }

    return merged;
  }

  /**
   * Merge two arrays avoiding duplicates by ID
   */
  private mergeArraysById(existing: unknown[], imported: unknown[]): unknown[] {
    const map = new Map<string, unknown>();

    // Add existing items
    for (const item of existing) {
      if (item && typeof item === 'object' && 'id' in item) {
        const id = String((item as Record<string, unknown>).id);
        map.set(id, item);
      }
    }

    // Add imported items (will overwrite existing with same ID)
    for (const item of imported) {
      if (item && typeof item === 'object' && 'id' in item) {
        const id = String((item as Record<string, unknown>).id);
        if (!map.has(id)) {
          map.set(id, item);
        }
      }
    }

    return Array.from(map.values());
  }

  /**
   * Count items in entities object
   */
  private countEntityItems(entities: T): number {
    let count = 0;
    for (const key in entities) {
      const value = (entities as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        count += value.length;
      }
    }
    return count;
  }

  /**
   * Validate a file before importing
   */
  async validateFile(file: File): Promise<boolean> {
    const content = await this.readFile(file);
    const data = JSON.parse(content) as WorkspaceExport<T, W>;

    if (data.type === 'multi-workspace') {
      if (data.workspaces) {
        for (const exportData of data.workspaces) {
          (exportManager.validateExport as (d: WorkspaceExport<T, W>) => boolean)(exportData);
        }
      }
    } else {
      (exportManager.validateExport as (d: WorkspaceExport<T, W>) => boolean)(data);
    }

    return true;
  }

  /**
   * Get a preview of import data without importing
   */
  async previewImport(file: File): Promise<{
    type: 'single' | 'multi';
    workspaceCount: number;
    workspaces: Array<{ name: string; itemCount: number }>;
  }> {
    const content = await this.readFile(file);
    const data = JSON.parse(content);

    if (data.type === 'multi-workspace') {
      return {
        type: 'multi',
        workspaceCount: data.workspaces?.length || 0,
        workspaces: (data.workspaces || []).map((w: WorkspaceExport<T, W>) => ({
          name: (w.workspace as Record<string, unknown>).name as string,
          itemCount: w.metadata.itemCount,
        })),
      };
    } else {
      return {
        type: 'single',
        workspaceCount: 1,
        workspaces: [
          {
            name: (data.workspace as Record<string, unknown>).name as string,
            itemCount: data.metadata.itemCount,
          },
        ],
      };
    }
  }
}

/**
 * Default singleton instance of ImportManager
 */
export const importManager = new ImportManager();
