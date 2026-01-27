import { __esm } from './chunk-4CV4JOE5.js';
import { observable, syncState } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';

function getWorkspaceDataKey(workspaceId) {
  return `${WORKSPACE_DATA_PREFIX}${workspaceId}`;
}
function createWorkspaceDataStore(workspaceId, options) {
  const { initialEntities, isAuthenticated = false, getRemoteData, setRemoteData } = options;
  const store$ = observable(
    synced({
      initial: {
        workspaceId,
        entities: initialEntities,
        settings: {}
      },
      persist: {
        name: getWorkspaceDataKey(workspaceId),
        plugin: ObservablePersistLocalStorage,
        retrySync: true
      },
      // Conditional sync: only sync to server if authenticated
      get: isAuthenticated && getRemoteData ? async () => {
        try {
          const remoteData = await getRemoteData();
          return remoteData || {
            workspaceId,
            entities: initialEntities,
            settings: {}
          };
        } catch (error) {
          console.error(`Failed to fetch workspace data for ${workspaceId}:`, error);
          return void 0;
        }
      } : void 0,
      set: isAuthenticated && setRemoteData ? async (params) => {
        if (!params.value) return;
        try {
          await setRemoteData(params.value);
        } catch (error) {
          console.error(`Failed to sync workspace data for ${workspaceId}:`, error);
          throw error;
        }
      } : void 0
    })
  );
  workspaceDataStores.set(workspaceId, store$);
  return store$;
}
function getWorkspaceDataStore(workspaceId, options) {
  if (!workspaceDataStores.has(workspaceId)) {
    if (!options?.initialEntities) {
      throw new Error(`Workspace data store for ${workspaceId} does not exist. Provide initialEntities to create it.`);
    }
    return createWorkspaceDataStore(workspaceId, options);
  }
  return workspaceDataStores.get(workspaceId);
}
function deleteWorkspaceDataStore(workspaceId) {
  workspaceDataStores.delete(workspaceId);
  localStorage.removeItem(getWorkspaceDataKey(workspaceId));
}
function getWorkspaceDataSyncState(workspaceId) {
  const store = workspaceDataStores.get(workspaceId);
  if (!store) {
    return void 0;
  }
  return syncState(store);
}
function switchActiveWorkspaceData(workspaceId, options) {
  const dataStore = getWorkspaceDataStore(workspaceId, options);
  activeWorkspaceData$.set(dataStore.get() ?? null);
}
function hasWorkspaceDataStore(workspaceId) {
  return workspaceDataStores.has(workspaceId);
}
function getWorkspaceDataStoreIds() {
  return Array.from(workspaceDataStores.keys());
}
var workspaceDataStores, WORKSPACE_DATA_PREFIX, activeWorkspaceData$;
var init_workspace_data_store = __esm({
  "src/data/workspace-data-store.ts"() {
    workspaceDataStores = /* @__PURE__ */ new Map();
    WORKSPACE_DATA_PREFIX = "oxlayer_workspace_data_";
    activeWorkspaceData$ = observable(null);
  }
});

export { activeWorkspaceData$, createWorkspaceDataStore, deleteWorkspaceDataStore, getWorkspaceDataKey, getWorkspaceDataStore, getWorkspaceDataStoreIds, getWorkspaceDataSyncState, hasWorkspaceDataStore, init_workspace_data_store, switchActiveWorkspaceData };
//# sourceMappingURL=chunk-NWWUMRVU.js.map
//# sourceMappingURL=chunk-NWWUMRVU.js.map