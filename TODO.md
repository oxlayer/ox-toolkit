# Backlog

Tracked technical debt from the open-source preparation pass. None of
these block use of the toolkit, but each represents a known gap we want
to close. Cross-reference with `cortex check` and CI dashboards.

## 1. Migrate direct `process.env` reads to the env loader

**Severity:** policy soft-enforcement (`warn`).
**Tracked in:** `eslint.config.mjs` rule `no-restricted-properties`.

OxLayer's policy is that environment variables are read **only** through
`@oxlayer/capabilities-internal/env`, with each package declaring its
own schema in an `env.ts`. New code already does this; ~108 legacy call
sites across `apps/control-panel/`, `apps/tower/`, and several
`backend/capabilities/adapters/*` still read `process.env` directly.

The `eslint` rule is set to `warn` until those are migrated. Once the
warning count is zero, tighten back to `error` (delete the `warn`
comment in `eslint.config.mjs`).

### Files with direct reads (snapshot, regenerate via `bun run lint | grep no-restricted-properties`)

- `apps/control-panel/backend/api/src/{config,controllers,services,middleware,infrastructure,index}.ts`
- `apps/tower/src/main/**` and `apps/tower/src/main.ts`
- `backend/capabilities/adapters/database/{influxdb,mongo,postgres}/src/client.ts`
- `backend/capabilities/adapters/messaging/sqs/src/client.ts`
- `backend/capabilities/adapters/search/quickwit/src/{client,indexer,searcher}.ts`
- `backend/capabilities/adapters/vector/qdrant/src/client.ts`

### Migration pattern

```ts
// before
const port = process.env.PORT ?? '3000';

// after
// in <package>/src/env.ts
import { defineEnv } from '@oxlayer/capabilities-internal/env';
export const env = defineEnv({
  PORT: { type: 'string', default: '3000' },
});

// in src/<callsite>.ts
import { env } from './env';
const port = env.PORT;
```

### Suggested order

1. Pick one capability adapter (start with the smallest, e.g. `mongo`).
2. Add `env.ts`, run `bun typecheck`, fix call sites.
3. Confirm `bun run lint` warning count drops by N.
4. Repeat per package; merge in small PRs.

---

## 2. Resolve pre-existing `typecheck` errors

**Severity:** non-blocking pre-push (lefthook `tags: [warn]`); CI is the
gate of record.
**Approximate count:** ~107 errors across 23 packages (snapshot from
the migration pass — `cortex check` for current state).

These are real code-level type drift that pre-dates the open-source
prep — the previous CI only ran `build`, not `typecheck`, so the
errors accumulated. They split into a few buckets:

### a. API drift in CLI / control panel

`@oxlayer/cli` and `@oxlayer/create-{backend,frontend}` reference fields
on response types that were renamed or removed. Examples:

- `CapabilityResolutionResponse` no longer has `organizationId` /
  `licenseId` (cli/src/commands/resolve.command.ts).
- `TokenInfo` doesn't accept `token` (cli/src/services/auth.service.ts).
- `CapabilityLimits` doesn't include `maxResults`.

These need either: (a) regenerating the api-client typings to match
the current control panel API, or (b) updating the CLI call sites to
match the new shape.

### b. Frontend offline-sync (`@oxlayer/capabilities-web-state`)

27 errors in the offline-sync engine — drift between the intent
machine and the database adapter contracts. Needs a focused pass.

### c. Pro tenancy adapters

`@oxlayer/pro-adapters-{mongo,postgres}-tenancy`: tenancy resolver
contract drift and `pro-tenancy/src/api/tenancy-routes.ts` build
failures (Rollup `[plugin dts]` fail to compile).

### d. Brand UI shared components

`@oxlayer/shared-ui` has small internal type drift (`FieldLabel` props
shape, `Button` variant strings).

### e. Foundation and other small ones

A handful of single-digit failures across foundation kits and adapter
packages.

### Workflow

```
cortex check                                    # see current state
bunx turbo run typecheck --filter=<pkg>         # one package at a time
# fix, repeat
```

Tighten the pre-push hook back to blocking once `cortex check` is
green:

```yaml
# lefthook.yml — drop the `|| exit 0` shim
typecheck:
  run: bun run typecheck
```

---

## 3. Lint warnings (non-blocking)

**Count:** ~680.

Mostly `@typescript-eslint/no-explicit-any` and
`@typescript-eslint/no-non-null-assertion`. Both are deliberately set
to `warn`, not `error` — the codebase has many legitimate `any` uses
in adapter glue code where we proxy untyped third-party APIs.

Don't aim for zero. Aim for "no new ones." Each existing one should
be replaced with a real type when the surrounding code is touched.

---

## 4. Re-enable the strict `no-document-cookie` rule

**Location:** `frontend/packages/@oxlayer/shared-ui/src/components/base/sidebar.tsx:88`.

The sidebar persists open/closed state via `document.cookie =` (SSR
hydration depends on it being synchronous). The `unicorn` rule is
disabled with a single-line comment. If we ever migrate to a Cookie
Store API or a wrapper, drop the comment.

---

## 5. Bench targets (skill placeholder)

The `cortex bench` verb expects packages with a `bench` script in
`package.json`. None defined yet. Add benches for:

- Foundation kits (entities, repositories) — establish baseline ops/s.
- Capabilities cache / queues — concurrent throughput.
- Pro tenancy resolver — latency at p50/p95.

---

## 6. Deploy targets (skill placeholder)

`cortex deploy` aborts with "no deploy target configured" until an
entry is added to `.claude/rules/oxlayer-ops.md` § Deploy targets.
The `apps/control-panel/` reference impl is the natural first target
(docker-compose for self-hosted, Fly.io for hosted demo).

---

## How to use this file

- Update counts and snapshots after major passes (don't chase exact
  numbers between PRs).
- New legacy-debt items go here with severity + tracked-in pointer.
- Resolved items come out — git history keeps the receipt.
- Reference TODO.md sections in PRs that chip away at the backlog.
