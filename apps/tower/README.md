# OxLayer Tower

Electron desktop application for managing local OxLayer infrastructure.

## Features

- 📊 **Infrastructure Status**: Monitor global infrastructure status at a glance
- 📁 **Project Management**: Register, unregister, and manage projects
- 🔗 **Connection URLs**: View and copy connection strings for each project
- 🩺 **Health Check**: Run diagnostics to ensure infrastructure health
- ⚙️ **Service Control**: Start and stop global infrastructure
- 💾 **Environment Files**: Generate `.env` files for projects
- 🔄 **Project Reset**: Clean up project resources when needed

## Tech Stack

- **Electron**: Desktop application framework
- **React + TypeScript**: Type-safe UI development
- **Tailwind CSS 4**: Modern utility-first CSS
- **Lucide React**: Beautiful icon library
- **Vite**: Fast build tool and dev server

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Electron Main Process

```bash
npm run build
```

### 3. Development

In separate terminals:

```bash
# Terminal 1: Start Vite dev server for React frontend
npm run dev:frontend

# Terminal 2: Start Electron with hot reload
NODE_ENV=development npm start
```

### 4. Build for Production

```bash
# Build Electron main process
npm run build

# Build React frontend
npm run build:frontend

# Start the production app
npm start
```

## Architecture

### Main Process (`src/main.ts`)

- Creates Electron window
- Manages IPC communication
- Integrates with `@oxlayer/cli`'s `GlobalInfraService`
- Handles infrastructure operations

### Preload Script (`src/preload.ts`)

- Secure bridge between main and renderer processes
- Exposes safe API via `contextBridge`
- Type-safe IPC handlers

### Renderer Process (`frontend/src/`)

- React + TypeScript application
- Tailwind CSS for styling
- Lucide React for icons
- Communicates with main process via exposed API

## Security

- **Context Isolation**: Enabled
- **Node Integration**: Disabled
- **Content Security Policy**: Configured for safe script loading
- **Preload Script**: Only exposes necessary APIs

## Project Resources

Each registered project gets:

- **PostgreSQL**: Dedicated database and user
- **Redis**: Dedicated database number (0-15)
- **RabbitMQ**: Dedicated virtual host and user
- **Keycloak**: Dedicated realm and client

## Infrastructure Status

The app shows the status of global infrastructure:
- ✅ **Running**: All services healthy
- ❌ **Stopped**: Infrastructure not running
- ⚠️ **Error**: One or more services failed

## Contributing

This is part of the OxLayer monorepo. Please follow the monorepo's contribution guidelines.
