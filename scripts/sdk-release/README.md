# OxLayer SDK Release System

This directory contains the scripts and workflows for building and distributing private SDK packages.

## Scripts

### generate-version.ts
Generates a monotonic, date-based version number in the format `YYYY_MM_DD_NNN`.

```bash
node scripts/sdk-release/generate-version.ts
# Output: 2025_02_08_001
```

### generate-manifest.ts
Creates a `manifest.json` file for a release, including all packages, their entry points, and capability mappings.

```bash
node scripts/sdk-release/generate-manifest.ts <version> <output-dir>
```

### upload-to-r2.ts
Uploads release artifacts to Cloudflare R2 or AWS S3 with signed URLs for controlled distribution.

```bash
node scripts/sdk-release/upload-to-r2.ts <version> <input-dir>
```

## GitHub Workflows

### Main Release Workflow
- **[sdk-release.yml](../.github/workflows/sdk-release.yml)** - Full SDK release workflow
  - Generates version
  - Builds all packages (backend, frontend, CLI, channels)
  - Generates manifest
  - Uploads to R2/S3
  - Creates GitHub release

### Individual Build Workflows
- **[build-backend.yml](../.github/workflows/build-backend.yml)** - Backend packages only
- **[build-frontend.yml](../.github/workflows/build-frontend.yml)** - Frontend packages only
- **[build-cli.yml](../.github/workflows/build-cli.yml)** - CLI tools only
- **[build-channels.yml](../.github/workflows/build-channels.yml)** - Channel adapters only

## Environment Variables

For R2/S3 upload, configure these secrets in GitHub:

```yaml
R2_ACCESS_KEY_ID      # Cloudflare R2 access key
R2_SECRET_ACCESS_KEY  # Cloudflare R2 secret key
R2_ENDPOINT           # R2 endpoint URL
R2_BUCKET_NAME        # Bucket name for storage
```

Or for AWS S3:

```yaml
AWS_ACCESS_KEY_ID     # AWS access key
AWS_SECRET_ACCESS_KEY # AWS secret key
AWS_REGION            # AWS region
AWS_BUCKET_NAME       # S3 bucket name
```

## Manifest Format

Each release includes a `manifest.json`:

```json
{
  "version": "2025_02_08_001",
  "generatedAt": "2025-02-08T12:34:56Z",
  "sha256": "...",
  "packages": {
    "@oxlayer/capabilities-auth": {
      "path": "capabilities/capabilities-auth",
      "main": "dist/index.js",
      "capability": "auth",
      "type": "capability"
    }
  }
}
```

## Storage Structure

Artifacts are stored in R2/S3 as:

```
capabilities-sdk/releases/
└── 2025_02_08_001/
    ├── manifest.json
    ├── backend/
    │   ├── foundation/...
    │   ├── capabilities/...
    │   └── pro/...
    ├── frontend/
    │   └── capabilities-web/...
    ├── cli/
    │   ├── create-backend/...
    │   └── create-frontend/...
    └── channels/
        ├── adapters-web/...
        └── adapters-whatsapp/...
```

## Local Development

Build the scripts:

```bash
pnpm sdk:build-scripts
```

Generate a version:

```bash
pnpm sdk:version
```

## License & Distribution

See the main [architecture brief](../../docs/distribution-architecture.md) for details on:
- Distribution control vs. license enforcement
- Capability resolution patterns
- Security model
- Non-goals (we don't do DRM)
