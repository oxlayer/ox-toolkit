# Environment Variables Contract System

## Overview

The `@oxlayer/capabilities-internal/env` module provides a **one-shot, fail-fast** environment variable validation system. Each package declares its env requirements, and the app validates all envs once at startup.

## Key Principles

1. **Declare once, validate at boot** - Packages declare env schemas; app validates once
2. **Fail fast** - All env errors are reported immediately, not when code path executes
3. **No silent defaults** - Optional vars must have explicit defaults
4. **Type-safe** - Loaded env is fully typed based on schema
5. **No `process.env` in adapters** - All env access goes through validated config

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     App Entrypoint                          │
│                                                               │
│  // Aggregate all schemas                                    │
│  const appEnvSchema = mergeEnvSchemas(                       │
│    telemetryEnv,                                             │
│    postgresEnv,                                             │
│    rabbitmqEnv,                                             │
│  );                                                          │
│                                                               │
│  // Validate ONCE at startup                                 │
│  export const ENV = loadEnv(appEnvSchema);  ← FAILS HERE    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frozen, Typed ENV                          │
│  {                                                           │
│    PG_HOST: "localhost",                                     │
│    PG_PORT: 5432,                                            │
│    RABBITMQ_URL: "amqp://...",                              │
│    OTEL_SERVICE_NAME: "my-api",                              │
│    ...                                                        │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### 1. Package declares its env schema

```ts
// staples/adapters/postgres/env.ts
import type { EnvSchema } from '@oxlayer/capabilities-internal/env';

export const postgresEnv: EnvSchema = {
  PG_HOST: {
    name: 'PG_HOST',
    required: true,
    parse: String,
    description: 'PostgreSQL host',
  },
  PG_PORT: {
    name: 'PG_PORT',
    required: false,
    default: 5432,
    parse: Number,
  },
};
```

### 2. App aggregates schemas

```ts
// apps/api/src/env.ts
import { loadEnv, mergeEnvSchemas } from '@oxlayer/capabilities-internal/env';
import { postgresEnv } from '@oxlayer/capabilities-adapters-postgres/env';
import { telemetryEnv } from '@oxlayer/capabilities-telemetry/env';

export const ENV = loadEnv(mergeEnvSchemas(
  telemetryEnv,
  postgresEnv,
));
```

### 3. Use validated env values

```ts
// ❌ NEVER
const pg = createPostgresClient({
  host: process.env.PG_HOST,  // ← Don't do this!
});

// ✅ CORRECT
const pg = createPostgresClient({
  host: ENV.PG_HOST,  // ← Type-safe, validated
  port: ENV.PG_PORT,
});
```

## Available Parsers

```ts
import { Parsers } from '@oxlayer/capabilities-internal/env';

Parsers.string     // (raw: string) => string
Parsers.number     // (raw: string) => number
Parsers.boolean    // (raw: string) => boolean  (true/false, 1/0)
Parsers.json<T>    // (raw: string) => T
Parsers.array      // (raw: string) => string[]
Parsers.url        // (raw: string) => URL
Parsers.enum([...])// (raw: string) => T
```

## ESLint Rule

The included `.eslintrc.json` enforces the env contract:

```json
{
  "rules": {
    "no-restricted-properties": [
      "error",
      {
        "object": "process",
        "property": "env",
        "message": "Use the centralized env loader"
      }
    ]
  }
}
```

Allowed only in:
- `internal/env/**` - The env loader itself
- `**/env.ts` - Package env schema declarations

## Generating `.env.example`

```ts
import { generateEnvExample } from '@oxlayer/capabilities-internal/env';
import { appEnvSchema } from './env.js';

const example = generateEnvExample(appEnvSchema);
await fs.writeFile('.env.example', example);
```

Output:
```bash
# Environment Variables
# Generated from env schema - do not edit manually

# PostgreSQL host
# Required
PG_HOST=

# PostgreSQL port
# Optional (default: 5432)
PG_PORT=5432
```
