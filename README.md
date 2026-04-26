# OxLayer Toolkit

Node.js + React toolkit for production-grade multi-tenant SaaS applications.
A monorepo of foundation kits, capabilities, adapters, and a shared UI
library that consumers (your apps) import as workspace dependencies.

## What's inside

```
backend/
  foundation/       Domain primitives — entities, value objects, repositories,
                    app/http/persistence/testing kits.  Apache 2.0.
  capabilities/     Single-responsibility capabilities (auth, cache, queues,
                    search, telemetry, …) and adapters (Postgres, Redis,
                    RabbitMQ, …).  Apache 2.0.
  pro/              Multi-tenant adapters and tenancy primitives.
                    Business Source License 1.1 — see backend/pro/LICENSE.
  snippets/         Code templates the create-backend CLI generates.
frontend/
  packages/
    @oxlayer/shared-ui/   Shared React component library.
    @{acme,globex,initech,template}/ui/   Brand customization examples.
  capabilities-web/state/ Offline-first sync engine for the browser.
cli/
  create-backend/   Project scaffolder (Hono + capabilities + tenancy).
  create-frontend/  Project scaffolder (React + shared-ui + auth).
  keycloak/         Keycloak realm bootstrap CLI.
mcp_oxlayer/        MCP server with embedded architecture docs.
specs/              Spec-driven development artifacts.
.specify/           SpecKit scaffolding.
.claude/            Project rules and skills (cortex skill, oxlayer-ops rules).
```

## Quick start

```bash
git clone https://github.com/oxlayer/ox-toolkit.git
cd ox-toolkit
bun install
bun run typecheck
bun run lint
```

### Consuming the toolkit from a sibling project

OxLayer is designed to be consumed via Bun workspace from a sibling clone.
Layout:

```
~/2027/
├── oxlayer/ox-toolkit/                  ← this repo
└── your-org/your-app/                   ← consumer
```

In your consumer's `package.json`:

```json
{
  "workspaces": [
    "apps/*/*",
    "packages/*",
    "../../oxlayer/ox-toolkit/backend/foundation/*",
    "../../oxlayer/ox-toolkit/backend/capabilities",
    "../../oxlayer/ox-toolkit/backend/capabilities/*",
    "../../oxlayer/ox-toolkit/backend/capabilities/adapters/*/*",
    "../../oxlayer/ox-toolkit/backend/capabilities/telemetry/*",
    "../../oxlayer/ox-toolkit/backend/pro/tenancy",
    "../../oxlayer/ox-toolkit/backend/pro/adapters/*/*",
    "../../oxlayer/ox-toolkit/cli/keycloak",
    "../../oxlayer/ox-toolkit/frontend/packages/@oxlayer/*"
  ]
}
```

Then in any of your packages:

```json
{
  "dependencies": {
    "@oxlayer/foundation-domain-kit": "workspace:*",
    "@oxlayer/capabilities-auth": "workspace:*",
    "@oxlayer/capabilities-adapters-postgres": "workspace:*",
    "@oxlayer/pro-tenancy": "workspace:*"
  }
}
```

`bun install` in the consumer resolves the `workspace:*` references via
filesystem symlink to the sibling clone. Edit toolkit code, save, the
consumer sees the change immediately.

## Tooling

| Tool | Why | Version |
|---|---|---|
| **Bun** | Package manager + workspace runner | `1.2.13+` |
| **Turborepo** | Task orchestration with input/output cache | `2.9+` |
| **Lefthook** | Fast git hooks (pre-commit + pre-push) | `1.13+` |
| **oxlint** | Rust-based linter, ~50× ESLint | `0.15+` |
| **eslint** | Flat config with `typescript-eslint` for IDE | `9+` |

Standard scripts:

```bash
bun run typecheck    # turbo run typecheck across all packages
bun run lint         # oxlint + eslint
bun run test         # turbo run test
bun run build        # turbo run build with topological order
```

## Spec-driven development

Substantial work starts in [`specs/`](./specs/README.md) using
[SpecKit](https://github.com/github/spec-kit). Slash commands for Claude
Code: `/speckit-constitution`, `/speckit-specify`, `/speckit-plan`,
`/speckit-tasks`, `/speckit-implement`. Live in [`.claude/skills/`](./.claude/skills/).

The non-negotiable engineering principles live in
[`.specify/memory/constitution.md`](./.specify/memory/constitution.md).

## Cortex skill

The `cortex` skill is a verb-dispatcher for OxLayer's dev pipeline:

```
cortex setup     fresh install + topo build
cortex check     typecheck + lint + test on affected
cortex test      turbo run test with filtering
cortex build     turbo run build with filtering
cortex bench     run benchmarks
cortex infra     docker-compose for local infra
cortex mcp       MCP server operations
cortex audit     open-source readiness scan
cortex packages  workspace inspection
```

See [.claude/skills/cortex/SKILL.md](./.claude/skills/cortex/SKILL.md).

## License

The repository ships under a mixed-license model:

- **Apache 2.0** for everything except `backend/pro/`. See [`LICENSE`](./LICENSE).
- **Business Source License 1.1** for `backend/pro/`. See
  [`backend/pro/LICENSE`](./backend/pro/LICENSE). Source-available with an
  additional use grant for non-production and small single-tenant
  deployments. Multi-tenant production use requires a commercial license.

## Contributing

Contributions are welcome to the Apache 2.0 portions. The BSL portion
(`backend/pro/`) is also open to contributions, with the standard CLA
that accepts the BSL terms.

See `CLAUDE.md` and `.claude/rules/oxlayer-ops.md` for the project's
engineering conventions.
