# GitHub Actions Workflows

This directory contains CI/CD workflows for the oxlayer monorepo.

## Workflows

| Workflow | Trigger | Purpose |
|----------|----------|---------|
| `build-backend.yml` | Push to `main`/`develop`/`v2` (paths: `backend/**`) | Build backend SDK packages |
| `build-frontend.yml` | Push to `main`/`develop`/`v2` (paths: `frontend/**`) | Build frontend SDK packages |
| `build-cli.yml` | Push to `main`/`develop`/`v2` (paths: `cli/**`) | Build CLI tools |
| `build-channels.yml` | Push to `main`/`develop`/`v2` (paths: `channels/**`) | Build channels |
| `sdk-release.yml` | Push to `main` or manual dispatch | Generate SDK releases |

## Environment Variables

### Global Variables (set in workflow files)

| Variable | Value | Description |
|----------|--------|-------------|
| `NODE_VERSION` | `22` | Node.js version |
| `PNPM_VERSION` | `10.28.1` | pnpm version |

### Required Secrets

Configure these in **GitHub Settings > Secrets and variables > Actions**:

| Secret | Description | Used By |
|--------|-------------|----------|
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key | `sdk-release.yml` (upload) |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key | `sdk-release.yml` (upload) |
| `R2_ENDPOINT` | Cloudflare R2 endpoint URL | `sdk-release.yml` (upload) |
| `GITHUB_TOKEN` | GitHub token for releases | `sdk-release.yml` (create release) |

> **Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions, but the other secrets must be manually configured.

## Build Order

The backend build follows this order:

1. **clean** - Remove previous build artifacts
2. **build:cli** - Build CLI packages
3. **build:foundation** - Build foundation kits
4. **build:capabilities** - Build capability packages
5. **build:proprietary** - Build proprietary/tenancy packages
6. **build:snippets** - Build snippets
7. **build:examples** - Build examples
