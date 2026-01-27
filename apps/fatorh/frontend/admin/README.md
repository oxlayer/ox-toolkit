# FatorH Admin - Tenant Management

Admin application for managing B2B tenants in the FatorH platform.

## Features

- **Tenant Provisioning**: Create new B2B tenants with isolated Keycloak realms
- **Database Management**: Automatically create and migrate tenant databases
- **Workspace Support**: Multi-workspace per tenant with organization mapping
- **Real-time Status**: View all tenant databases and their status

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FatorH Admin App                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐    │
│  │   React UI  │────▶│    Axios     │────▶│   Admin API     │    │
│  │  (Vite +    │     │   Client     │     │   (Protected)   │    │
│  │  Tanstack   │     │              │     │                 │    │
│  │   Query)    │     │              │     │                 │    │
│  └─────────────┘     └──────────────┘     └─────────────────┘    │
│                                                     │              │
│                                                     ▼              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Backend Services                                │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │  POST /api/admin/tenants/provision   - Full tenant setup   │  │
│  │  GET  /api/admin/tenants             - List all tenants    │  │
│  │  POST /api/admin/databases/create    - Create database     │  │
│  │  POST /api/admin/databases/migrate   - Run migrations      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Admin API Key (set in backend `.env` as `ADMIN_API_KEY`)

### Installation

```bash
cd apps/globex/apps/admin
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:5175`

### Build

```bash
pnpm build
```

### Preview

```bash
pnpm preview
```

## API Key Authentication

On first load, you will be prompted for the Admin API Key. This key is used to authenticate requests to the admin API endpoints.

The key is stored in localStorage and used for all subsequent requests.

## Provisioning a New Tenant

1. Click "New Tenant" button
2. Fill in the realm information:
   - **Realm ID**: Unique identifier (lowercase, alphanumeric with hyphens)
   - **Display Name**: Human-readable name
3. Add one or more workspaces:
   - **Workspace ID**: Unique identifier for the workspace
   - **Name**: Human-readable workspace name
   - **Organization ID**: Organization this workspace belongs to
4. Click "Provision Tenant"

The system will:
1. Create a new realm in Keycloak
2. Create the required roles (owner, supervisor, manager, candidate)
3. Create a PostgreSQL database for each workspace (`workspace_{realm}_{workspaceId}`)
4. Run database migrations on each new database

## Tenant Database Naming

Each tenant gets a dedicated PostgreSQL database:

```
workspace_{realm}_{workspaceId}
```

Examples:
- `workspace_realm-acme_main`
- `workspace_realm-acme-corp_acme-corp`

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool (using rolldown-vite)
- **TypeScript** - Type safety
- **Tanstack Query** - Data fetching and caching
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Radix UI** - Headless UI components

## Project Structure

```
src/
├── components/    # Reusable UI components
├── pages/         # Page components
│   └── TenantsPage.tsx
├── lib/           # Utilities and API client
│   └── api.ts
├── hooks/         # Custom React hooks
├── App.tsx        # Main app component
├── main.tsx       # Entry point
└── index.css      # Global styles
```
