import { init_workspace_data_store, getWorkspaceDataKey } from './chunk-NWWUMRVU.js';
import { __export, __esm } from './chunk-4CV4JOE5.js';

// src/export/export-manager.ts
var export_manager_exports = {};
__export(export_manager_exports, {
  ExportManager: () => ExportManager,
  WORKSPACE_EXPORT_VERSION: () => WORKSPACE_EXPORT_VERSION,
  exportManager: () => exportManager
});
var WORKSPACE_EXPORT_VERSION, SUPPORTED_VERSIONS, ExportManager, exportManager;
var init_export_manager = __esm({
  "src/export/export-manager.ts"() {
    init_workspace_data_store();
    WORKSPACE_EXPORT_VERSION = "1.0.0";
    SUPPORTED_VERSIONS = ["1.0.0"];
    ExportManager = class {
      /**
       * Export a workspace to the WorkspaceExport format
       *
       * @param workspaceId - The workspace ID to export
       * @param getWorkspace - Function to get the workspace object
       * @param getWorkspaceData - Optional function to get workspace data
       * @returns The workspace export data
       */
      async exportWorkspace(workspaceId, options) {
        const { getWorkspace, getWorkspaceData } = options;
        const workspace = getWorkspace(workspaceId);
        if (!workspace) {
          throw new Error(`Workspace ${workspaceId} not found`);
        }
        let data;
        if (getWorkspaceData) {
          data = getWorkspaceData(workspaceId);
        } else {
          const dataKey = getWorkspaceDataKey(workspaceId);
          const dataStr = localStorage.getItem(dataKey);
          if (dataStr) {
            try {
              data = JSON.parse(dataStr);
            } catch (error) {
              console.error("Failed to parse workspace data:", error);
            }
          }
        }
        if (!data) {
          data = {
            workspaceId,
            entities: {},
            settings: {}
          };
        }
        const itemCount = this.countEntityItems(data.entities);
        return {
          version: WORKSPACE_EXPORT_VERSION,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          workspace,
          data,
          metadata: {
            exportType: "full",
            itemCount,
            checksum: this.calculateChecksum(JSON.stringify(data))
          }
        };
      }
      /**
       * Download a workspace export as a .oxlayer file
       *
       * @param workspaceId - The workspace ID to export
       * @param getWorkspace - Function to get the workspace object
       * @param filename - Optional custom filename
       */
      async downloadExport(workspaceId, options) {
        const { getWorkspace, getWorkspaceData, filename } = options;
        const exportData = await this.exportWorkspace(workspaceId, { getWorkspace, getWorkspaceData });
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const workspaceName = exportData.workspace.name || workspaceId;
        const defaultFilename = `${workspaceName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}.oxlayer`;
        const finalFilename = filename || defaultFilename;
        const a = document.createElement("a");
        a.href = url;
        a.download = finalFilename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      /**
       * Calculate a simple checksum for data integrity
       */
      calculateChecksum(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
          const char = data.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      }
      /**
       * Count items in entities object
       *
       * Sums the length of all arrays in the entities object.
       */
      countEntityItems(entities) {
        let count = 0;
        for (const key in entities) {
          const value = entities[key];
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
      validateExport(exportData) {
        if (!exportData.version) {
          throw new Error("Export data is missing version");
        }
        if (!SUPPORTED_VERSIONS.includes(exportData.version)) {
          throw new Error(
            `Unsupported export version: ${exportData.version}. Supported versions: ${SUPPORTED_VERSIONS.join(", ")}`
          );
        }
        if (!exportData.exportedAt) {
          throw new Error("Export data is missing exportedAt timestamp");
        }
        if (!exportData.workspace) {
          throw new Error("Export data is missing workspace");
        }
        if (!exportData.data) {
          throw new Error("Export data is missing workspace data");
        }
        if (!exportData.metadata) {
          throw new Error("Export data is missing metadata");
        }
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
      async exportMultipleWorkspaces(workspaceIds, options) {
        const { getWorkspace, getWorkspaceData } = options;
        const exports$1 = [];
        for (const workspaceId of workspaceIds) {
          try {
            const exportData = await this.exportWorkspace(workspaceId, { getWorkspace, getWorkspaceData });
            exports$1.push(exportData);
          } catch (error) {
            console.error(`Failed to export workspace ${workspaceId}:`, error);
          }
        }
        return exports$1;
      }
      /**
       * Download multiple workspaces as a single .oxlayer file
       *
       * @param workspaceIds - Array of workspace IDs to export
       * @param getWorkspace - Function to get workspace objects
       * @param getWorkspaceData - Optional function to get workspace data
       * @param filename - Optional custom filename
       */
      async downloadMultipleExports(workspaceIds, options) {
        const { getWorkspace, getWorkspaceData, filename } = options;
        const exports$1 = await this.exportMultipleWorkspaces(workspaceIds, { getWorkspace, getWorkspaceData });
        const multiExport = {
          version: WORKSPACE_EXPORT_VERSION,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          type: "multi-workspace",
          workspaces: exports$1
        };
        const blob = new Blob([JSON.stringify(multiExport, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const defaultFilename = `oxlayer_workspaces_${Date.now()}.oxlayer`;
        const finalFilename = filename || defaultFilename;
        const a = document.createElement("a");
        a.href = url;
        a.download = finalFilename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };
    exportManager = new ExportManager();
  }
});

// src/export/import-manager.ts
var import_manager_exports = {};
__export(import_manager_exports, {
  ImportManager: () => ImportManager,
  importManager: () => importManager
});
var ImportManager, importManager;
var init_import_manager = __esm({
  "src/export/import-manager.ts"() {
    init_workspace_data_store();
    init_export_manager();
    ImportManager = class {
      /**
       * Import a workspace from a File object
       */
      async importFromFile(file, options) {
        const content = await this.readFile(file);
        const data = JSON.parse(content);
        return this.importFromData(data, options);
      }
      /**
       * Import a workspace from parsed export data
       */
      async importFromData(exportData, options) {
        const { addWorkspace, saveWorkspaceData, validateChecksum = true, merge, newName } = options;
        if (validateChecksum) {
          exportManager.validateExport(exportData);
        }
        const existingWorkspaces = this.getLocalWorkspaces(addWorkspace);
        const existing = existingWorkspaces.find(
          (ws) => ws.id === exportData.workspace.id
        );
        if (existing) {
          if (merge) {
            return this.mergeWorkspaceData(existing, exportData, addWorkspace, saveWorkspaceData);
          } else {
            const workspaceName = exportData.workspace.name;
            throw new Error(
              `Workspace "${workspaceName}" already exists. Use merge option to combine.`
            );
          }
        }
        const newWorkspace = this.createWorkspaceFromExport(exportData, newName);
        addWorkspace(newWorkspace);
        saveWorkspaceData(newWorkspace.id, exportData.data);
        return {
          workspace: newWorkspace,
          wasMerged: false,
          itemCount: exportData.metadata.itemCount
        };
      }
      /**
       * Import multiple workspaces from a multi-workspace export file
       */
      async importMultipleFromFile(file, options) {
        const content = await this.readFile(file);
        const data = JSON.parse(content);
        if (data.type === "multi-workspace") {
          if (!data.workspaces) {
            throw new Error("Invalid multi-workspace export: missing workspaces array");
          }
          const results = [];
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
          const result = await this.importFromData(data, options);
          return [result];
        }
      }
      /**
       * Read a file as text
       */
      async readFile(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result);
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.onerror = () => {
            reject(new Error("Failed to read file"));
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
      getLocalWorkspaces(addWorkspace) {
        return [];
      }
      /**
       * Create a new workspace from export data
       */
      createWorkspaceFromExport(exportData, newName) {
        const baseWorkspace = exportData.workspace;
        return {
          ...baseWorkspace,
          id: `imported_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          name: newName || `${baseWorkspace.name} (Imported)`
        };
      }
      /**
       * Merge workspace data
       */
      mergeWorkspaceData(existing, importData, addWorkspace, saveWorkspaceData) {
        const existingId = existing.id;
        const dataKey = getWorkspaceDataKey(existingId);
        const existingDataStr = localStorage.getItem(dataKey);
        let existingData = {
          workspaceId: existingId,
          entities: {},
          settings: {}
        };
        if (existingDataStr) {
          try {
            existingData = JSON.parse(existingDataStr);
          } catch (error) {
            console.error("Failed to parse existing workspace data:", error);
          }
        }
        const mergedEntities = this.mergeEntities(existingData.entities, importData.data.entities);
        const mergedSettings = {
          ...existingData.settings,
          ...importData.data.settings
        };
        const mergedData = {
          workspaceId: existingId,
          entities: mergedEntities,
          settings: mergedSettings
        };
        saveWorkspaceData(existingId, mergedData);
        const updatedWorkspace = {
          ...existing,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        addWorkspace(updatedWorkspace);
        const itemCount = this.countEntityItems(mergedEntities);
        return {
          workspace: updatedWorkspace,
          wasMerged: true,
          itemCount
        };
      }
      /**
       * Merge entities from two workspace data objects
       *
       * Merges arrays by ID to avoid duplicates.
       */
      mergeEntities(existing, imported) {
        const merged = { ...existing };
        for (const key in imported) {
          const existingArray = merged[key];
          const importedArray = imported[key];
          if (Array.isArray(existingArray) && Array.isArray(importedArray)) {
            merged[key] = this.mergeArraysById(
              existingArray,
              importedArray
            );
          } else if (importedArray !== void 0) {
            merged[key] = importedArray;
          }
        }
        return merged;
      }
      /**
       * Merge two arrays avoiding duplicates by ID
       */
      mergeArraysById(existing, imported) {
        const map = /* @__PURE__ */ new Map();
        for (const item of existing) {
          if (item && typeof item === "object" && "id" in item) {
            const id = String(item.id);
            map.set(id, item);
          }
        }
        for (const item of imported) {
          if (item && typeof item === "object" && "id" in item) {
            const id = String(item.id);
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
      countEntityItems(entities) {
        let count = 0;
        for (const key in entities) {
          const value = entities[key];
          if (Array.isArray(value)) {
            count += value.length;
          }
        }
        return count;
      }
      /**
       * Validate a file before importing
       */
      async validateFile(file) {
        const content = await this.readFile(file);
        const data = JSON.parse(content);
        if (data.type === "multi-workspace") {
          if (data.workspaces) {
            for (const exportData of data.workspaces) {
              exportManager.validateExport(exportData);
            }
          }
        } else {
          exportManager.validateExport(data);
        }
        return true;
      }
      /**
       * Get a preview of import data without importing
       */
      async previewImport(file) {
        const content = await this.readFile(file);
        const data = JSON.parse(content);
        if (data.type === "multi-workspace") {
          return {
            type: "multi",
            workspaceCount: data.workspaces?.length || 0,
            workspaces: (data.workspaces || []).map((w) => ({
              name: w.workspace.name,
              itemCount: w.metadata.itemCount
            }))
          };
        } else {
          return {
            type: "single",
            workspaceCount: 1,
            workspaces: [
              {
                name: data.workspace.name,
                itemCount: data.metadata.itemCount
              }
            ]
          };
        }
      }
    };
    importManager = new ImportManager();
  }
});

export { ExportManager, ImportManager, WORKSPACE_EXPORT_VERSION, exportManager, export_manager_exports, importManager, import_manager_exports, init_export_manager, init_import_manager };
//# sourceMappingURL=chunk-I6NE2WTI.js.map
//# sourceMappingURL=chunk-I6NE2WTI.js.map