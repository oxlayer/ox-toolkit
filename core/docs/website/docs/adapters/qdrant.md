---
title: Qdrant Adapter
sidebar_label: Qdrant
description: Qdrant vector database adapter for vector search, point management, and collection operations
---

# @oxlayer/capabilities-adapters-qdrant

Qdrant vector database adapter for @oxlayer/capabilities. Provides a simplified interface for Qdrant vector database operations including vector search, point management, and collection operations.

## Features

- Simplified Qdrant client for vector operations
- Vector search with similarity scoring
- Point CRUD operations (upsert, insert, update, delete)
- Collection management (create, delete, list)
- Payload indexing for filtering
- Scroll/pagination support
- Multi-collection search
- Health check

## Installation

```bash
bun add @oxlayer/capabilities-adapters-qdrant
```

## Dependencies

```bash
bun add @qdrant/js-client-rest
```

## Usage

### Basic Setup

```typescript
import { createQdrantClient } from '@oxlayer/capabilities-adapters-qdrant';

const qdrant = createQdrantClient({
  url: 'http://localhost:6333',
});

// Create a collection
await qdrant.createCollection('products', {
  vectorSize: 384,
  distance: 'Cosine',
});

// Upsert points
await qdrant.upsert('products', [
  {
    id: '1',
    vector: [0.1, 0.2, 0.3, ...],
    payload: { name: 'Product A', price: 29.99 },
  },
  {
    id: '2',
    vector: [0.4, 0.5, 0.6, ...],
    payload: { name: 'Product B', price: 49.99 },
  },
]);

// Search similar vectors
const results = await qdrant.search('products', [0.1, 0.2, 0.3, ...], {
  limit: 10,
});

console.log(results); // ScoredPoint[]
```

### Environment Variables

```typescript
import { createDefaultQdrantClient } from '@oxlayer/capabilities-adapters-qdrant';

const qdrant = createDefaultQdrantClient();

// Uses environment variables:
// QDRANT_URL=http://localhost:6333
// QDRANT_API_KEY=optional-api-key
```

### Collection Management

```typescript
// Create collection with configuration
await qdrant.createCollection('products', {
  vectorSize: 384,
  distance: 'Cosine',
  hnswConfig: {
    m: 16,
    ef_construct: 100,
  },
  quantizationConfig: {
    scalar: { type: 'int8' },
  },
  payloadIndexes: [
    { fieldName: 'price', fieldType: 'float' },
    { fieldName: 'category', fieldType: 'keyword' },
  ],
});

// Get collection info
const info = await qdrant.getCollection('products');
console.log(info.pointsCount, info.status);

// List collections
const collections = await qdrant.listCollections();

// Check if collection exists
const exists = await qdrant.collectionExists('products');

// Delete collection
await qdrant.deleteCollection('products');
```

### Point Operations

```typescript
// Upsert (insert or update)
await qdrant.upsert('products', [
  { id: '1', vector: [...], payload: { name: 'Product A' } },
]);

// Insert (fail if exists)
await qdrant.insert('products', [
  { id: '2', vector: [...], payload: { name: 'Product B' } },
]);

// Update
await qdrant.update('products', [
  { id: '1', vector: [...], payload: { name: 'Updated' } },
]);

// Delete by IDs
await qdrant.delete('products', ['1', '2', '3']);

// Delete by filter
await qdrant.deleteByFilter('products', {
  must: [{ key: 'price', match: { value: 0 } }],
});

// Get point by ID
const point = await qdrant.getPoint('products', '1');

// Get multiple points
const points = await qdrant.getPoints('products', ['1', '2', '3']);
```

### Search Operations

```typescript
// Basic search
const results = await qdrant.search('products', queryVector, {
  limit: 10,
  scoreThreshold: 0.7,
  withPayload: true,
  withVector: false,
});

// Search with filter
const results = await qdrant.search('products', queryVector, {
  limit: 10,
  filter: {
    must: [
      { key: 'price', match: { range: { lt: 100 } } },
      { key: 'category', match: { value: 'electronics' } },
    ],
  },
});

// Multi-collection search
const multiResults = await qdrant.searchMulti(
  ['products', 'similar_products'],
  queryVector,
  { limit: 5 }
);

console.log(multiResults.get('products'));
```

### Scroll/Pagination

```typescript
// Scroll through points
const { points, nextPageOffset } = await qdrant.scroll('products', {
  limit: 100,
  filter: { must: [{ key: 'active', match: { value: true } }] },
  withPayload: ['name', 'price'],
});

// Get next page
if (nextPageOffset) {
  const nextPage = await qdrant.scroll('products', {
    limit: 100,
    offset: nextPageOffset,
  });
}
```

### Payload Indexes

```typescript
// Create payload index
await qdrant.createPayloadIndex('products', 'price', 'float');
await qdrant.createPayloadIndex('products', 'category', 'keyword');

// Delete payload index
await qdrant.deletePayloadIndex('products', 'price');
```

### Count Points

```typescript
// Count all points
const count = await qdrant.count('products');

// Count with filter
const count = await qdrant.count('products', {
  must: [{ key: 'category', match: { value: 'electronics' } }],
});
```

## API Reference

### `QdrantClient`

Main client class for Qdrant operations.

#### Constructor

```typescript
constructor(config: QdrantConfig)
```

**Config:**
- `url` - Qdrant server URL (required)
- `apiKey` - API key (optional)
- `timeout` - Request timeout in milliseconds (default: `30000`)

#### Methods

##### `createCollection(name: string, config: CollectionConfig): Promise<void>`

Create a new collection.

##### `deleteCollection(name: string): Promise<void>`

Delete a collection.

##### `getCollection(name: string): Promise<CollectionInfo>`

Get collection info.

##### `listCollections(): Promise<string[]>`

List all collections.

##### `collectionExists(name: string): Promise<boolean>`

Check if a collection exists.

##### `upsert(collection: string, points: Point[], options?): Promise<void>`

Upsert points (insert or update).

##### `insert(collection: string, points: Point[], options?): Promise<void>`

Insert points (fail if exists).

##### `update(collection: string, points: Point[], options?): Promise<void>`

Update points.

##### `delete(collection: string, ids: Array<string | number>): Promise<void>`

Delete points by IDs.

##### `deleteByFilter(collection: string, filter: SearchOptions['filter']): Promise<void>`

Delete points by filter.

##### `search(collection: string, vector: number[], options?): Promise<ScoredPoint[]>`

Search for similar vectors.

##### `searchMulti(collections: string[], vector: number[], options?): Promise<Map<string, ScoredPoint[]>>`

Search in multiple collections.

##### `getPoint(collection: string, id: string | number): Promise<Point | null>`

Get point by ID.

##### `getPoints(collection: string, ids: Array<string | number>): Promise<Point[]>`

Get multiple points by IDs.

##### `scroll(collection: string, options?): Promise<{ points: Point[], nextPageOffset: string | null }>`

Scroll through points.

##### `count(collection: string, filter?: SearchOptions['filter']): Promise<number>`

Count points in a collection.

##### `createPayloadIndex(collection: string, fieldName: string, fieldType?): Promise<void>`

Create a payload index.

##### `deletePayloadIndex(collection: string, fieldName: string): Promise<void>`

Delete a payload index.

##### `healthCheck(): Promise<boolean>`

Check if Qdrant is healthy.

##### `getClient(): QdrantRestClient`

Get the underlying Qdrant client.

## Types

### `QdrantConfig`

```typescript
interface QdrantConfig {
  url: string;
  apiKey?: string;
  timeout?: number;
}
```

### `CollectionConfig`

```typescript
interface CollectionConfig {
  vectorSize: number;
  distance: 'Cosine' | 'Euclid' | 'Dot';
  hnswConfig?: {
    m?: number;
    ef_construct?: number;
  };
  quantizationConfig?: {
    scalar?: { type: string };
  };
  optimizersConfig?: any;
  replicationFactor?: number;
  shardNumber?: number;
  writeConsistencyFactor?: number;
  payloadIndexes?: Array<{
    fieldName: string;
    fieldType: 'keyword' | 'integer' | 'float' | 'bool';
  }>;
}
```

### `Point`

```typescript
interface Point {
  id: string | number;
  vector: number[];
  payload?: Record<string, unknown>;
}
```

### `ScoredPoint`

```typescript
interface ScoredPoint {
  id: string | number;
  score: number;
  vector?: number[];
  payload?: Record<string, unknown>;
}
```

### `SearchOptions`

```typescript
interface SearchOptions {
  limit?: number;
  scoreThreshold?: number;
  withPayload?: boolean | string[];
  withVector?: boolean;
  filter?: {
    must?: Array<{ key: string; match: any }>;
    must_not?: Array<{ key: string; match: any }>;
  };
}
```

## Distance Metrics

- **Cosine**: Cosine similarity (default for text embeddings)
- **Euclid**: Euclidean distance
- **Dot**: Dot product

## Best Practices

1. **Use appropriate distance**: Choose based on your use case
2. **Index payload fields**: Create indexes for filtering
3. **Use pagination**: Scroll for large result sets
4. **Set score thresholds**: Filter low-quality matches
5. **Monitor collection health**: Check status regularly
