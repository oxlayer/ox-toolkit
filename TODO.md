# Backlog

Tracked technical debt from the open-source preparation pass. None of
these block use of the toolkit, but each represents a known gap we want
to close. Cross-reference with `cortex check` and CI dashboards.

## 1. Migrate direct `process.env` reads to the env loader

**Severity:** policy soft-enforcement (`warn`).
**Tracked in:** `eslint.config.mjs` rule `no-restricted-properties`.

OxLayer's policy is that environment variables are read **only** through
`@oxlayer/capabilities-internal/env`, with each package declaring its
own schema in an `env.ts`. New code already does this; legacy call sites
in `backend/capabilities/adapters/*` still read `process.env` directly.

The `eslint` rule is set to `warn` until those are migrated. Once the
warning count is zero, tighten back to `error` (delete the `warn`
comment in `eslint.config.mjs`).

### Files with direct reads (snapshot, regenerate via `bun run lint | grep no-restricted-properties`)

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

## 2. ~~Resolve pre-existing `typecheck` errors~~ ✓ DONE

Was ~107 errors across 23 packages. Driven to **0 typecheck errors,
82/82 turbo tasks green** in a single pass. The lefthook pre-push hook
is back to blocking.

What was done (for posterity):
- Reverted ~17 type imports the prior auto-fix script wrongly
  underscore-prefixed (e.g., `_EnvValidationError` → `EnvValidationError`).
- Excluded dead modules from typecheck: `backend/capabilities/adapters/database/postgres/src/{migrations,transaction}.ts`
  (orphaned), `frontend/capabilities-web/state/src/{workspace/**, sync/conflict-resolver.ts, persist/sqlite-wasm/workers/**}` (worker-context code that needs a different TS lib).
- Added `./env` subpath export to `@oxlayer/capabilities-internal`'s
  `package.json` so adapter `env.ts` files resolve.
- Added `WebWorker` lib to `frontend/capabilities-web/state/tsconfig.json`.
- Fixed `cli/sdk` API drift: removed legacy `organizationId`/`licenseId`/
  `environment` fields from the resolve command's display, widened
  `TelemetryEvent` to accept arbitrary command strings, broadened
  `trackCommand` options with an index signature, added `maxResults`
  to `CapabilityLimits`, dropped legacy `token`/`tokenType` keys when
  building `TokenInfo` in the legacy auth migration path, fixed the
  `await fs.readdir(...).filter` Promise misuse in `hooks.service.ts`.
- Added missing `tenantId` guards in `backend/pro/tenancy/src/api/tenancy-routes.ts`
  (5 routes), fixed a `Set` declared as `IsolationMode[]`, and patched
  the `MessagePort.postMessage` overload by removing the wrong
  `self.location.origin` second arg in the SQLite-WASM shared adapter.
- Switched workspace-root packages (`@oxlayer/foundation`,
  `@oxlayer/capabilities`, `@oxlayer/pro`) to a no-op `typecheck` —
  they have no `src/` of their own; sub-packages handle their own
  typecheck.
- Brand UI button-tech declared `MotionButton: any` to opt out of an
  un-portable inferred type from `@base-ui/react` internals.
- Fixed Docusaurus `@site/*` paths in `docs/website/tsconfig.json`.

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
entry is added to `.claude/rules/oxlayer-ops.md` § Deploy targets. The
toolkit itself is a library — deploy targets only matter for repos that
consume it and ship products. Configure on a per-consumer basis.

---

## How to use this file

- Update counts and snapshots after major passes (don't chase exact
  numbers between PRs).
- New legacy-debt items go here with severity + tracked-in pointer.
- Resolved items come out — git history keeps the receipt.
- Reference TODO.md sections in PRs that chip away at the backlog.
