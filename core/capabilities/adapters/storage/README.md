# Storage Adapters

Storage adapters for Object Storages, and other storage services.

## Available Adapters (Open Source)

### object-storage
```bash
pnpm add @oxlayer/capabilities-adapters-object-storage
```
Object storage adapter for OxLayer capabilities.

## Multi-Tenancy Support (Proprietary)

Multi-tenancy variants with automatic tenant isolation and path-based tenancy are available in the proprietary package:

```bash
# S3 with tenant-isolated buckets
pnpm add @oxlayer/pro-adapters-s3-tenancy
```

> **Note**: Tenancy adapters are part of the proprietary package. See [proprietary/README.md](../../../../proprietary/README.md) for details.

## Features

### Open Source Adapters
- Upload/download operations
- Multipart uploads
- Presigned URLs
- Bucket management

### Proprietary Tenancy Adapters
- Tenant-isolated buckets/containers
- Path-based tenancy
- Automatic tenant context injection
- Tenant-specific credentials

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.

Tenancy adapters are licensed under proprietary license - see [proprietary/README.md](../../../../proprietary/README.md).
