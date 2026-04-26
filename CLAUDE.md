# OxLayer — Claude Code project instructions

This file is loaded by Claude Code (and other Anthropic-powered tools) at the
start of every session in this repo. Read it before reading anything else.

## What this repo is

OxLayer is a **multi-tenant SaaS platform toolkit** organized as a Bun + Turborepo
monorepo. Three layers under `backend/`:

- **`foundation/`** — domain primitives (entities, value objects, repositories,
  app/http/persistence/testing kits). Apache 2.0.
- **`capabilities/`** — single-responsibility capabilities (auth, cache, queues,
  search, telemetry, …) and their adapters (Postgres, Redis, RabbitMQ, …).
  Apache 2.0.
- **`pro/`** — multi-tenant adapters and tenancy primitives. **BSL 1.1**
  (commercial license required for production multi-tenant use; see
  `backend/pro/LICENSE`).

Plus `frontend/` (shared-ui + brand packages), `cli/`, `channels/`, `apps/`
(reference implementations), `mcp_oxlayer/` (MCP server with embedded docs),
and `infra_oxlayer/` (docker-compose for local infra).

## Hard rules

1. **Open source by default.** Do not add references to specific clients,
   internal hostnames, real emails, or proprietary domains. Use generic
   placeholders (`acme`, `globex`, `example.com`). The repo is public —
   sanitize before committing.
2. **Never commit secrets.** `.env`, `.npmrc` with tokens, `*.pem`, `*.key`,
   `credentials.json`, `service-account*.json` are all `.gitignore`d. Real
   values live only locally; `.env.example` and `.npmrc.example` are
   committed templates.
3. **Apache 2.0 vs BSL split is load-bearing.** Anything under `backend/pro/**`
   is BSL-licensed. Do not move BSL code into Apache packages or vice versa
   without explicit user approval.
4. **No direct `process.env` reads.** Use the centralized env loader from
   `@oxlayer/capabilities-internal/env`. The `no-restricted-properties` rule
   in `eslint.config.mjs` and `.oxlintrc.json` enforces this; the only
   exceptions are `internal/env/**`, `**/env.ts`, `*.config.*`, and
   `scripts/**`.
5. **Workspace deps use `workspace:*`.** Never pin a workspace dep to a
   version range — Bun resolves `workspace:*` to the local copy.

## Tooling

- **Package manager: Bun** (`bun install`, `bun add`, `bun --filter <pkg> run X`).
  `bun.lock` is committed. Do not use `npm`, `pnpm`, or `yarn`.
- **Task orchestration: Turborepo** (`turbo.json` at root). Run
  `bun run build|test|lint|typecheck` — these dispatch to `turbo run X`.
  Turbo caches by file hashes; do not bypass the cache without good reason.
- **Linting: oxlint + eslint.** `oxlint` is the fast pre-commit lint
  (Rust-based, ~50× ESLint). `eslint` runs the deeper `typescript-eslint`
  rules in CI and IDEs. Both share the `process.env` rule above.
- **Git hooks: Lefthook.** `pre-commit` runs `oxlint` on staged files;
  `pre-push` runs full `lint + typecheck`. Don't `--no-verify` unless the
  user explicitly asks.
- **TypeScript:** every package extends `tsconfig.base.json` (or
  `tsconfig.frontend.json` for JSX packages). Don't redefine `target`,
  `lib`, `types`, `strict` — change the base if you need to.

## Spec-driven development

Substantial work starts in [`specs/`](./specs/README.md), driven by
[SpecKit](https://github.com/github/spec-kit). The slash commands are
`/speckit-constitution`, `/speckit-specify`, `/speckit-plan`,
`/speckit-tasks`, `/speckit-implement` (plus optional `/speckit-clarify`,
`/speckit-analyze`, `/speckit-checklist`). They live in `.claude/skills/`.

- Don't implement a feature larger than ~1 file without a spec.
- Bug fixes, dep bumps, doc edits, and refactors don't need a spec.
- Specs reference concrete files and capabilities. Avoid handwave designs.

The non-negotiable engineering principles live in
`.specify/memory/constitution.md` and override any individual spec.

## Conventions

- **Commits:** `<type>(<scope>): <subject>` — types are `feat`, `fix`,
  `chore`, `docs`, `refactor`, `test`, `perf`. Scope is usually the package
  short name (`auth`, `pro-tenancy`, `cli`, …). Reference spec numbers
  when applicable: `feat(auth): support device flow (spec 0007)`.
- **Branches:** trunk-based on `main`. Short-lived feature branches.
  Long-lived branches like `v2` are not used.
- **PR titles** mirror the commit subject. Bodies summarize *why*.
- **Co-authoring:** when Claude Code authors changes, the
  `Co-Authored-By: Claude` trailer is added automatically by the slash
  command — don't add it manually.

## Things the assistant should NOT do without explicit user approval

- `git push --force` (history rewrite). Especially never to `main`.
- `git filter-repo` (history rewrite).
- Move code between Apache and BSL directories.
- Add a new top-level workspace area (apps/, backend/X/, …).
- Change the licensing of `backend/pro/`.
- Run destructive commands on shared infra (docker volumes, k8s deploys,
  managed databases).
- Open issues / PRs on GitHub on behalf of the user.

## Things the assistant SHOULD do without asking

- Read any file in the repo to gather context.
- Run `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`
  locally to validate changes before committing.
- Edit code, write specs, write tests, update docs.
- Create local commits (don't push without confirmation).

## When in doubt

- Prefer the smaller change.
- Prefer the change that doesn't move code across the Apache↔BSL boundary.
- Ask the user instead of guessing.
- Read the spec before reading the code; read the code before writing the
  PR description.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
