# Search Adapters

Search adapters for Quickwit, Meilisearch, OpenSearch, and other search engines.

## Available Adapters (Open Source)

### quickwit
```bash
pnpm add @oxlayer/adapters-search-quickwit
```
Quickwit search adapter for log analytics and search.

## Multi-Tenancy Support (Proprietary)

Multi-tenancy variants with tenant-isolated indexes are available in the proprietary package:

```bash
# Quickwit with tenant-isolated indexes
pnpm add @oxlayer/pro-adapters-quickwit-tenancy
```

> **Note**: Tenancy adapters are part of the proprietary package. See [proprietary/README.md](../../../../proprietary/README.md) for details.

## Coming Soon

We're working on adapters for:
- Meilisearch
- OpenSearch
- Elasticsearch

## Features

### Open Source Adapters
- Full-text search
- Log aggregation
- Index management
- Query builders

### Proprietary Tenancy Adapters
- Tenant-isolated indexes
- Tenant-scoped search
- Automatic tenant context injection

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.

Tenancy adapters are licensed under proprietary license - see [proprietary/README.md](../../../../proprietary/README.md).
