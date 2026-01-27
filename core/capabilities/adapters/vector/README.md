# Vector Adapters

Vector database adapters for semantic search and vector operations.

## Available Adapters (Open Source)

### qdrant
```bash
pnpm add @oxlayer/adapters-qdrant
```
Qdrant vector database adapter for semantic search and vector operations.

## Multi-Tenancy Support (Proprietary)

Multi-tenancy variants with tenant-isolated collections are available in the proprietary package:

```bash
# Qdrant with tenant-isolated collections
pnpm add @oxlayer/pro-adapters-qdrant-tenancy
```

> **Note**: Tenancy adapters are part of the proprietary package. See [proprietary/README.md](../../../../proprietary/README.md) for details.

## Features

### Open Source Adapters
- Vector storage and retrieval
- Semantic search
- Embedding management
- Collection operations

### Proprietary Tenancy Adapters
- Tenant-isolated collections
- Tenant-scoped vector operations
- Automatic tenant context injection
- Dynamic index creation

## Use Cases

- Semantic search
- Recommendation systems
- Document similarity
- Image search
- RAG (Retrieval Augmented Generation)

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.

Tenancy adapters are licensed under proprietary license - see [proprietary/README.md](../../../../proprietary/README.md).
