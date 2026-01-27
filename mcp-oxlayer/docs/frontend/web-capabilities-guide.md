# OxLayer Web Capabilities Guide

Complete guide to `@oxlayer/capabilities-web-state` - local-first state management for web applications.

## Overview

**@oxlayer/capabilities-web-state** is a domain-agnostic, local-first state management library built on Legend-State. It provides an intent-first architecture with WhatsApp-like delivery states, conflict resolution, and multiple storage backends.

### Key Philosophy

> "UI reacts to intent, not to HTTP. HTTP is just one transport."

**Core Principles:**
- **Intent-First Architecture** - Business code declares intent + policy; OxLayer handles execution
- **Local-First** - Data persists locally first, syncs when online
- **Domain-Agnostic** - Works for todos, CRM, ERP, ecommerce, chat, etc.
- **Conflict Resolution** - Declarative policies for automatic resolution
- **Offline-First** - Works offline, syncs when available

## Installation

```bash
npm install @oxlayer/capabilities-web-state
```

### Peer Dependencies

- `legend-state` - State management
- `@legendapp/state` - Persist plugins
- `better-sqlite3` - SQLite WASM (optional)

## Package Structure

```
@oxlayer/capabilities-web-state
├── Intent System          # Intent-first architecture
├── Data Management        # Workspace data stores
├── Sync Management        # Server synchronization
├── Export/Import          # Data portability
├── Persistence
│   ├── SQLite WASM        # Production storage (OPFS)
│   ├── Offline Storage    # Multi-source fallback
│   └── Pure Storage        # Intent-native persistence
├── Workspace              # Workspace management
└── Local-Only             # Air-gapped mode
```

## Quick Start

```typescript
import {
  recordIntent,
  IntentPresets,
  getWorkspaceDataStore,
  registerApiAdapter,
} from '@oxlayer/capabilities-web-state';

// 1. Define your entity types
interface TodoEntities {
  todos: Todo[];
  projects: Project[];
}

// 2. Create workspace data store
const dataStore = getWorkspaceDataStore<TodoEntities>('workspace-id', {
  initialEntities: { todos: [], projects: [] },
  isAuthenticated: true,
  getRemoteData: async () => {
    const res = await fetch('/api/workspaces/workspace-id/data');
    return res.json();
  },
  setRemoteData: async (data) => {
    await fetch('/api/workspaces/workspace-id/data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
});

// 3. Register API adapter
registerApiAdapter('todo', 'task', {
  create: async (payload) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  update: async (id, payload) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  delete: async (id) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  },
});

// 4. Record intents (intent-first architecture)
function addTodo(title: string) {
  recordIntent('workspace-id', {
    domain: 'todo',
    type: 'create',
    entityType: 'task',
    entityId: `temp_${Date.now()}`,
    payload: { title, completed: false },
    policy: IntentPresets.optimistic,
  });
}
```

## Core Concepts

### 1. Intent-First Architecture

Instead of calling APIs directly, UI records **intents** that represent user actions. The system handles delivery, retries, and conflict resolution.

```typescript
// Traditional (blocks UI, doesn't work offline)
async function addTodo(title: string) {
  await fetch('/api/todos', { method: 'POST', body: JSON.stringify({ title }) });
}

// Intent-first (instant UI, works offline)
function addTodo(title: string) {
  recordIntent(workspaceId, {
    domain: 'todo',
    type: 'create',
    entityType: 'task',
    entityId: generateTempId(),
    payload: { title },
    policy: IntentPresets.optimistic,
  });
}
```

### 2. Delivery Status (WhatsApp-Like Ticks)

```typescript
type DeliveryStatus =
  | 'local'        // Created locally only
  | 'queued'       // Waiting to sync (offline)
  | 'sending'      // In-flight to server
  | 'acknowledged' // Server accepted
  | 'confirmed'    // Server processed
  | 'failed';      // Sync failed
```

### 3. Intent Policies

Declarative policies that define behavior:

```typescript
import { IntentPresets } from '@oxlayer/capabilities-web-state';

// WhatsApp-style messaging (offline-first, optimistic)
IntentPresets.optimistic

// Critical operations (API-first, must be online)
IntentPresets.critical

// Collaborative edits (manual conflict resolution)
IntentPresets.collaborative

// Local-only mode (never syncs)
IntentPresets.localOnly
```

## Storage Backends

### SQLite WASM (Recommended for Production)

```typescript
import { sqliteStorage, createSqliteWasmAdapter } from '@oxlayer/capabilities-web-state/persist/sqlite-wasm';

// Initialize SQLite WASM with OPFS
await sqliteStorage.init({
  filename: 'file:my-app-db?vfs=opfs', // OPFS for persistence
  debug: false,
});

// Use with Legend-State
const adapter = createSqliteWasmAdapter();
observablePersist(state$, {
  persist: adapter,
  local: 'my-app-state',
});
```

**Features:**
- OPFS-based persistence (survives browser restart)
- Worker-based architecture (non-blocking)
- Multi-tab support via SharedWorker

### Offline Storage (Multi-Source Strategy)

```typescript
import { getOfflineStorage } from '@oxlayer/capabilities-web-state/persist/offline-storage';

const storage = getOfflineStorage({
  sqlite: sqliteStorage,
  localStorageFallbackDelay: 10,
});

// Read with SQLite-first hierarchy
const result = await storage.getItem('my-key');
// result.data, result.source, result.version

// Write with multi-source persistence
await storage.setItem('my-key', { data: 'value' });
```

### localStorage (Simple/Fallback)

```typescript
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';

const state$ = observable(synced({
  initial: { data: 'value' },
  persist: {
    name: 'my-app-state',
    plugin: ObservablePersistLocalStorage,
  },
}));
```

## Sync Management

### Authenticated Mode

```typescript
import { isAuthenticated$, initializeSync, syncManager } from '@oxlayer/capabilities-web-state/sync';

// Initialize sync with auth state
initializeSync({
  getIsAuthenticated: () => !!localStorage.getItem('token'),
  onLogin: () => syncManager.syncAll(),
  onLogout: () => syncManager.disable(),
});

// Configure sync
syncManager.configure({
  autoSync: true,
  syncInterval: 60000,  // 60 seconds
  conflictResolution: 'latest', // 'local' | 'server' | 'latest'
});
```

### Local-Only Mode (Air-Gapped)

```typescript
import {
  initLocalOnlyMode,
  exportLocalWorkspace,
  importLocalWorkspace
} from '@oxlayer/capabilities-web-state/local-only';

// Initialize in local-only mode
initLocalOnlyMode({
  workspaceId: 'local-workspace',
  allowExport: true,
  allowImport: true,
});

// All writes are local-only
recordIntent(workspaceId, {
  domain: 'notes',
  type: 'create',
  entityType: 'note',
  payload: { title: 'My Note' },
  policy: IntentPresets.localOnly,
});
```

## Workspace Management

```typescript
import { WorkspaceManager } from '@oxlayer/capabilities-web-state/workspace';

const manager = new WorkspaceManager();

// Create workspace
manager.create({
  name: 'My Tasks',
  type: 'personal',
  ownerId: 'user_123',
  icon: '📋',
  color: '#3B82F6',
});

// Switch workspace
manager.switchTo('workspace_id');

// Get all workspaces
const all = manager.getAll();
```

## Export/Import

```typescript
import { exportManager, importManager } from '@oxlayer/capabilities-web-state/export';

// Export workspace
await exportManager.downloadExport('workspace_id', {
  getWorkspace: (id) => myWorkspaces.find(w => w.id === id),
});

// Import workspace
const result = await importManager.importFromJson(exportData, {
  conflictStrategy: 'merge',
});
```

## API Reference

### Intent System

```typescript
recordIntent<T, P>(workspaceId: string, intent: Omit<UserIntent<T, P>, 'id' | 'createdAt'>): void

recordIntentSimple<T>(workspaceId: string, domain: string, type: 'create' | 'update' | 'delete', entityType: string, payload: T): void

updateIntentStatus(workspaceId: string, intentId: string, status: DeliveryStatus): void

getPendingIntents<T>(workspaceId: string): UserIntent<T>[]

getFailedIntents<T>(workspaceId: string): UserIntent<T>[]
```

### Data Store

```typescript
createWorkspaceDataStore<T>(workspaceId: string, options: {
  initialEntities: T;
  isAuthenticated?: boolean;
  getRemoteData?: () => Promise<WorkspaceData<T>>;
  setRemoteData?: (data: WorkspaceData<T>) => Promise<void>;
}): WorkspaceDataStore<T>

getWorkspaceDataStore<T>(workspaceId: string, options?: { initialEntities: T }): WorkspaceDataStore<T>

deleteWorkspaceDataStore(workspaceId: string): void
```

### Sync Engine

```typescript
registerApiAdapter<TPayload, TResult>(domain: string, entityType: string, adapter: ApiAdapter<TPayload, TResult>): void

syncManager.configure(options: {
  autoSync?: boolean;
  syncInterval?: number;
  conflictResolution?: 'local' | 'server' | 'latest';
})

syncManager.syncAll(): Promise<void>
```

## Best Practices

### 1. Use Intent-First Architecture

Always record intents instead of direct API calls. This provides instant UI feedback and offline support.

### 2. Choose the Right Policy

| Use Case | Recommended Policy |
|----------|-------------------|
| Todo items, notes | `IntentPresets.optimistic` |
| Payments, critical operations | `IntentPresets.critical` |
| Collaborative docs | `IntentPresets.collaborative` |
| Analytics, background tasks | `IntentPresets.background` |
| Local-only data | `IntentPresets.localOnly` |

### 3. Use SQLite for Production

Development: localStorage (simple)
Production: SQLite WASM (persistent, performant)

### 4. Handle Multi-Tab Scenarios

```typescript
import { isSharedWorkerSupported, sharedSqliteStorage } from '@oxlayer/capabilities-web-state/persist/sqlite-wasm';

if (isSharedWorkerSupported()) {
  await sharedSqliteStorage.init(); // Multi-tab safe
} else {
  await sqliteStorage.init(); // Single-tab fallback
}
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| State Management | Legend-State |
| Persistence | SQLite WASM with OPFS |
| Storage Fallback | localStorage |
| React Integration | React bindings included |
| Build Tool | Vite |

## See Also

- [Frontend Guide](./frontend-guide.md) - React component patterns
- [Backend DDD Pattern](../backend/oxlayer-ddd-pattern.md) - Backend architecture
- [Capabilities Guide](../backend/oxlayer-capabilities-guide.md) - All OxLayer packages
