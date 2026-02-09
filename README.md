# OxLayer Private SDK Distribution System

A complete private SDK distribution system for distributing compiled SDK packages with controlled access, capability-based licensing, and automated distribution via CI/CD.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [SDK Commands Reference](#sdk-commands-reference)
- [Development](#development)
- [Deployment](#deployment)

---

## Overview

The OxLayer SDK Distribution System enables you to:

- **Distribute compiled SDK packages** without exposing source code
- **Control access** via API keys and organization-based licensing
- **Define capability limits** (not boolean on/off flags) for different license tiers
- **Automate releases** via GitHub Actions with R2/S3 storage
- **Manage everything** through a web control panel

### What Gets Distributed

| Package Type | Description |
|--------------|-------------|
| **Backend SDK** | Foundation kits, capabilities, proprietary adapters |
| **Frontend SDK** | State management, UI components, web adapters |
| **CLI Tools** | `create-backend`, `create-frontend` scaffolding tools |
| **Channels** | Web, WhatsApp communication adapters |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub CI/CD Pipeline                    │
│  • Build all packages → Generate manifest → Upload to R2   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare R2 / AWS S3 Storage                 │
│  /releases/2025_02_08_001/                                  │
│    ├── manifest.json                                         │
│    ├── backend-sdk.zip                                       │
│    ├── frontend-sdk.zip                                      │
│    └── ...                                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  oxlayer CLI (Consumers)                     │
│  $ oxlayer install 2025_02_08_001                            │
│  $ oxlayer resolve                                           │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│              Control Panel (Web UI)                          │
│  • Organization & Developer management                       │
│  • License & API key management                              │
│  • Capability configuration                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- Cloudflare R2 account or AWS S3 bucket
- PostgreSQL database (for control panel)

### 1. Install Dependencies

```bash
# Install all monorepo dependencies
pnpm install
```

### 2. Configure Environment

Create `.env` files for each service:

**Control Panel API** (`apps/control-panel/backend/api/.env`):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/oxlayer
OXLAYER_ENCRYPTION_KEY=your-encryption-key
```

**Control Panel Frontend** (`apps/control-panel/frontend/dashboard/.env`):
```env
VITE_API_URL=http://localhost:3001
```

**GitHub Secrets** (for CI/CD):
```yaml
R2_ACCESS_KEY_ID      # Cloudflare R2 access key
R2_SECRET_ACCESS_KEY  # Cloudflare R2 secret key
R2_ENDPOINT           # https://<account_id>.r2.cloudflarestorage.com
R2_BUCKET_NAME        # Your bucket name
```

### 3. Start Services

```bash
# Start Control Panel Backend
cd apps/control-panel/backend/api
pnpm dev

# Start Control Panel Frontend (another terminal)
cd apps/control-panel/frontend/dashboard
pnpm dev
```

### 4. Create First Organization

1. Open http://localhost:5173
2. Click "New Organization"
3. Configure license tiers and capability limits

---

## How It Works

### Release Flow

1. **Trigger Release** → GitHub Action or manual dispatch
2. **Generate Version** → Auto-increment `YYYY_MM_DD_NNN`
3. **Build Packages** → Compile backend, frontend, CLI, channels
4. **Generate Manifest** → Create `manifest.json` with all packages
5. **Upload to R2/S3** → Store artifacts with signed URLs
6. **Create GitHub Release** → Tag and release notes

### Installation Flow

1. **Authenticate** → `oxlayer login` (stores API key)
2. **Resolve Capabilities** → `oxlayer resolve` (shows available features)
3. **Install SDK** → `oxlayer install 2025_02_08_001`
4. **Verify Integrity** → SHA256 checksum validation
5. **Extract to Vendor** → `.capabilities-vendor/VERSION/`
6. **Run Hooks** → Post-install setup scripts

### Capability Resolution

**❌ Never do this:**
```typescript
if (await isLicensed()) {  // Boolean check
  // Run feature
}
```

**✅ Do this instead:**
```typescript
const config = await resolveCapabilities({
  projectId,
  environment,
  requested: ['auth', 'storage']
});

// Returns:
{
  auth: {
    maxRealms: 10,      // Actual limits
    sso: true,
    rbac: true
  },
  storage: {
    encryption: true,
    maxStorageGb: 1000
  }
}

// Use limits in code
if (config.auth.sso) {
  enableSSO();
}
if (realms.length >= config.auth.maxRealms) {
  throw new Error('Realm limit exceeded');
}
```

### License Tiers

| Tier | Developers | Projects | Features |
|------|------------|----------|----------|
| **Starter** | 5 | 3 | Basic capabilities |
| **Professional** | 25 | 20 | Advanced features |
| **Enterprise** | 100 | Unlimited | All features + custom |

---

## SDK Commands Reference

The `oxlayer` CLI is the primary interface for consumers of your SDK.

### Authentication

#### `oxlayer login`

Authenticate with the OxLayer Control Panel.

```bash
oxlayer login
# Or with key directly:
oxlayer login --key oxl_kjhsd7832...
```

**Options:**
- `-k, --key <key>` - API key (prompts if not provided)
- `-e, --environment <env>` - Environment (default: development)

#### `oxlayer logout`

Remove stored API key.

```bash
oxlayer logout
```

---

### Status & Diagnostics

#### `oxlayer status`

Show installation and authentication status.

```bash
oxlayer status
oxlayer status --verbose
```

**Output:**
```
OxLayer SDK Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Authenticated
  Environment: development
  Vendor directory: .capabilities-vendor

Project
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ package.json found
  Project type: backend
  Package manager: pnpm
  TypeScript: Yes

Installation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ SDK version 2025_02_08_001 installed
  Location: .capabilities-vendor/2025_02_08_001/
```

#### `oxlayer doctor`

Run diagnostics to troubleshoot issues.

```bash
oxlayer doctor
oxlayer doctor --verbose --fix
```

**Checks:**
- Authentication status
- API connectivity
- Project structure
- TypeScript configuration
- SDK installation integrity
- `.gitignore` configuration
- Node version compatibility
- Capability availability

---

### Installation

#### `oxlayer install [version]`

Download and install SDK packages.

```bash
# Install latest version
oxlayer install

# Install specific version
oxlayer install 2025_02_08_001

# Install specific packages
oxlayer install 2025_02_08_001 --packages backend-sdk frontend-sdk

# Force reinstall
oxlayer install 2025_02_08_001 --force

# Dry run
oxlayer install 2025_02_08_001 --dry-run
```

**Options:**
- `-p, --packages <packages...>` - Specific packages to install
- `-e, --environment <env>` - Environment
- `--dry-run` - Show what would be installed
- `-f, --force` - Force reinstall
- `--save` - Add to dependencies
- `--save-dev` - Add to devDependencies

#### `oxlayer update`

Update SDK to the latest version.

```bash
oxlayer update
oxlayer update --dry-run
```

#### `oxlayer check`

Quick check for SDK updates.

```bash
oxlayer check
```

---

### Capabilities

#### `oxlayer resolve`

Resolve and display available capabilities.

```bash
oxlayer resolve
oxlayer resolve --verbose --environment production
```

**Output:**
```
Available Capabilities for Development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────┬─────────────────────────────────────┐
│ Capability      │ Limits                                │
├─────────────────┼─────────────────────────────────────┤
│ auth            │ maxRealms: 10, sso, rbac              │
│ storage         │ encryption, maxStorageGb: 1000        │
│ search          │ maxResults: 10000                     │
│ vector          │ maxCollections: 50, hybridSearch      │
└─────────────────┴─────────────────────────────────────┘

Usage Example:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { resolveCapabilities } from '@oxlayer/capabilities-internal';

const config = await resolveCapabilities({
  projectId: 'my-project',
  environment: 'development',
  requested: ['auth', 'storage']
});

if (config.auth.sso) {
  // Enable SSO
}
```

#### `oxlayer diff [from-version] [to-version]`

Compare capabilities between SDK versions.

```bash
# Compare current to latest
oxlayer diff

# Compare two specific versions
oxlayer diff 2025_01_01_001 2025_02_08_001

# Detailed view
oxlayer diff 2025_01_01_001 2025_02_08_001 --verbose
```

**Output:**
```
Capability Diff: 2025_01_01_001 → 2025_02_08_001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 1 capability(ies) added
ℹ 2 capability(ies) modified

Detailed Changes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

+ search (new)
    maxResults: 10000

~ auth (modified)
  maxRealms: 1 → 5
  sso: ✗ disabled → ✓ enabled

~ storage (modified)
  encryption: ✗ disabled → ✓ enabled
  maxStorageGb: 100 → 1000
```

---

### Telemetry

#### `oxlayer telemetry`

Manage anonymous usage tracking.

```bash
# Show status
oxlayer telemetry status

# Enable telemetry
oxlayer telemetry enable

# Disable telemetry
oxlayer telemetry disable
```

**What we collect:**
- CLI version
- Node version
- Platform (OS)
- Command used
- SDK version (if applicable)

**What we NEVER collect:**
- Code or file contents
- Personal information
- Project names or paths

---

## Development

### Project Structure

```
oxlayer/
├── apps/
│   └── control-panel/
│       ├── backend/api/          # Control Panel API
│       └── frontend/dashboard/   # Control Panel UI
├── backend/                       # SDK packages
│   ├── foundation/               # Base kits
│   ├── capabilities/             # Capability implementations
│   └── pro/                      # Proprietary/enterprise features
├── cli/
│   └── sdk-installer/            # Consumer CLI tool
├── frontend/                      # Frontend SDK packages
├── channels/                      # Channel adapters
└── scripts/
    └── sdk-release/              # Release automation scripts
```

### Building SDKs

```bash
# Build all backend packages
pnpm backend:build

# Build all frontend packages
pnpm frontend:build

# Create a release
pnpm sdk:release
```

### Local Development

```bash
# Build SDK installer
cd cli/sdk-installer
pnpm build
pnpm link --global

# Test commands
oxlayer status
oxlayer doctor
```

---

## Deployment

### Control Panel

1. **Build and push Docker images**
2. **Configure environment variables**
3. **Run migrations**
4. **Start services**

### CI/CD

The GitHub workflows are automatically triggered:
- On push to `main` (builds all packages)
- On manual dispatch (creates releases)

Configure secrets in GitHub Settings for R2/S3 access.

---

## License

Proprietary. All rights reserved.

---

## Support

Run `oxlayer doctor` for diagnostics, or contact support for issues.
