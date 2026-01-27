import { b as IntentPolicy } from '../policy-Dalc5U51.js';
import { b as WorkspaceExport } from '../types-B56Eq8pd.js';

/**
 * @oxlayer/capabilities-state/local-only
 *
 * Local-Only Mode (Air-Gapped Applications)
 *
 * This module provides first-class support for local-only applications that:
 * - Never sync to API
 * - Use export/import as sync mechanism
 * - Have deterministic, reproducible state
 * - Have no network attack surface
 *
 * Use cases:
 * - Security-sensitive apps
 * - Air-gapped environments
 * - Personal knowledge bases
 * - Encrypted local vaults
 * - Compliance-restricted software
 *
 * @example
 * ```ts
 * import { initLocalOnlyMode } from '@oxlayer/capabilities-state/local-only';
 *
 * // Initialize app in local-only mode
 * initLocalOnlyMode({
 *   workspaceId: 'local-workspace',
 * });
 *
 * // All writes are local-only
 * recordIntent(workspaceId, {
 *   domain: 'notes',
 *   type: 'create',
 *   entityId: 'note_1',
 *   payload: { title: 'My Note' },
 *   policy: IntentPresets.localOnly,
 * });
 *
 * // Export for backup/transfer
 * const exportData = await exportLocalWorkspace(workspaceId);
 *
 * // Import later (on another device, after reinstall, etc.)
 * await importLocalWorkspace(exportData);
 * ```
 */

/**
 * Local-only mode configuration
 */
interface LocalOnlyConfig {
    /** Workspace ID for local storage */
    workspaceId: string;
    /** Enable export functionality */
    allowExport?: boolean;
    /** Enable import functionality */
    allowImport?: boolean;
}
/**
 * Export options for local-only mode
 */
interface LocalExportOptions {
    /** Include app version metadata */
    includeVersion?: boolean;
}
/**
 * Import result
 */
interface LocalImportResult {
    success: boolean;
    imported: number;
    skipped: number;
    errors: string[];
}
/**
 * Initialize application in local-only mode
 *
 * This:
 * - Disables sync engine
 * - Sets default policy to local-only
 * - Enables export/import
 *
 * @param config - Local-only configuration
 */
declare function initLocalOnlyMode(config: LocalOnlyConfig): void;
/**
 * Export workspace state for backup/transfer
 *
 * In local-only mode, this replaces API sync as the synchronization mechanism.
 *
 * @param workspaceId - Workspace ID to export
 * @param options - Export options
 * @returns Export data that can be saved/transfered
 */
declare function exportLocalWorkspace(workspaceId: string, options?: LocalExportOptions): Promise<WorkspaceExport>;
/**
 * Import workspace state from export data
 *
 * This is the reconciliation mechanism for local-only apps.
 *
 * @param exportData - Export data to import
 * @returns Import result
 */
declare function importLocalWorkspace(exportData: WorkspaceExport): Promise<LocalImportResult>;
/**
 * Verify export data integrity
 *
 * @param exportData - Export data to verify
 * @returns Verification result
 */
declare function verifyExport(exportData: WorkspaceExport): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Create a local-only policy preset
 *
 * All intents in local-only mode should use this policy.
 */
declare function createLocalOnlyPolicy(): IntentPolicy;
/**
 * Check if app is in local-only mode
 *
 * @param workspaceId - Workspace ID to check
 * @returns true if local-only mode is enabled
 */
declare function isLocalOnlyMode(workspaceId: string): boolean;
/**
 * Convert export data to JSON string for storage
 *
 * @param exportData - Export data
 * @returns JSON string
 */
declare function exportToJson(exportData: WorkspaceExport): string;
/**
 * Parse export data from JSON string
 *
 * @param jsonString - JSON string
 * @returns Parsed export data
 */
declare function importFromJson(jsonString: string): WorkspaceExport;

export { type LocalExportOptions, type LocalImportResult, type LocalOnlyConfig, WorkspaceExport, createLocalOnlyPolicy, exportLocalWorkspace, exportToJson, importFromJson, importLocalWorkspace, initLocalOnlyMode, isLocalOnlyMode, verifyExport };
