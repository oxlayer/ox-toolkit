/**
 * @oxlayer/capabilities-state/export
 *
 * Workspace export manager for .oxlayer file format.
 *
 * Generic export manager that works with any workspace type.
 */

import type { WorkspaceData, WorkspaceExport } from '../types';
import { getWorkspaceDataKey } from '../data/workspace-data-store';

/**
 * Workspace version for export format compatibility
 */
export const WORKSPACE_EXPORT_VERSION = '1.0.0';

/**
 * Supported export versions
 */
const SUPPORTED_VERSIONS = ['1.0.0'];

/**
 * Export manager class
 *
 * Handles exporting workspaces to .oxlayer files.
 *
 * @template W - The workspace type (apps define their own)
 * @template T - The shape of the entities object
 *
 * @example
 * ```ts
 * import { ExportManager } from '@oxlayer/capabilities-state/export';
 *
 * const exportManager = new ExportManager();
 *
 * // Export a workspace
 * const exportData = await exportManager.exportWorkspace('workspace_id', {
 *   getWorkspace: (id) => myWorkspaces.find(w => w.id === id),
 *   getWorkspaceData: (id) => myDataStores.get(id)?.get(),
 * });
 *
 * // Download as file
 * await exportManager.downloadExport('workspace_id', {
 *   getWorkspace: (id) => myWorkspaces.find(w => w.id === id),
 * });
 * ```
 */
export class ExportManager<W = Record<string, unknown>, T = Record<string, unknown>> {
  /**
   * Export a workspace to the WorkspaceExport format
   *
   * @param workspaceId - The workspace ID to export
   * @param getWorkspace - Function to get the workspace object
   * @param getWorkspaceData - Optional function to get workspace data
   * @returns The workspace export data
   */
  async exportWorkspace(
    workspaceId: string,
    options: {
      getWorkspace: (id: string) => W | undefined;
      getWorkspaceData?: (id: string) => WorkspaceData<T> | undefined;
    }
  ): Promise<WorkspaceExport<T, W>> {
    const { getWorkspace, getWorkspaceData } = options;
    const workspace = getWorkspace(workspaceId);

    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    // Get workspace data from localStorage or provided function
    let data: WorkspaceData<T> | undefined;

    if (getWorkspaceData) {
      data = getWorkspaceData(workspaceId);
    } else {
      const dataKey = getWorkspaceDataKey(workspaceId);
      const dataStr = localStorage.getItem(dataKey);

      if (dataStr) {
        try {
          data = JSON.parse(dataStr) as WorkspaceData<T>;
        } catch (error) {
          console.error('Failed to parse workspace data:', error);
        }
      }
    }

    // If no data found, create empty structure
    if (!data) {
      data = {
        workspaceId,
        entities: {} as T,
        settings: {},
      } as WorkspaceData<T>;
    }

    // Count items (sum of all entity arrays)
    const itemCount = this.countEntityItems(data.entities);

    return {
      version: WORKSPACE_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      workspace,
      data,
      metadata: {
        exportType: 'full',
        itemCount,
        checksum: this.calculateChecksum(JSON.stringify(data)),
      },
    };
  }

  /**
   * Download a workspace export as a .oxlayer file
   *
   * @param workspaceId - The workspace ID to export
   * @param getWorkspace - Function to get the workspace object
   * @param filename - Optional custom filename
   */
  async downloadExport(
    workspaceId: string,
    options: {
      getWorkspace: (id: string) => W | undefined;
      getWorkspaceData?: (id: string) => WorkspaceData<T> | undefined;
      filename?: string;
    }
  ): Promise<void> {
    const { getWorkspace, getWorkspaceData, filename } = options;
    const exportData = await this.exportWorkspace(workspaceId, { getWorkspace, getWorkspaceData });
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    // Try to get a name from the workspace
    const workspaceName = (exportData.workspace as any).name || workspaceId;
    const defaultFilename = `${workspaceName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.oxlayer`;
    const finalFilename = filename || defaultFilename;

    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Calculate a simple checksum for data integrity
   */
  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Count items in entities object
   *
   * Sums the length of all arrays in the entities object.
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
   * Validate a workspace export
   *
   * @param exportData - The export data to validate
   * @returns True if valid, throws error if invalid
   */
  validateExport(exportData: WorkspaceExport<T, W>): boolean {
    // Check version
    if (!exportData.version) {
      throw new Error('Export data is missing version');
    }

    if (!SUPPORTED_VERSIONS.includes(exportData.version)) {
      throw new Error(
        `Unsupported export version: ${exportData.version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
      );
    }

    // Check required fields
    if (!exportData.exportedAt) {
      throw new Error('Export data is missing exportedAt timestamp');
    }

    if (!exportData.workspace) {
      throw new Error('Export data is missing workspace');
    }

    if (!exportData.data) {
      throw new Error('Export data is missing workspace data');
    }

    if (!exportData.metadata) {
      throw new Error('Export data is missing metadata');
    }

    // Validate checksum
    const dataStr = JSON.stringify(exportData.data);
    const calculatedChecksum = this.calculateChecksum(dataStr);

    if (calculatedChecksum !== exportData.metadata.checksum) {
      throw new Error(
        `Checksum mismatch. Data may be corrupted. Expected: ${exportData.metadata.checksum}, got: ${calculatedChecksum}`
      );
    }

    return true;
  }

  /**
   * Export multiple workspaces to a single file
   *
   * @param workspaceIds - Array of workspace IDs to export
   * @param getWorkspace - Function to get workspace objects
   * @param getWorkspaceData - Optional function to get workspace data
   * @returns Array of workspace exports
   */
  async exportMultipleWorkspaces(
    workspaceIds: string[],
    options: {
      getWorkspace: (id: string) => W | undefined;
      getWorkspaceData?: (id: string) => WorkspaceData<T> | undefined;
    }
  ): Promise<WorkspaceExport<T, W>[]> {
    const { getWorkspace, getWorkspaceData } = options;
    const exports: WorkspaceExport<T, W>[] = [];

    for (const workspaceId of workspaceIds) {
      try {
        const exportData = await this.exportWorkspace(workspaceId, { getWorkspace, getWorkspaceData });
        exports.push(exportData);
      } catch (error) {
        console.error(`Failed to export workspace ${workspaceId}:`, error);
      }
    }

    return exports;
  }

  /**
   * Download multiple workspaces as a single .oxlayer file
   *
   * @param workspaceIds - Array of workspace IDs to export
   * @param getWorkspace - Function to get workspace objects
   * @param getWorkspaceData - Optional function to get workspace data
   * @param filename - Optional custom filename
   */
  async downloadMultipleExports(
    workspaceIds: string[],
    options: {
      getWorkspace: (id: string) => W | undefined;
      getWorkspaceData?: (id: string) => WorkspaceData<T> | undefined;
      filename?: string;
    }
  ): Promise<void> {
    const { getWorkspace, getWorkspaceData, filename } = options;
    const exports = await this.exportMultipleWorkspaces(workspaceIds, { getWorkspace, getWorkspaceData });

    const multiExport = {
      version: WORKSPACE_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      type: 'multi-workspace' as const,
      workspaces: exports,
    };

    const blob = new Blob([JSON.stringify(multiExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const defaultFilename = `oxlayer_workspaces_${Date.now()}.oxlayer`;
    const finalFilename = filename || defaultFilename;

    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Default singleton instance of ExportManager
 */
export const exportManager = new ExportManager();
