import { W as WorkspaceData, b as WorkspaceExport } from '../types-B56Eq8pd.js';

/**
 * @oxlayer/capabilities-state/export
 *
 * Workspace export manager for .oxlayer file format.
 *
 * Generic export manager that works with any workspace type.
 */

/**
 * Workspace version for export format compatibility
 */
declare const WORKSPACE_EXPORT_VERSION = "1.0.0";
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
declare class ExportManager<W = Record<string, unknown>, T = Record<string, unknown>> {
    /**
     * Export a workspace to the WorkspaceExport format
     *
     * @param workspaceId - The workspace ID to export
     * @param getWorkspace - Function to get the workspace object
     * @param getWorkspaceData - Optional function to get workspace data
     * @returns The workspace export data
     */
    exportWorkspace(workspaceId: string, options: {
        getWorkspace: (id: string) => W | undefined;
        getWorkspaceData?: (id: string) => WorkspaceData<T> | undefined;
    }): Promise<WorkspaceExport<T, W>>;
    /**
     * Download a workspace export as a .oxlayer file
     *
     * @param workspaceId - The workspace ID to export
     * @param getWorkspace - Function to get the workspace object
     * @param filename - Optional custom filename
     */
    downloadExport(workspaceId: string, options: {
        getWorkspace: (id: string) => W | undefined;
        getWorkspaceData?: (id: string) => WorkspaceData<T> | undefined;
        filename?: string;
    }): Promise<void>;
    /**
     * Calculate a simple checksum for data integrity
     */
    private calculateChecksum;
    /**
     * Count items in entities object
     *
     * Sums the length of all arrays in the entities object.
     */
    private countEntityItems;
    /**
     * Validate a workspace export
     *
     * @param exportData - The export data to validate
     * @returns True if valid, throws error if invalid
     */
    validateExport(exportData: WorkspaceExport<T, W>): boolean;
    /**
     * Export multiple workspaces to a single file
     *
     * @param workspaceIds - Array of workspace IDs to export
     * @param getWorkspace - Function to get workspace objects
     * @param getWorkspaceData - Optional function to get workspace data
     * @returns Array of workspace exports
     */
    exportMultipleWorkspaces(workspaceIds: string[], options: {
        getWorkspace: (id: string) => W | undefined;
        getWorkspaceData?: (id: string) => WorkspaceData<T> | undefined;
    }): Promise<WorkspaceExport<T, W>[]>;
    /**
     * Download multiple workspaces as a single .oxlayer file
     *
     * @param workspaceIds - Array of workspace IDs to export
     * @param getWorkspace - Function to get workspace objects
     * @param getWorkspaceData - Optional function to get workspace data
     * @param filename - Optional custom filename
     */
    downloadMultipleExports(workspaceIds: string[], options: {
        getWorkspace: (id: string) => W | undefined;
        getWorkspaceData?: (id: string) => WorkspaceData<T> | undefined;
        filename?: string;
    }): Promise<void>;
}
/**
 * Default singleton instance of ExportManager
 */
declare const exportManager: ExportManager<Record<string, unknown>, Record<string, unknown>>;

/**
 * @oxlayer/capabilities-state/export
 *
 * Workspace import manager for .oxlayer files.
 *
 * Generic import manager that works with any workspace type.
 */

/**
 * Import options
 */
interface ImportOptions {
    merge?: boolean;
    newName?: string;
    validateChecksum?: boolean;
}
/**
 * Import result
 *
 * @template W - The workspace type (apps define their own)
 */
interface ImportResult<W = Record<string, unknown>> {
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
declare class ImportManager<W = Record<string, unknown>, T = Record<string, unknown>> {
    /**
     * Import a workspace from a File object
     */
    importFromFile(file: File, options: ImportOptions & {
        addWorkspace: (workspace: W) => void;
        saveWorkspaceData: (workspaceId: string, data: WorkspaceData<T>) => void;
    }): Promise<ImportResult<W>>;
    /**
     * Import a workspace from parsed export data
     */
    importFromData(exportData: WorkspaceExport<T, W>, options: ImportOptions & {
        addWorkspace: (workspace: W) => void;
        saveWorkspaceData: (workspaceId: string, data: WorkspaceData<T>) => void;
    }): Promise<ImportResult<W>>;
    /**
     * Import multiple workspaces from a multi-workspace export file
     */
    importMultipleFromFile(file: File, options: ImportOptions & {
        addWorkspace: (workspace: W) => void;
        saveWorkspaceData: (workspaceId: string, data: WorkspaceData<T>) => void;
    }): Promise<ImportResult<W>[]>;
    /**
     * Read a file as text
     */
    private readFile;
    /**
     * Get all local workspaces
     *
     * This is a placeholder - apps should implement their own workspace storage logic.
     * The addWorkspace function is used as a proxy to check if workspaces exist.
     */
    private getLocalWorkspaces;
    /**
     * Create a new workspace from export data
     */
    private createWorkspaceFromExport;
    /**
     * Merge workspace data
     */
    private mergeWorkspaceData;
    /**
     * Merge entities from two workspace data objects
     *
     * Merges arrays by ID to avoid duplicates.
     */
    private mergeEntities;
    /**
     * Merge two arrays avoiding duplicates by ID
     */
    private mergeArraysById;
    /**
     * Count items in entities object
     */
    private countEntityItems;
    /**
     * Validate a file before importing
     */
    validateFile(file: File): Promise<boolean>;
    /**
     * Get a preview of import data without importing
     */
    previewImport(file: File): Promise<{
        type: 'single' | 'multi';
        workspaceCount: number;
        workspaces: Array<{
            name: string;
            itemCount: number;
        }>;
    }>;
}
/**
 * Default singleton instance of ImportManager
 */
declare const importManager: ImportManager<Record<string, unknown>, Record<string, unknown>>;

export { ExportManager, ImportManager, type ImportOptions, type ImportResult, WORKSPACE_EXPORT_VERSION, WorkspaceExport, exportManager, importManager };
