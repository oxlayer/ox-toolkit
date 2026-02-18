# Global Infrastructure Service - Modular Structure

## Overview

The Global Infrastructure Service has been refactored from a single 2086-line file into a modular, maintainable structure. This document describes the new organization and how to use it.

## Directory Structure

```
src/services/
├── global-infra/                    # New modular directory
│   ├── types.ts                     # Type definitions
│   ├── constants.ts                 # Service definitions & configs
│   ├── utils.ts                     # Utility functions
│   ├── lock-manager.ts              # Concurrency locking
│   ├── registry-manager.ts          # Project registry operations
│   ├── container-manager.ts         # Docker container lifecycle
│   ├── provisioner.service.ts       # Runtime tenant provisioning
│   ├── doctor.service.ts            # Health checks & diagnostics
│   ├── index.ts                     # Main facade class
│   └── README.md                    # This file
└── global-infra.service.ts          # Backward-compatible facade
```

## Module Descriptions

### 1. **types.ts** - Type Definitions
- `ProjectResources` - Resource configuration for each service
- `ProjectConfig` - Project metadata and resources
- `ProjectsRegistry` - Registry structure
- `ServiceDefinition` - Service metadata

### 2. **constants.ts** - Constants & Service Definitions
- `SERVICE_DEFINITIONS` - Array of all available services
- `CORE_SERVICES` - Core service IDs
- `ALL_SERVICES` - All service IDs
- `getServiceConfigs()` - Docker Compose service configurations

### 3. **utils.ts** - Utility Functions
- `generatePassword()` - Generate secure random passwords
- `sanitizeName()` - Sanitize names for database/vhost usage
- `ensureDependencies()` - Validate service dependencies
- `promptServiceSelection()` - Interactive service selection
- `generateDockerCompose()` - Generate docker-compose.yml

### 4. **lock-manager.ts** - LockManager Class
**Responsibility:** Prevent race conditions through PID-based locking

**Methods:**
- `acquireLock()` - Acquire exclusive lock
- `releaseLock()` - Release lock
- `withLock()` - Execute callback with lock held

### 5. **registry-manager.ts** - RegistryManager Class
**Responsibility:** Manage project registry (load, save, query)

**Methods:**
- `loadRegistry()` - Load registry from disk
- `saveRegistry()` - Save registry to disk (atomic)
- `getProject()` - Get project by name
- `listProjects()` - List all projects
- `unregisterProject()` - Remove project from registry
- `getConnectionStrings()` - Get connection strings for project
- `generateEnvFile()` - Generate .env file for project
- `addProject()` - Add project to registry
- `projectExists()` - Check if project exists

### 6. **container-manager.ts** - ContainerManager Class
**Responsibility:** Manage Docker container lifecycle

**Methods:**
- `start()` - Start all infrastructure containers
- `stop()` - Stop all infrastructure containers
- `isRunning()` - Check if containers are running
- `getStatus()` - Get container status
- `getLogs()` - Get container logs
- `isInitialized()` - Check if infrastructure is initialized

### 7. **provisioner.service.ts** - ProvisionerService Class
**Responsibility:** Handle runtime tenant provisioning

**Methods:**
- `registerProject()` - Register new project with resource provisioning
- `provisionPostgres()` - Create PostgreSQL database and user
- `provisionRedis()` - Allocate Redis DB number
- `provisionRabbitMQ()` - Create RabbitMQ vhost and user
- `provisionKeycloak()` - Create Keycloak realm (TODO)
- `createProjectLocalConfig()` - Create .ox folder with templates
- `syncMonitoringConfig()` - Sync monitoring configs to global infra
- `syncPrometheusFileBased()` - Sync Prometheus configs
- `syncCollectorFileBased()` - Sync OTEL collector configs
- `syncGrafanaApiBased()` - Sync Grafana configs via API

### 8. **doctor.service.ts** - DoctorService Class
**Responsibility:** Health checks and self-healing

**Methods:**
- `runDoctor()` - Run comprehensive health check
- `resetProject()` - Delete all project resources (dangerous)

### 9. **index.ts** - Main Facade Class
**Responsibility:** Coordinate all services and provide public API

**Methods:**
- `isInitialized()` - Check if infrastructure is initialized
- `initialize()` - One-time infrastructure setup
- `start()` - Start infrastructure
- `stop()` - Stop infrastructure
- `isRunning()` - Check if infrastructure is running
- `getStatus()` - Get infrastructure status
- `registerProject()` - Register new project
- `getProject()` - Get project configuration
- `listProjects()` - List all projects
- `unregisterProject()` - Unregister project
- `getConnectionStrings()` - Get connection strings
- `generateEnvFile()` - Generate .env file
- `syncMonitoringConfig()` - Sync monitoring configs
- `getLogs()` - Get container logs
- `runDoctor()` - Run health check
- `resetProject()` - Reset project resources
- `projectExists()` - Check if project exists

## Usage Examples

### Using the Main Facade (Recommended)

```typescript
import { GlobalInfraService } from './services/global-infra';

const service = new GlobalInfraService();

// Initialize infrastructure
await service.initialize();

// Start infrastructure
await service.start();

// Register a project
await service.registerProject('my-project', '/path/to/project');

// Get project info
const project = service.getProject('my-project');

// Get connection strings
const connStrings = service.getConnectionStrings('my-project');

// Generate .env file
await service.generateEnvFile('my-project', '.env.local');

// Sync monitoring configs
await service.syncMonitoringConfig('my-project', '/path/to/project/.ox');

// Run health check
await service.runDoctor();
```

### Using Individual Modules (Advanced)

```typescript
import { LockManager } from './services/global-infra/lock-manager';
import { RegistryManager } from './services/global-infra/registry-manager';
import { ContainerManager } from './services/global-infra/container-manager';
import { ProvisionerService } from './services/global-infra/provisioner.service';

const lockManager = new LockManager('/path/to/lock');
const registryManager = new RegistryManager('/path/to/registry', '/path/to/tmp', lockManager);
const containerManager = new ContainerManager('/path/to/infra', '/path/to/compose');
const provisionerService = new ProvisionerService('/path/to/oxlayer', '/path/to/infra');

// Use individual managers
await containerManager.start();
const projects = registryManager.listProjects();
```

### Using Utility Functions

```typescript
import {
  generatePassword,
  sanitizeName,
  ensureDependencies,
  promptServiceSelection,
  generateDockerCompose
} from './services/global-infra';

// Generate a secure password
const password = generatePassword(32);

// Sanitize a project name
const dbName = sanitizeName('My Project!'); // 'my_project_'

// Ensure service dependencies are included
const services = ensureDependencies(['keycloak'], serviceDefinitions);

// Prompt user for service selection
const selectedServices = await promptServiceSelection(defs, core, all);

// Generate docker-compose.yml
const composeYml = generateDockerCompose(services, serviceConfigs);
```

## Backward Compatibility

The old import path still works:

```typescript
// Old import (still works)
import { GlobalInfraService } from './services/global-infra.service';

// New import (recommended)
import { GlobalInfraService } from './services/global-infra';
```

The old `global-infra.service.ts` file now serves as a backward-compatible facade that re-exports everything from the new modular structure.

## Benefits of the New Structure

1. **Maintainability:** Each module has a single, well-defined responsibility
2. **Testability:** Smaller modules are easier to unit test
3. **Reusability:** Individual modules can be used independently
4. **Readability:** Easier to understand the codebase organization
5. **Extensibility:** New features can be added to specific modules without affecting others
6. **Collaboration:** Multiple developers can work on different modules simultaneously

## Architecture Layers

The service follows a clear three-layer architecture:

### Layer 1: Physical Infrastructure (Static)
- **Managed by:** ContainerManager
- **Files:** Docker Compose configuration
- **Lifecycle:** Created once, never modified

### Layer 2: Tenant Provisioner (Runtime)
- **Managed by:** ProvisionerService
- **Operations:** SQL/CLI/API calls to create resources
- **Lifecycle:** Runtime provisioning for each project

### Layer 3: Project Registry (State)
- **Managed by:** RegistryManager
- **Storage:** JSON file with atomic writes
- **Lifecycle:** Updated on project registration/unregistration

## Safety Features

1. **Concurrency Locking:** PID-based file locking prevents race conditions
2. **Atomic Registry Writes:** Temporary file + rename operation
3. **Credential Security:** chmod 600 on sensitive files
4. **Idempotent Operations:** Safe to run multiple times
5. **Thread-Safe:** All registry operations use locking

## Migration Guide

If you have existing code using the old structure:

1. **No immediate action required** - backward compatibility is maintained
2. **Update imports** when convenient to use the new structure
3. **Use specific modules** if you only need certain functionality

### Before

```typescript
import { GlobalInfraService } from './services/global-infra.service';
const service = new GlobalInfraService();
```

### After (Option 1 - Simple)

```typescript
import { GlobalInfraService } from './services/global-infra';
const service = new GlobalInfraService();
```

### After (Option 2 - Modular)

```typescript
import { LockManager, RegistryManager, ContainerManager } from './services/global-infra';
// Use only the modules you need
```

## Future Enhancements

The modular structure makes it easy to:

1. Add new service types (extend `constants.ts`)
2. Add new provisioning methods (extend `provisioner.service.ts`)
3. Add new health checks (extend `doctor.service.ts`)
4. Add new utility functions (extend `utils.ts`)
5. Support additional database types (new module)
6. Add monitoring and metrics (new module)

## Questions?

Refer to the inline documentation in each module for detailed API documentation.
