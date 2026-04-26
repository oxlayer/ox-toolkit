# Specifications

This directory holds **spec-driven development** artifacts for OxLayer.
Each substantial feature, refactor, or architectural change starts here as a
specification before any code is written.

## Layout

```
specs/
├── README.md           — this file
├── 0001-<feature>/     — one folder per spec, numbered chronologically
│   ├── spec.md         — the specification itself (the "what" and "why")
│   ├── plan.md         — implementation plan (the "how")
│   ├── tasks.md        — broken-down tasks (the "in what order")
│   └── notes/          — research, alternatives considered, ADRs
└── _template/          — copy this to start a new spec
```

## Why specs

OxLayer is a multi-tenant platform with cross-cutting capabilities (auth,
tenancy, observability, etc.). A change in one capability often touches
backend kits, the SDK, the CLI, the control panel, and downstream tenants.
Specs let us:

- **Catch design issues before code** — costs hours, not days.
- **Coordinate work** across the foundation/capabilities/pro layers without
  stepping on each other.
- **Onboard contributors** with a written record of why decisions were made.
- **Drive AI assistants** consistently — see `.specify/` and the
  `/speckit-*` slash commands provided by
  [SpecKit](https://github.com/github/spec-kit).

## Workflow

The four core SpecKit slash commands (Claude Code, Cursor, etc.):

1. **`/speckit-constitution`** — *(once per project)* establish the
   non-negotiable engineering principles. Already done — see
   `.specify/memory/constitution.md`.
2. **`/speckit-specify`** — write the spec from a user-facing
   requirement. Don't talk about implementation; talk about the problem
   and the user experience.
3. **`/speckit-plan`** — pick the technical approach. Reference concrete
   files, capabilities, and constraints. Surface alternatives that were
   rejected.
4. **`/speckit-tasks`** — break the plan into PR-sized tasks with
   explicit dependencies.
5. **`/speckit-implement`** — execute the tasks. The spec stays the
   source of truth; code changes that drift from it require updating
   the spec first.

Optional helpers:

- **`/speckit-clarify`** — ask structured questions to de-risk ambiguous
  areas before planning (run before `/speckit-plan`).
- **`/speckit-analyze`** — cross-artifact consistency check (run after
  `/speckit-tasks`, before `/speckit-implement`).
- **`/speckit-checklist`** — generate quality checklists to validate
  requirement completeness.

## Ground rules

- **Specs are the source of truth.** If the code drifts from the spec,
  either update the spec (and explain why) or update the code.
- **One feature, one spec.** Don't bundle unrelated changes.
- **Specs are immutable once shipped.** Amend with a new dated entry at
  the bottom; don't rewrite history.
- **Reference the spec in commits and PRs** (e.g. `feat(auth): X (spec
  0007)`).

See [the OxLayer constitution](../.specify/memory/constitution.md) for
non-negotiable engineering principles that override any spec.
