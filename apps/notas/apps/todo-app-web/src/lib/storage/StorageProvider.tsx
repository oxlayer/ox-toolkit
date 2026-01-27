/**
 * StorageProvider
 *
 * Provides ModuleStorage and OfflineManager to the app.
 * Automatically switches between anonymous and authenticated modes
 * based on authentication state and workspace type.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { getModuleStorage, resetModuleStorage, exportUtils } from './module-storage';
import { getOfflineManager, resetOfflineManager } from './offline-manager';
import type { ModuleStorage, StorageMode } from './module-storage';

// ============================================================================
// CONTEXT
// ============================================================================

interface StorageContextValue {
    storage: ModuleStorage | null;
    mode: StorageMode;
    isReady: boolean;
    export: () => Promise<void>;
    import: (file: File) => Promise<void>;
    pinModule: (key: string) => Promise<void>;
    unpinModule: (key: string) => Promise<void>;
    accessModule: (key: string) => Promise<void>;
    getOfflineModules: () => Promise<string[]>;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function useStorage(): StorageContextValue {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error('useStorage must be used within StorageProvider');
    }
    return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface StorageProviderProps {
    children: React.ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
    const { isAuthenticated } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const [storage, setStorage] = useState<ModuleStorage | null>(null);
    const [mode, setMode] = useState<StorageMode>('anonymous');
    const [isReady, setIsReady] = useState(false);

    // Initialize storage when workspace changes
    useEffect(() => {
        if (!currentWorkspace) {
            setStorage(null);
            setIsReady(false);
            return;
        }

        const initStorage = async () => {
            try {
                const newStorage = await getModuleStorage(
                    currentWorkspace.id,
                    isAuthenticated,
                    currentWorkspace
                );
                setStorage(newStorage);
                setMode(newStorage.getMode());
                setIsReady(true);

                // Start offline manager if authenticated
                const manager = getOfflineManager(newStorage);
                if (newStorage.getMode() === 'authenticated') {
                    manager.start();
                }

                console.log('[StorageProvider] Storage initialized:', {
                    workspaceId: currentWorkspace.id,
                    mode: newStorage.getMode(),
                });
            } catch (error) {
                console.error('[StorageProvider] Failed to initialize storage:', error);
                setIsReady(false);
            }
        };

        initStorage();

        return () => {
            resetModuleStorage();
            resetOfflineManager();
        };
    }, [currentWorkspace?.id, isAuthenticated]);

    // Export function
    const exportData = async () => {
        if (!storage || !currentWorkspace) {
            throw new Error('No storage available');
        }
        await exportUtils.downloadExport(currentWorkspace.id, storage);
    };

    // Import function
    const importData = async (file: File) => {
        if (!storage) {
            throw new Error('No storage available');
        }
        await exportUtils.importFromFile(file, storage);
    };

    // Pin module (authenticated mode only)
    const pinModule = async (key: string) => {
        if (mode !== 'authenticated') {
            console.warn('[StorageProvider] Pin only available in authenticated mode');
            return;
        }
        if (!storage) return;
        const manager = getOfflineManager(storage);
        await manager.pin(key);
    };

    // Unpin module (authenticated mode only)
    const unpinModule = async (key: string) => {
        if (mode !== 'authenticated') {
            console.warn('[StorageProvider] Unpin only available in authenticated mode');
            return;
        }
        if (!storage) return;
        const manager = getOfflineManager(storage);
        await manager.unpin(key);
    };

    // Access module (updates LRU)
    const accessModule = async (key: string) => {
        if (mode !== 'authenticated') return;
        if (!storage) return;
        const manager = getOfflineManager(storage);
        await manager.access(key);
    };

    // Get offline modules
    const getOfflineModules = async (): Promise<string[]> => {
        if (!storage) return [];
        const manager = getOfflineManager(storage);
        return await manager.getOfflineModules();
    };

    const value: StorageContextValue = {
        storage,
        mode,
        isReady,
        export: exportData,
        import: importData,
        pinModule,
        unpinModule,
        accessModule,
        getOfflineModules,
    };

    return (
        <StorageContext.Provider value={value}>
            {children}
        </StorageContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for module operations
 */
export function useModuleStorage() {
    const { storage, mode, isReady } = useStorage();

    return {
        storage,
        mode,
        isReady,
        get: (key: string) => storage?.get(key),
        set: (key: string, value: unknown) => storage?.set(key, value),
        remove: (key: string) => storage?.remove(key),
        listKeys: () => storage?.listKeys(),
    };
}

/**
 * Hook for offline management
 */
export function useOfflineManager() {
    const { pinModule, unpinModule, accessModule, getOfflineModules, mode } = useStorage();

    return {
        pinModule,
        unpinModule,
        accessModule,
        getOfflineModules,
        isAvailable: mode === 'authenticated',
    };
}

/**
 * Hook for export/import
 */
export function useDataPortability() {
    const { export: exportData, import: importData, mode } = useStorage();

    return {
        export: exportData,
        import: importData,
        // Export/import always available, but behavior differs by mode
        mode,
    };
}
