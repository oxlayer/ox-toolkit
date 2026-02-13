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

## Secrets Management

All secrets are managed via **Bitwarden Secrets Manager** using `bitwarden/sm-action@v3`.

### Setup in GitHub

Configure these in **GitHub Settings > Secrets and variables > Actions**:

| Secret | Description |
|--------|-------------|
| `SM_ACCESS_TOKEN` | Bitwarden machine account token (retrieves other secrets) |

### Setup in Bitwarden

1. Login to [Bitwarden Secrets Manager](https://vault.bitwarden.com)
2. Navigate to **Machine Accounts** (https://bitwarden.com/help/machine-accounts/)
3. Create a new Machine Account with access to required secrets
4. Generate an **Access Token** for the machine account
5. Copy the **Access Token** and **Secret Identifiers** (UUIDs) for each secret
6. Add the Access Token to GitHub as `SM_ACCESS_TOKEN`

### Secret Mappings

Configure these secret mappings in Bitwarden (Secret UUID → Environment Variable):

| Secret UUID | Environment Variable | Description |
|-------------|---------------------|-------------|
| `<R2_ACCESS_KEY_ID_UUID>` | `AWS_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `<R2_SECRET_ACCESS_KEY_UUID>` | `AWS_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `<R2_ENDPOINT_UUID>` | `AWS_ENDPOINT_URL` | Cloudflare R2 endpoint URL |
| `<R2_BUCKET_NAME_UUID>` | `AWS_BUCKET_NAME` | R2/S3 bucket name |

> **Note:** Replace `<*_UUID>` placeholders with actual secret UUIDs from your Bitwarden vault. The machine account must have access to retrieve these specific secrets.

### Workflow Usage

The workflow retrieves secrets using:

```yaml
- name: Retrieve secrets from Bitwarden
  id: bw
  uses: bitwarden/sm-action@v3
  with:
    access_token: ${{ secrets.SM_ACCESS_TOKEN }}
    secrets: |
      <R2_ACCESS_KEY_ID_UUID> > AWS_ACCESS_KEY_ID
      <R2_SECRET_ACCESS_KEY_UUID> > AWS_SECRET_ACCESS_KEY
      <R2_ENDPOINT_UUID> > AWS_ENDPOINT_URL
      <R2_BUCKET_NAME_UUID> > AWS_BUCKET_NAME
```

Secrets are then used as environment variables:

```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ env.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ env.AWS_SECRET_ACCESS_KEY }}
  AWS_ENDPOINT_URL: ${{ env.AWS_ENDPOINT_URL }}
  AWS_BUCKET_NAME: ${{ env.AWS_BUCKET_NAME }}
```

### Auto-provided Secrets

| Secret | Description | Source |
|--------|-------------|---------|
| `GITHUB_TOKEN` | GitHub token (auto-provided) | Available in all workflows |

## Build Order

The backend build follows this order:

1. **clean** - Remove previous build artifacts
2. **build:cli** - Build CLI packages
3. **build:foundation** - Build foundation kits
4. **build:capabilities** - Build capability packages
5. **build:proprietary** - Build proprietary/tenancy packages
6. **build:snippets** - Build snippets
7. **build:examples** - Build examples

## SDK Release Process

The `sdk-release.yml` workflow:

1. **generate-version** - Creates semantic version number
2. **build-backend-sdk** - Builds all backend packages
3. **build-frontend-sdk** - Builds frontend packages
4. **build-cli-tools** - Builds CLI tools
5. **build-channels** - Builds channel adapters
6. **assemble-release** - Combines artifacts and creates manifest
7. **upload-to-storage** - Uploads to R2/S3 via Bitwarden secrets
8. **create-github-release** - Creates GitHub release (optional)
