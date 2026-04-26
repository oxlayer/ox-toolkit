---
name: "cortex"
description: "OxLayer dev pipeline skill — verbs: setup, check, test, build, bench, infra, sdk, mcp, publish, deploy, logs, actions, audit, packages. Read 'cortex:<verb>' as one namespaced surface."
argument-hint: "<verb> [args] — verb ∈ {setup|check|test|build|bench|infra|sdk|mcp|publish|deploy|logs|actions|audit|packages|help}"
compatibility: "OxLayer monorepo only — depends on .claude/rules/oxlayer-ops.md."
metadata:
  source: "specs/_template/"
user-invocable: true
disable-model-invocation: false
---

# /cortex — OxLayer dev pipeline dispatcher

Single skill. The first positional argument is the verb (read it as
`cortex:<verb>` — that's the convention). Subsequent arguments are
verb-specific.

```
cortex setup     [--clean]                                     fresh install + topo build
cortex check     [--filter=<glob>] [--since=HEAD^]             ready-to-PR check
cortex test      [--filter=<glob>] [--package=<name>]
cortex build     [--filter=<glob>] [--force]
cortex bench     [--package=<name>] [--baseline=<ref>]
cortex infra     <up|down|status|logs <service>>
cortex sdk       <version|manifest|release>
cortex mcp       <serve|build|docs>
cortex publish   <local|npm> [--package=<name>] [--dry-run]
cortex deploy    [--check | --logs | --watch | --restart] --target=<name>
cortex logs      <target> [--since=5m] [--grep=<pattern>] [--follow]
cortex actions   [list | view <id> | watch <id> | rerun <id>] [--limit=10]
cortex audit                                                   open-source readiness scan
cortex packages  <list|deps|drift|license>
cortex help                                                    prints this menu
```

## Pre-flight (every invocation)

1. If no verb supplied, or `verb=help`, print the menu above + the
   workspace topology from `.claude/rules/oxlayer-ops.md`, then stop.
   No tool calls.
2. Read `.claude/rules/oxlayer-ops.md` (workspace filters, infra ports,
   SDK pipeline, leak patterns). Don't hard-code these.
3. Confirm `bun` on PATH; abort with `curl -fsSL https://bun.sh/install | bash`
   if not.
4. Verb-specific checks:
   - `infra`: confirm `docker` + `docker-compose` on PATH.
   - `actions`: confirm `gh` on PATH + `gh auth status` succeeds.
   - `mcp serve`: confirm `node` on PATH (MCP server runs over stdio
     via node, not bun, until bundled differently).

## Verb: `setup`

Fresh-clone setup. Use after `git clone` or after a destructive
`bun install` failure. Idempotent.

```
cortex setup           — bun install + build foundation+capabilities (no apps)
cortex setup --clean   — also wipe node_modules and bun.lock first
```

### Steps

1. Optional: `--clean` →
   ```bash
   find . -name node_modules -type d -not -path "*/node_modules/*" -exec rm -rf {} +
   rm -f bun.lock
   ```
2. `bun install --frozen-lockfile` (if `bun.lock` exists) or
   `bun install`.
3. `bun run lefthook install` (idempotent — wires git hooks).
4. Build in topological order (filters from `oxlayer-ops.md`):
   ```bash
   bunx turbo run build --filter='./backend/foundation/**'
   bunx turbo run build --filter='./backend/capabilities/**'
   bunx turbo run build --filter='./backend/pro/**'
   ```

Skip apps (`./apps/**`, `./frontend/**`, `./cli/**`, `./channels/**`) —
those are heavier and not always needed for capability dev.

Report: count of installed packages, total build time, any failed
builds.

## Verb: `check`

"Is this branch ready to push?" Combines the checks the pre-push hook
runs, plus `git status` and an "affected packages" filter.

```
cortex check                      — typecheck + lint + test on affected
cortex check --filter='@oxlayer/capabilities-auth'
cortex check --since=main         — affected since main (not HEAD^)
```

### Steps (parallel via single Bash with `&&`)

```bash
git status --short \
  && bunx turbo run typecheck lint test --filter='[<since>]' --output-logs=errors-only
```

`<since>` defaults to `HEAD^` (previous commit). With `--filter`, use
that instead of `[HEAD^]`.

### Output

- "Affected packages: N (foundation X, capabilities Y, pro Z)".
- For each task (typecheck/lint/test): `✓ <pkg>` or `✗ <pkg> (<error count>)`.
- If any failure: print top 5 errors per package, suggest `cortex test
  --package=<name>` for full output.

## Verb: `test`

```
cortex test                              — turbo run test (all)
cortex test --package=@oxlayer/foo       — single package
cortex test --filter='./backend/**'      — by glob
```

### Execution

```bash
bunx turbo run test --filter=<scope> --output-logs=errors-only
```

Parse Vitest/Bun-test output. Format:

```
✓ 38 packages, 412 tests, 0 fail (12s)
```

Or on failure:

```
✗ 2 packages failing:
  @oxlayer/capabilities-auth (3 fail)
    - JWT.verify() rejects expired token (jwt.unit.test.ts:45)
    - ...
  @oxlayer/foundation-domain-kit (1 fail)
    - ...
  Re-run: bun --filter <pkg> run test
```

## Verb: `build`

```
cortex build                          — turbo run build (all, cached)
cortex build --filter='./backend/foundation/**'
cortex build --force                  — clear .turbo cache first
```

### Execution

```bash
[ "$FORCE" ] && rm -rf .turbo
bunx turbo run build --filter=<scope>
```

Report cache hits/misses (Turbo prints this). On dist drift detection
(source newer than dist), warn and suggest `cortex build --force`.

## Verb: `bench`

Run benchmarks. Reads packages with a `bench` script in package.json
(see `oxlayer-ops.md` § Benchmark targets — empty until benches are
added).

```
cortex bench                              — all packages with bench script
cortex bench --package=@oxlayer/foo
cortex bench --baseline=main              — diff against ref's last bench
```

### Pre-flight

1. Find packages with `bench` script:
   ```bash
   find . -name package.json -not -path '*/node_modules/*' -not -path '*/dist/*' \
     | xargs jq -r 'select(.scripts.bench) | .name' 2>/dev/null
   ```
2. If none, abort with "no benchmarks defined yet — add a `bench`
   script to a package.json to start".

### Execution

```bash
bunx turbo run bench --filter=<scope> --output-logs=full
```

Save results to `.turbo/cortex-bench/<git-sha>.json`. With
`--baseline`: diff against the latest run from that ref. Format:

```
@oxlayer/foundation-domain-kit: 12,400 ops/s (+2.1% vs main)
@oxlayer/capabilities-cache:    98,200 ops/s (-0.3% vs main)
```

## Verb: `infra`

Wrapper around the local docker-compose stack at `infra_oxlayer/`.

```
cortex infra up                       — start full stack
cortex infra up postgres redis        — start subset
cortex infra down [--volumes]         — stop (optionally wipe volumes)
cortex infra status                   — ps + health summary
cortex infra logs <service> [--follow] [--since=5m]
```

### `up`

```bash
cd infra_oxlayer && docker-compose up -d <services?>
```

After up: poll health for 30s. Print:

```
✓ postgres (5432) — accepting
✓ redis (6379) — accepting
⚠ keycloak (8080) — starting (may take 60s)
```

### `down`

```bash
cd infra_oxlayer && docker-compose down [-v]
```

Confirm before `--volumes` (wipes data — write op).

### `status`

```bash
cd infra_oxlayer && docker-compose ps --format json | jq -r '.[] | "\(.Service)\t\(.State)\t\(.Health // "n/a")"'
```

### `logs`

```bash
cd infra_oxlayer && docker-compose logs <service> --since=<since> --tail=200 [-f]
```

For `--follow`: `run_in_background: true`. Return shell id +
`BashOutput` instructions.

## Verb: `sdk`

Wrapper around the SDK release pipeline.

```
cortex sdk version       — print next version (no side effects)
cortex sdk manifest      — generate manifest.json for current version
cortex sdk release       — full pipeline (write op — confirm)
```

### `version`

```bash
bun run sdk:version
```

Outputs `2026_MM_DD_NNN`. Read-only — safe.

### `manifest`

```bash
bun run sdk:manifest
```

Generates `release-sdk/<version>/manifest.json`. Show the file path +
size summary.

### `release`

Confirm first ("Build and stage SDK release `<version>`? yes/no"). Then:

```bash
bun run sdk:release
```

After: print artifact paths + suggest `git push origin --tags` if a
tag was created.

## Verb: `mcp`

Operations on the MCP server (`mcp_oxlayer/`).

```
cortex mcp build         — rebuild dist/
cortex mcp serve         — run server over stdio (foreground)
cortex mcp docs          — re-embed docs into docs-embedded.ts
```

### `build`

```bash
bun --filter @oxlayer/mcp run build
```

### `serve`

```bash
node mcp_oxlayer/dist/index.js
```

`run_in_background: true`. Return shell id. Tell the operator to
configure their client at `.mcp.json` to point at
`${OXLAYER_REPO}/mcp_oxlayer/dist/index.js`.

### `docs`

```bash
bun --filter @oxlayer/mcp run docs:embed
```

If the script doesn't exist (check package.json scripts first), abort
with the manual recipe from `mcp_oxlayer/README.md`.

## Verb: `publish`

Publish workspace packages. Two destinations:

- `local` — Verdaccio at `localhost:4873` (started via
  `cortex infra up verdaccio`). For internal SDK consumption testing.
- `npm` — public registry. **Only Apache 2.0 packages.** Anything
  under `backend/pro/**` is BSL — never publish to npm.

```
cortex publish local                          — all publishable packages → Verdaccio
cortex publish local --package=@oxlayer/foo
cortex publish npm --dry-run                  — show what would publish
cortex publish npm --package=@oxlayer/foundation-domain-kit
```

### Pre-flight (every publish)

1. **License gate**: refuse `npm` destination for any package whose
   path is under `backend/pro/**` or whose `package.json` license is
   not `Apache-2.0`. Print: "package <name> is BSL/private — only
   `cortex publish local` is allowed".
2. **Build artifact**: verify `dist/` exists and is newer than `src/`.
   If stale, suggest `cortex build --filter=<pkg>` first.
3. **Version bump**: read `package.json` version. Compare to last
   published (`npm view <name> version`). If unchanged, abort with
   "version not bumped — `bun --filter <pkg> npm version patch` first".
4. **Token**:
   - `local`: read `${VERDACCIO_TOKEN}` from env or `.npmrc.example`.
     If missing, suggest `pnpm token add --registry http://localhost:4873/`.
   - `npm`: read `${NPM_TOKEN}` from env. If missing, abort with
     "set NPM_TOKEN; never commit to .npmrc".

### Execution

Always **confirm before write**:

```
About to publish 3 packages to <local|npm>:
  - @oxlayer/foundation-domain-kit@0.2.0
  - @oxlayer/foundation-app-kit@0.2.0
  - @oxlayer/capabilities-cache@0.3.1
Proceed? yes/no
```

On `yes`:

```bash
# local
bun --filter <pkg> publish --registry http://localhost:4873/

# npm
bun --filter <pkg> publish --access public
```

`--dry-run`: pass `--dry-run` to bun publish; print tarball contents
+ predicted version, no upload.

After: print published URLs (`https://www.npmjs.com/package/<name>` or
`http://localhost:4873/-/package/<name>`).

## Verb: `deploy`

Deploy a target from `oxlayer-ops.md` § Deploy targets. Until a
target is configured there, every invocation aborts with:

> No deploy target configured. Add an entry to
> `.claude/rules/oxlayer-ops.md` § Deploy targets.

OxLayer is a toolkit; `apps/control-panel/` is the only deployable
reference impl. The verb is intentionally generic so adding a target
is config-only.

```
cortex deploy --target=panel-prd                    — default action: --check
cortex deploy --target=panel-prd --check            — "did the latest deploy work?"
cortex deploy --target=panel-prd --logs             — failed-step logs from last deploy
cortex deploy --target=panel-prd --watch            — stream rollout
cortex deploy --target=panel-prd --restart          — write op (confirms)
```

### Resolving target

1. Read `oxlayer-ops.md` § Deploy targets table.
2. If `<name>` not found, list available targets + abort.
3. Dispatch by target type:
   - `docker` → `docker compose -f <file> ps|logs|up|restart`
   - `fly.io` → `flyctl status|logs|deploy|restart`
   - `k8s`    → `kubectl get|logs|rollout`

### `--check` (default)

Run target-specific status query in parallel with the equivalent of
`cortex actions list --limit=3`:

```
✓ panel-prd (docker)
  api: 1/1 healthy (image abc123, 14m old)
  dashboard: 1/1 healthy (image abc123, 14m old)
✓ Recent CI runs:
  2026-04-26 03:10 success push main "ci: …" #482
```

### `--logs`

Last 200 lines of failing-step / failing-pod / failing-container
output, depending on target type. If everything is healthy, say so
and bail.

### `--watch`

Stream the rollout. `run_in_background: true`. Return shell id +
`BashOutput` instructions.

### `--restart`

Write op. Confirm first ("Restart `<target>`? yes/no"). Then dispatch
to the target type's restart command. After: tail status for 60s.

## Verb: `logs`

Generic logs fetcher. Two modes based on first argument:

```
cortex logs <infra-service>          — alias for `cortex infra logs <service>`
cortex logs <deploy-target>          — fetch from a deploy target
```

Resolution: if `<arg>` matches a service in `oxlayer-ops.md` §
Local infrastructure, treat as infra. If it matches a deploy target,
dispatch via that target's logs command. Otherwise, list both
catalogs + abort.

```
cortex logs postgres --since=10m              → infra logs postgres
cortex logs panel-prd --grep=ERROR --follow   → deploy logs from panel-prd
```

### Common flags

`--since=<duration>` (default `5m`), `--grep=<pattern>`,
`--follow` (background, returns shell id), `--tail=<N>` (default 200
for non-follow).

### Output rules

- If empty: "No matching lines in <target> --since <since>" — don't
  pretend.
- Highlight `[ERROR]`, `WARN`, `5XX`, `FATAL`, `panic` patterns.
- For non-follow: print just matched lines, no preamble.

## Verb: `actions`

```
cortex actions list                       — recent runs
cortex actions view <id>                  — failed-step tail
cortex actions watch <id>                 — background watch
cortex actions rerun <id>                 — write op, confirms
```

Wrapper around `gh run *` for `oxlayer/oxlayer`. Removes the
per-invocation `--repo` flag.

### `list`

```bash
gh run list --repo oxlayer/oxlayer --limit <limit> \
  --json databaseId,status,conclusion,name,headBranch,event,createdAt \
  | jq -r '.[] | "\(.createdAt[0:19]) \(.status)/\(.conclusion // "running") \(.event) \(.headBranch) \(.name) #\(.databaseId)"'
```

Highlight `failure` conclusions.

### `view <id>`

```bash
gh run view <id> --repo oxlayer/oxlayer --log-failed | tail -200
```

### `watch <id>`

```bash
gh run watch <id> --repo oxlayer/oxlayer --exit-status
```

`run_in_background: true`. Return shell id + monitor instructions.

### `rerun <id>`

Confirm first ("Rerun failed jobs in
https://github.com/oxlayer/oxlayer/actions/runs/<id>? yes/no"). Then:

```bash
gh run rerun <id> --repo oxlayer/oxlayer --failed
```

## Verb: `audit`

Open-source readiness scan. Codifies the pre-public checks. Read-only.

Self-references in `.claude/rules/oxlayer-ops.md` § Audit allowlist
are excluded — those files document the patterns intentionally.

### Excludes (applied to every check)

```bash
# Common excludes used by every step
EXCLUDE_PATHS=(
  ':!node_modules' ':!.git'
  ':!bun.lock' ':!pnpm-lock.yaml' ':!package-lock.json' ':!yarn.lock'
  ':!.claude/rules/oxlayer-ops.md'    # docs the rules
  ':!.claude/skills/cortex/SKILL.md'  # docs the regex
  ':!**/templates/**'                  # CLI scaffolding
  ':!**/dist/**' ':!**/build/**'
)
```

### Steps (each emits `✓` or `❌`)

1. **Secret patterns** (excluding `AKIAIOSFODNN7EXAMPLE` — official
   AWS docs example):
   ```bash
   git grep -nE '(npm_[A-Za-z0-9]{30,}|ghp_[A-Za-z0-9]{30,}|xoxb-[A-Za-z0-9-]+|AKIA[A-Z0-9]{16}|sk_live_)' -- "${EXCLUDE_PATHS[@]}" \
     | grep -v 'AKIAIOSFODNN7EXAMPLE'
   ```

2. **Forbidden identifiers** (case-insensitive):
   ```bash
   git grep -niE '\b(fatorh|eureca|localiza|bradesco)\b' -- "${EXCLUDE_PATHS[@]}" \
     | grep -viE '(localization|localize)'   # word-stem false positives
   ```

3. **`.env` / `.npmrc` tracked in git** (must be 0):
   ```bash
   git ls-files | grep -E '(^|/)(\.env$|\.env\.local|\.env\.production|\.npmrc$)'
   ```
   `.env.example` and `.npmrc.example` are fine.

4. **LICENSE files present**:
   ```bash
   test -f LICENSE && test -f backend/pro/LICENSE
   ```

5. **Personal paths in committed files** (excluding `/home/linuxbrew/`
   which is Linuxbrew's standard install prefix):
   ```bash
   git grep -nE '(/home/[a-z]+|/Users/[a-zA-Z]+/)' -- '*.ts' '*.md' '*.json' '*.yaml' '*.yml' "${EXCLUDE_PATHS[@]}" \
     | grep -v '/home/linuxbrew/'
   ```

6. **License declaration consistency** (delegates to
   `cortex packages license`):
   - `backend/pro/**` should be `BUSL-1.1` (or `SEE LICENSE IN LICENSE`).
   - Outside `backend/pro/**`: `Apache-2.0` or `"private": true`.

### Output

Pass/fail table. On any fail: list offending files + suggested fix
(rotate secret, sanitize identifier, add to `.gitignore`,
`git rm --cached`, etc).

Final verdict: `READY FOR PUBLIC` (all green) or `BLOCKED` (with
specific TODOs).

## Verb: `packages`

Workspace inspection. Read-only.

```
cortex packages list                    — all packages with version + license
cortex packages deps <name>             — workspace deps of <name>
cortex packages drift                   — workspace deps that don't use 'workspace:*'
cortex packages license                 — license per package
```

### `list`

```bash
find . -name package.json -not -path '*/node_modules/*' -not -path '*/dist/*' \
  | xargs -I {} jq -r '. | "\(.name)\t\(.version)\t\(.license // "?")\t\(.private // false)"' {} 2>/dev/null \
  | sort
```

Group by Apache (root) vs BSL (`backend/pro/**`).

### `deps <name>`

Find which workspace packages depend on `<name>`:

```bash
find . -name package.json -not -path '*/node_modules/*' \
  | xargs grep -l "\"<name>\":" 2>/dev/null
```

### `drift`

Find workspace internal deps NOT pinned to `workspace:*`:

```bash
find . -name package.json -not -path '*/node_modules/*' -not -path '*/dist/*' \
  | xargs grep -E '"@oxlayer/[^"]+":\s*"\^?[0-9]' 2>/dev/null
```

These should all be `workspace:*` — `oxlayer-ops.md` rule 5.

### `license`

Verify Apache 2.0 vs BSL boundaries:

```bash
find backend/pro -name package.json -not -path '*/node_modules/*' \
  | xargs jq -r '.name + "\t" + (.license // "MISSING")'
```

Anything in `backend/pro/**` should declare `"license": "BUSL-1.1"`
(or `"SEE LICENSE IN LICENSE"`). Anything outside `backend/pro/**`
should be `"Apache-2.0"` or `"private": true`.

## Hard rules

- **Read-only by default.** Write ops are `cortex infra down --volumes`,
  `cortex sdk release`, `cortex actions rerun`. All confirm before
  running.
- **Single source of truth.** Workspace filters, infra ports, SDK
  pipeline, leak patterns live in `.claude/rules/oxlayer-ops.md`.
  Read fresh; don't embed.
- **No new credentials.** Reuses `gh auth login`, `bun`, `docker`.
  Missing dep → print install command + abort.
- **Apache↔BSL boundary is sacred.** Don't move code across
  `backend/pro/**` without explicit operator approval.

## See also

- `.claude/rules/oxlayer-ops.md` — constants this skill reads.
- `CLAUDE.md` — project instructions.
- `specs/README.md` — spec-driven development workflow.
