# Tower Main Process - Refactored Architecture

## Overview

The OxLayer Tower main process has been refactored from a monolithic 797-line file into a clean, modular architecture. This document describes the new structure and how to work with it.

## Before vs After

### Before (Monolithic)
```
apps/tower/src/main/
└── index.ts (797 lines - everything mixed together)
```

### After (Modular)
```
apps/tower/src/main/
├── index.ts (62 lines) - Main entry point
├── index-old.ts (797 lines) - Backup of original
├── modules/
│   ├── window/
│   │   ├── index.ts (112 lines) - Window creation & lifecycle
│   │   └── browser-view.ts (237 lines) - BrowserView management
│   ├── monitoring/
│   │   ├── docker-status.ts (128 lines) - Docker container monitoring
│   │   └── polling.ts (67 lines) - Status polling logic
│   ├── ipc/
│   │   ├── index.ts (28 lines) - IPC handler registry
│   │   ├── project-handlers.ts (53 lines) - Project operations
│   │   ├── infra-handlers.ts (67 lines) - Infrastructure operations
│   │   ├── system-handlers.ts (118 lines) - System operations
│   │   ├── browserview-handlers.ts (133 lines) - BrowserView operations
│   │   └── ide-handlers.ts (100 lines) - IDE integration
│   └── utils/
│       ├── constants.ts (35 lines) - Constants & config
│       └── container-names.ts (70 lines) - Container name mapping
└── README.md (this file)
```

## Module Descriptions

### 1. **Main Entry Point** (`index.ts` - 62 lines)
**Responsibility:** Application lifecycle management

- Initialize Electron app
- Create WindowManager instance
- Handle app events (activate, quit, etc.)
- Clean, minimal code

### 2. **Window Module** (`modules/window/`)

#### `window/index.ts` (112 lines)
**Responsibility:** Window creation and lifecycle

- Create BrowserWindow
- Initialize all managers
- Register IPC handlers
- Start status polling
- Load app (dev/prod)

#### `window/browser-view.ts` (237 lines)
**Responsibility:** BrowserView tab management

- Create BrowserView tabs with security restrictions
- Switch between tabs
- Close tabs
- Update bounds on window resize
- Navigation (back/forward/reload)
- Security: Block external navigation, popups, permissions

### 3. **Monitoring Module** (`modules/monitoring/`)

#### `monitoring/docker-status.ts` (128 lines)
**Responsibility:** Docker container status checking

- Get overall infrastructure status
- Get individual service statuses
- Get service logs
- Dynamic container name mapping from docker-compose.yml

#### `monitoring/polling.ts` (67 lines)
**Responsibility:** Status polling management

- Start/stop polling
- Set polling frequency
- Send status updates to renderer
- Automatic cleanup

### 4. **IPC Module** (`modules/ipc/`)

#### `ipc/index.ts` (28 lines)
**Responsibility:** IPC handler registry

- Register all IPC handlers
- Organize by feature
- Clean separation of concerns

#### `ipc/project-handlers.ts` (53 lines)
**Responsibility:** Project-related operations

- `oxlayer:get-projects` - List all projects
- `oxlayer:register-project` - Register new project
- `oxlayer:unregister-project` - Unregister project
- `oxlayer:reset-project` - Delete project resources
- `oxlayer:get-connections` - Get connection strings

#### `ipc/infra-handlers.ts` (67 lines)
**Responsibility:** Infrastructure operations

- `oxlayer:get-infra-status` - Get infrastructure status
- `oxlayer:get-services-status` - Get service statuses
- `oxlayer:start-infra` - Start infrastructure
- `oxlayer:stop-infra` - Stop infrastructure
- `oxlayer:get-service-logs` - Get service logs

#### `ipc/system-handlers.ts` (118 lines)
**Responsibility:** System operations

- `oxlayer:get-version` - Get app version
- `oxlayer:run-doctor` - Run health check with console capture
- `oxlayer:open-folder` - Open folder in file explorer
- `oxlayer:login` - Login (TODO)
- `oxlayer:set-polling-frequency` - Set polling interval
- `oxlayer:get-polling-frequency` - Get polling interval

#### `ipc/browserview-handlers.ts` (133 lines)
**Responsibility:** BrowserView operations

- `oxlayer:browserview-open` - Open new tab
- `oxlayer:browserview-switch` - Switch to tab
- `oxlayer:browserview-close` - Close tab
- `oxlayer:browserview-list` - List all tabs
- `oxlayer:browserview-reload` - Reload current tab
- `oxlayer:browserview-back` - Navigate back
- `oxlayer:browserview-forward` - Navigate forward

#### `ipc/ide-handlers.ts` (100 lines)
**Responsibility:** IDE integration

- `oxlayer:open-vscode` - Open in VSCode
- `oxlayer:open-cursor` - Open in Cursor
- `oxlayer:open-antigravity` - Open in JetBrains IDEs
- WSL-aware path handling
- Generic `openFolderInIDE()` function

### 5. **Utils Module** (`modules/utils/`)

#### `utils/constants.ts` (35 lines)
**Responsibility:** Constants and configuration

- `POLLING_FREQUENCY_DEFAULT` - Default polling interval
- `OXLAYER_VERSION` - App version
- `WINDOW_DEFAULTS` - Window size defaults
- `CONTENT_BOUNDS` - BrowserView bounds
- `BROWSERVIEW_SECURITY` - Security settings
- `CONTAINER_NAME_FALLBACK` - Fallback container names
- `IDE_COMMANDS` - IDE executable names

#### `utils/container-names.ts` (70 lines)
**Responsibility:** Container name mapping utilities

- `getContainerNameMap()` - Read docker-compose.yml dynamically
- `getReverseContainerNameMap()` - Reverse mapping
- `getOxlayerContainerNames()` - Get all container names
- `getServiceDisplayNames()` - Get all service display names

## Benefits of Refactoring

### 1. **Separation of Concerns**
Each module has a single, well-defined responsibility. No more mixed concerns.

### 2. **Maintainability**
Easier to locate and fix bugs. Smaller files are easier to understand.

### 3. **Testability**
Each module can be unit tested independently.

### 4. **Reusability**
Modules can be imported and used in other parts of the application.

### 5. **Scalability**
Easy to add new features by creating new modules or handlers.

### 6. **Code Organization**
Clear structure makes it easy for new developers to understand.

### 7. **Reduced Cognitive Load**
Developers only need to focus on the module they're working on.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        index.ts                             │
│                    (Main Entry Point)                       │
│                   App Lifecycle Management                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Creates
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    WindowManager                             │
│              (Window Creation & Lifecycle)                  │
└─────┬─────────────┬──────────────┬──────────────┬──────────┘
      │             │              │              │
      │ Creates     │ Creates      │ Creates      │ Registers
      ▼             ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│BrowserView│  │  Polling │  │   Infra  │  │   IPC        │
│ Manager   │  │  Manager │  │ Service  │  │   Handlers   │
└──────────┘  └──────────┘  └──────────┘  └──────────────┘
                                                │
                     ┌──────────────────────────┼───────────────────┐
                     │                          │                   │
                     ▼                          ▼                   ▼
            ┌─────────────┐          ┌─────────────┐      ┌─────────────┐
            │   Project   │          │    Infra    │      │   System    │
            │  Handlers   │          │  Handlers   │      │  Handlers   │
            └─────────────┘          └─────────────┘      └─────────────┘
                     │                          │                   │
                     └──────────────────────────┼───────────────────┘
                                                │
                     ┌──────────────────────────┼───────────────────┐
                     │                          │                   │
                     ▼                          ▼                   ▼
            ┌─────────────┐          ┌─────────────┐      ┌─────────────┐
            │ BrowserView │          │     IDE     │      │    Utils    │
            │  Handlers   │          │  Handlers   │      │  (Constants │
            └─────────────┘          └─────────────┘      │  Container) │
                                                                └─────────────┘
```

## Adding New Features

### Adding a New IPC Handler

1. Create a new handler file in `modules/ipc/`:
```typescript
// modules/ipc/my-feature-handlers.ts
import { ipcMain } from 'electron';

export function registerMyFeatureHandlers(): void {
  ipcMain.handle('oxlayer:my-feature', async (_event, arg) => {
    // Handle the feature
    return { success: true };
  });
}
```

2. Register it in `modules/ipc/index.ts`:
```typescript
import { registerMyFeatureHandlers } from './my-feature-handlers';

export function registerIPCHandlers(...): void {
  // ... existing handlers
  registerMyFeatureHandlers();
}
```

### Adding a New Utility

1. Create a new utility file in `modules/utils/`:
```typescript
// modules/utils/my-util.ts
export function myUtilFunction(): void {
  // Utility logic
}
```

2. Import and use it in any module:
```typescript
import { myUtilFunction } from '../utils/my-util';
```

## Migration Guide

If you have code that imports from the old structure:

### Before
```typescript
// Everything was in index.ts
import { mainWindow, infraService } from './main';
```

### After
```typescript
// Use the WindowManager to access what you need
import { WindowManager } from './modules/window';

const windowManager = new WindowManager();
// Access its methods and properties
```

## Testing

Each module can now be unit tested independently:

```typescript
// Example: Testing BrowserViewManager
import { BrowserViewManager } from '../modules/window/browser-view';
import { BrowserWindow } from 'electron';

describe('BrowserViewManager', () => {
  it('should create a new tab', () => {
    const mockWindow = {} as BrowserWindow;
    const manager = new BrowserViewManager(mockWindow);
    const tab = manager.createTab('test', 'Test', 'localhost:3000');
    expect(tab.id).toBe('test');
  });
});
```

## Performance Improvements

1. **Lazy Loading**: Modules are loaded only when needed
2. **Cleaner Imports**: Tree-shaking works better with smaller modules
3. **Better Caching**: Each module can cache its own data

## Security Improvements

1. **Isolated Modules**: Security rules for BrowserView are centralized
2. **Easier Audits**: Smaller files are easier to audit for security issues
3. **Clear Boundaries**: Each module has clear responsibilities

## Rollback Plan

If you need to rollback to the old version:

```bash
cd apps/tower/src/main
mv index.ts index-new.ts
mv index-old.ts index.ts
```

The old version is preserved as `index-old.ts` for reference and rollback.

## Future Enhancements

The modular structure makes it easy to:

1. Add new IDE integrations
2. Add new monitoring capabilities
3. Add new IPC features
4. Improve error handling per module
5. Add logging per module
6. Add metrics/telemetry
7. Add automated testing

## Questions?

Refer to the inline documentation in each module for detailed API documentation.
