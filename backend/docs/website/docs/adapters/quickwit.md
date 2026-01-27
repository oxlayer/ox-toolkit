---
title: Quickwit Search Adapter
sidebar_label: Quickwit
description: Quickwit search adapter for log analytics and observability data with full-text search
---

# @oxlayer/capabilities-adapters-search-quickwit

Quickwit search adapter for @oxlayer/capabilities. Provides a simplified interface for searching log analytics and observability data with Quickwit.

## Features

- Simplified Quickwit search client
- Full-text search with fuzzy matching
- Document retrieval by ID
- Index management (list, delete, get info)
- Aggregation support
- Snippet extraction
- Sorting and pagination
- Health check
- API key authentication

## Installation

```bash
bun add @oxlayer/capabilities-adapters-search-quickwit
```

## Usage

### Basic Setup

```typescript
import { createQuickwitSearchClient } from '@oxlayer/capabilities-adapters-search-quickwit';

const search = createQuickwitSearchClient({
  url: 'http://localhost:7280',
  indexId: 'logs',
});

// Search documents
const results = await search.search({
  query: 'error',
  maxHits: 10,
});

console.log(results.hits);
console.log(results.aggregations);
```

### Environment Variables

```typescript
import { createDefaultQuickwitSearchClient } from '@oxlayer/capabilities-adapters-search-quickwit';

const search = createDefaultQuickwitSearchClient();

// Uses environment variables:
// QUICKWIT_URL=http://localhost:7280
// QUICKWIT_INDEX_ID=logs
// QUICKWIT_API_KEY=optional-api-key
```

### Search Operations

```typescript
// Basic search
const results = await search.search({
  query: 'error',
  maxHits: 10,
});

// Search with sorting
const results = await search.search({
  query: 'level:ERROR',
  maxHits: 50,
  sortField: 'timestamp',
  sortOrder: 'desc',
});

// Search with field selection
const results = await search.search({
  query: 'service:api',
  maxHits: 20,
  fetchFields: ['timestamp', 'level', 'message'],
});

// Search with pagination
const results = await search.search({
  query: 'error',
  maxHits: 10,
  startOffset: 20,
});

// Search with snippet configuration
const results = await search.search({
  query: 'database connection failed',
  maxHits: 10,
  snippetConfiguration: {
    maxNumChars: 150,
    numSnippets: 3,
    fields: ['message', 'stacktrace'],
  },
});
```

### Fuzzy Search

```typescript
// Fuzzy search with auto fuzziness
const results = await search.fuzzySearch('conection faled', {
  maxHits: 10,
});

// Fuzzy search with specific fuzziness
const results = await search.fuzzySearch('conection faled', {
  maxHits: 10,
  fuzziness: 2,
  prefixLength: 2,
  fields: ['message', 'stacktrace'],
});
```

### Document Operations

```typescript
// Get document by ID
const doc = await search.getDocument('doc-id-123');

if (doc) {
  console.log(doc);
} else {
  console.log('Document not found');
}
```

### Index Management

```typescript
// Get index info
const info = await search.getIndexInfo();
console.log(info.indexId, info.numDocs, info.size);

// List all indexes
const indexes = await search.listIndexes();
console.log(indexes); // ['logs', 'traces', 'metrics']

// Delete index
await search.deleteIndex('old-index');
```

### Health Check

```typescript
const isHealthy = await search.healthCheck();
if (isHealthy) {
  console.log('Quickwit is healthy');
}
```

### Aggregation

```typescript
const results = await search.search({
  query: 'error',
  maxHits: 0, // Don't return hits
  aggregationRequest: {
    aggs: {
      errors_by_level: {
        terms: { field: 'level' },
      },
      errors_over_time: {
        histogram: {
          field: 'timestamp',
          interval: '1h',
        },
      },
    },
  },
});

console.log(results.aggregations);
```

## API Reference

### `QuickwitSearchClient`

Main client class for Quickwit search operations.

#### Constructor

```typescript
constructor(config: QuickwitConfig)
```

**Config:**
- `url` - Quickwit server URL (required)
- `indexId` - Index ID to search (required)
- `apiKey` - Optional API key for authentication
- `timeout` - Request timeout in milliseconds (default: `30000`)

#### Methods

##### `search(query: SearchQuery): Promise<SearchResponse>`

Search documents in the index.

##### `fuzzySearch(queryString: string, options?): Promise<SearchResponse>`

Search with fuzzy matching.

##### `getDocument(docId: string): Promise<Record<string, unknown> | null>`

Get a document by ID.

##### `getIndexInfo(): Promise<IndexInfo>`

Get information about the index.

##### `listIndexes(): Promise<string[]>`

List all indexes.

##### `deleteIndex(indexId?): Promise<void>`

Delete an index.

##### `healthCheck(): Promise<boolean>`

Check if Quickwit is healthy.

## Types

### `QuickwitConfig`

```typescript
interface QuickwitConfig {
  url: string;
  indexId: string;
  apiKey?: string;
  timeout?: number;
}
```

### `SearchQuery`

```typescript
interface SearchQuery {
  query: string;
  maxHits?: number;
  startOffset?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  fetchFields?: string[];
  aggregationRequest?: any;
  snippetConfiguration?: {
    maxNumChars?: number;
    numSnippets?: number;
    fields?: string[];
  };
}
```

### `SearchResponse`

```typescript
interface SearchResponse {
  hits: Array<{
    [key: string]: unknown;
  }>;
  aggregations?: any;
  numHits: number;
  elapsedTimeMicros: number;
}
```

### `IndexInfo`

```typescript
interface IndexInfo {
  indexId: string;
  createdAt: string;
  numDocs?: number;
  size?: number;
}
```

## Query Syntax

Quickwit supports a powerful query syntax:

### Field Search

```typescript
// Search specific field
await search.search({ query: 'level:ERROR' });

// Multiple fields
await search.search({ query: 'level:ERROR AND service:api' });
```

### Wildcards

```typescript
// Wildcard search
await search.search({ query: 'mess*' });
```

### Boolean Operators

```typescript
// AND, OR, NOT
await search.search({ query: 'error AND NOT timeout' });
await search.search({ query: '(error OR fail) AND level:CRITICAL' });
```

### Range Queries

```typescript
// Numeric ranges
await search.search({ query: 'status_code:[500 TO 599]' });

// Date ranges
await search.search({ query: 'timestamp:[2024-01-01 TO 2024-12-31]' });
```

## Fuzzy Search

Fuzzy search finds similar terms even with typos:

```typescript
// Auto fuzziness (adapts based on term length)
const results = await search.fuzzySearch('conection faled');

// Specific edit distance
const results = await search.fuzzySearch('conection faled', {
  fuzziness: 2, // Allow 2 edits
  prefixLength: 2, // First 2 chars must match
});

// Field-specific fuzzy search
const results = await search.fuzzySearch('qery', {
  fields: ['message', 'error_text'],
});
```

## Best Practices

1. **Use field-specific searches**: Faster and more accurate
2. **Limit returned fields**: Use `fetchFields` for better performance
3. **Set appropriate maxHits**: Don't fetch more than needed
4. **Use pagination**: Use `startOffset` for large result sets
5. **Monitor index health**: Check `getIndexInfo()` periodically

## Performance Tips

1. **Index frequently queried fields**: Configure proper field mappings
2. **Use date filters**: Always include time range in queries
3. **Limit aggregation scope**: Use query filters with aggregations
4. **Fetch only needed fields**: Use `fetchFields` to reduce payload
5. **Use snippets**: Enable snippets for result preview

## Error Handling

```typescript
try {
  const results = await search.search({ query: 'error' });
} catch (error) {
  if (error.message.includes('index not found')) {
    console.error('Index does not exist');
  } else {
    console.error('Search failed:', error);
  }
}
```
