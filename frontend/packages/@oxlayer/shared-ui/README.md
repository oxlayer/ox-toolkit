# @oxlayer/shared-ui

Shared React UI primitives, components, hooks, and design tokens for OxLayer web apps.

- Tailwind v4
- ESM, source-shipped TypeScript (consumed via bundler — vite, next, etc.)
- Base-UI + Radix primitives, DnD Kit, Motion, Recharts, Shiki, and more

## Install

```sh
bun add @oxlayer/shared-ui
# peer deps
bun add react react-dom next-themes tailwindcss
```

## Usage

```ts
import { Button } from "@oxlayer/shared-ui/components/base/button";
import "@oxlayer/shared-ui/styles";        // base tokens / globals
import "@oxlayer/shared-ui/web-styles";    // web-app extras (optional)
```

Tailwind v4 consumers should include the package in their content scan:

```css
@source "../../node_modules/@oxlayer/shared-ui/src";
```

## Subpath exports

| Subpath | Resolves to |
|---|---|
| `.` | `src/index.ts` |
| `./styles` | base CSS tokens / globals |
| `./web-styles` | web-app CSS extras |
| `./lib`, `./lib/*` | utilities |
| `./hooks`, `./hooks/*` | React hooks |
| `./tokens` | design tokens |
| `./components/*` | all components |
| `./components/base/*` | base primitives |
| `./components/animation/*` | animation components |
| `./components/patterns/*` | pattern compositions |
| `./primitives` | low-level primitives |

## License

Apache-2.0
