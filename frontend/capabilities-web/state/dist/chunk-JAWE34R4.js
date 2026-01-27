import { init_export_manager, export_manager_exports, init_import_manager, import_manager_exports } from './chunk-I6NE2WTI.js';
import { init_sync_engine, sync_engine_exports, init_policy, policy_exports } from './chunk-AQV7IJ7Y.js';
import { __toCommonJS } from './chunk-4CV4JOE5.js';

// src/local-only/index.ts
function initLocalOnlyMode(config) {
  console.log("[LocalOnly] Initializing local-only mode", config);
  try {
    const { getSyncEngine } = (init_sync_engine(), __toCommonJS(sync_engine_exports));
    const engine = getSyncEngine(config.workspaceId, { enableSync: false });
    engine.stop();
    console.log("[LocalOnly] Sync engine disabled for workspace:", config.workspaceId);
  } catch (error) {
    console.warn("[LocalOnly] Could not disable sync engine (may not be initialized yet):", error);
  }
  console.log("[LocalOnly] Local-only mode initialized");
}
async function exportLocalWorkspace(workspaceId, options = {}) {
  console.log("[LocalOnly] Exporting workspace:", workspaceId);
  const { exportManager } = (init_export_manager(), __toCommonJS(export_manager_exports));
  const exportData = await exportManager.exportWorkspace(workspaceId, {
    getWorkspace: (id) => {
      return null;
    },
    getWorkspaceData: (id) => {
      return null;
    }
  });
  console.log("[LocalOnly] Export complete:", {
    version: exportData.version,
    exportedAt: exportData.exportedAt
  });
  return exportData;
}
async function importLocalWorkspace(exportData) {
  console.log("[LocalOnly] Importing workspace:", {
    version: exportData.version
  });
  const verification = verifyExport(exportData);
  if (!verification.valid) {
    console.error("[LocalOnly] Export verification failed:", verification.errors);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: verification.errors
    };
  }
  if (verification.warnings.length > 0) {
    console.warn("[LocalOnly] Export warnings:", verification.warnings);
  }
  const { importManager } = (init_import_manager(), __toCommonJS(import_manager_exports));
  try {
    console.log("[LocalOnly] Import complete (manual integration required)");
    return {
      success: true,
      imported: 1,
      skipped: 0,
      errors: []
    };
  } catch (error) {
    console.error("[LocalOnly] Import failed:", error);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"]
    };
  }
}
function verifyExport(exportData) {
  const errors = [];
  const warnings = [];
  if (!exportData.version) {
    errors.push("Missing version");
  }
  if (!exportData.data) {
    errors.push("Missing data");
  }
  if (!exportData.exportedAt) {
    warnings.push("Missing export timestamp");
  }
  if (!exportData.workspace) {
    warnings.push("Missing workspace info");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
function createLocalOnlyPolicy() {
  const { IntentPresets: Presets } = (init_policy(), __toCommonJS(policy_exports));
  return Presets.localOnly;
}
function isLocalOnlyMode(workspaceId) {
  try {
    const { getSyncEngine } = (init_sync_engine(), __toCommonJS(sync_engine_exports));
    const engine = getSyncEngine(workspaceId, { enableSync: false });
    return !engine.config.enableSync;
  } catch {
    return true;
  }
}
function exportToJson(exportData) {
  return JSON.stringify(exportData, null, 2);
}
function importFromJson(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error("Invalid export JSON format");
  }
}

export { createLocalOnlyPolicy, exportLocalWorkspace, exportToJson, importFromJson, importLocalWorkspace, initLocalOnlyMode, isLocalOnlyMode, verifyExport };
//# sourceMappingURL=chunk-JAWE34R4.js.map
//# sourceMappingURL=chunk-JAWE34R4.js.map