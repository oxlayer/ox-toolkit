# @oxlayer/foundation-http-kit

HTTP layer primitives for OxLayer applications. Provides base controllers, error handling, validation, and pagination utilities.

## Installation

```bash
pnpm add @oxlayer/foundation-http-kit
```

## Exports

### Controllers

- `BaseController` - Base class for all HTTP controllers

### Errors

- `HttpError` - HTTP error base class
- `HttpStatus` - HTTP status code enum
- `mapDomainErrorToHttpStatus()` - Map domain errors to HTTP status codes
- `domainErrorToResponse()` - Convert domain errors to HTTP responses
- `errorToResponse()` - Generic error to response converter

### Validation

- `validate()` - Validate data against a schema
- `validateOrThrow()` - Validate and throw on error
- `validationErrorResponse()` - Format validation errors as HTTP response

### Pagination

- `base64Encode()` - Encode cursor values
- `base64Decode()` - Decode cursor values
- `buildPageInfo()` - Build pageInfo object for cursor-based pagination
- `buildPaginatedPayload()` - Build complete paginated response
- `PageInfo` - Type for pagination metadata
- `PaginationMeta` - Type for optional meta information

## BaseController

The `BaseController` provides standard HTTP response methods:

```typescript
import { BaseController } from '@oxlayer/foundation-http-kit';

export class TodosController extends BaseController {
  async createTodo(c: Context): Promise<Response> {
    // ... business logic ...
    return this.created({ todo: result.data });
  }

  async getTodo(c: Context): Promise<Response> {
    // ... business logic ...
    return this.ok({ todo: result.data });
  }

  async notFoundHandler(c: Context): Promise<Response> {
    return this.notFound('Todo not found');
  }

  async errorHandler(c: Context): Promise<Response> {
    return this.badRequest('Invalid input');
  }

  async validationHandler(c: Context): Promise<Response> {
    return this.validationError({ title: ['Title is required'] });
  }
}
```

### Response Methods

| Method | Status | Description |
|--------|--------|-------------|
| `ok(data)` | 200 | Successful request |
| `created(data)` | 201 | Resource created |
| `accepted(data)` | 202 | Request accepted |
| `noContent()` | 204 | Successful request with no content |
| `badRequest(message)` | 400 | Invalid request |
| `unauthorized(message)` | 401 | Authentication required |
| `forbidden(message)` | 403 | Access denied |
| `notFound(message)` | 404 | Resource not found |
| `conflict(message)` | 409 | Resource conflict |
| `validationError(errors)` | 422 | Validation failed |
| `serverError(message)` | 500 | Internal server error |

## Pagination

This package provides canonical pagination utilities for cursor-based pagination.

### PageInfo Type

```typescript
export type PageInfo = {
  limit: number;
  nextCursor?: string;
  hasNext: boolean;
};
```

### PaginationMeta Type

```typescript
export type PaginationMeta = {
  total?: number;
};
```

### buildPageInfo()

Build pageInfo object for cursor-based pagination:

```typescript
import { buildPageInfo } from '@oxlayer/foundation-http-kit';

const pageInfo = buildPageInfo({
  itemsLength: items.length,
  limit: 50,
  nextCursorPayload: { offset: 50, limit: 50 },
});
// Returns: { limit: 50, nextCursor: "eyJvZmZzZXQiOjUwLCJsaW1pdCI6NTB9", hasNext: true }
```

**Parameters:**
- `itemsLength` - The number of items returned in current page
- `limit` - The page size limit
- `nextCursorPayload` - The payload to encode in nextCursor (if hasNext)

**Returns:**
- `PageInfo` object with `limit`, `nextCursor`, and `hasNext`

### buildPaginatedPayload()

Build the full paginated response payload:

```typescript
import { buildPaginatedPayload } from '@oxlayer/foundation-http-kit';

const response = buildPaginatedPayload({
  data: items,
  pageInfo,
  total, // optional - only included if provided
});
// Returns: { data: [...], pageInfo: {...}, meta: { total: 100 } }
```

**Parameters:**
- `data` - The items to return
- `pageInfo` - The pagination info from `buildPageInfo()`
- `total` - Optional total count (only included in meta if provided)

**Returns:**
- Complete paginated response with `data`, `pageInfo`, and optional `meta`

### Controller Example

```typescript
import { BaseController, buildPageInfo, buildPaginatedPayload } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';

export class EstablishmentsController extends BaseController {
  constructor(
    private listEstablishmentsUseCase: ListEstablishmentsUseCase,
    private establishmentRepository: EstablishmentRepository
  ) {
    super();
  }

  async listEstablishments(c: Context): Promise<Response> {
    const { include, ...filters } = parseQuery(c.req.query());

    // Only fetch total if explicitly requested via include=count
    // Backend rule of thumb: avoid expensive count queries unless needed
    let total: number | undefined;
    if (include?.includes('count')) {
      total = await this.establishmentRepository.count(filters);
    }

    const result = await this.listEstablishmentsUseCase.execute(filters);

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch establishments');
    }

    const items = result.data?.items || [];
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const pageInfo = buildPageInfo({
      itemsLength: items.length,
      limit,
      nextCursorPayload: { offset: offset + limit, limit },
    });

    return this.ok(
      buildPaginatedPayload({
        data: items,
        pageInfo,
        total,
      })
    );
  }
}
```

### Response Format

The canonical paginated response format:

```json
{
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "pageInfo": {
    "limit": 50,
    "nextCursor": "eyJvZmZzZXQiOjUwLCJsaW1pdCI6NTB9",
    "hasNext": true
  },
  "meta": {
    "total": 100
  }
}
```

**Notes:**
- `meta` is only included if `total` is provided to `buildPaginatedPayload()`
- `nextCursor` is only present when `hasNext` is `true`
- Clients should decode `nextCursor` with `base64Decode()` to get the pagination state

### Cursor Encoding/Decoding

```typescript
import { base64Encode, base64Decode } from '@oxlayer/foundation-http-kit';

// Encode cursor state
const cursor = base64Encode({ offset: 50, limit: 50 });
// Returns: "eyJvZmZzZXQiOjUwLCJsaW1pdCI6NTB9"

// Decode cursor state
const state = base64Decode<{ offset: number; limit: number }>(cursor);
// Returns: { offset: 50, limit: 50 }
```

## License

MIT
