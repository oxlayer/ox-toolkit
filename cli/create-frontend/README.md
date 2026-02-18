# @oxlayer/create-frontend

Scaffold a new OxLayer frontend app with React, Vite, Tailwind CSS v4, and modern UI components.

## Features

Generated frontends include:

- **React 19** - Latest React with TypeScript
- **Vite** - Lightning-fast build tool with HMR
- **Tailwind CSS v4** - Modern utility-first CSS with `@theme`
- **OxLayer UI Patterns** - Component patterns using tailwind-variants, Base UI
- **ESLint** - Modern flat config with React hooks support
- **Path Aliases** - `@/` mapped to `./src/` for clean imports

## Templates

### Base (`--template base`)

Minimal React + Vite + Tailwind CSS v4 setup.

```
base/
├── src/
│   ├── components/
│   │   ├── button.tsx      # tailwind-variants example
│   │   └── card.tsx         # compound component example
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css            # Tailwind v4 with @theme
```

### Auth (`--template auth`)

Base + Keycloak authentication with SSO.

```
auth/
├── src/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── auth-context.tsx
│   │   │   └── keycloak.ts
│   │   └── keycloak.ts
│   └── .env.example           # Keycloak config
```

### Dashboard (`--template dashboard`)

Auth + React Router v7 + TanStack Query + Layout.

```
dashboard/
├── src/
│   ├── layouts/
│   │   └── root-layout.tsx
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── dashboard.tsx
│   │   └── settings.tsx
│   └── lib/
│       ├── auth/            # Keycloak auth
│       └── query-client.ts  # TanStack Query setup
```

## Usage

### Interactive Mode

```bash
npx @oxlayer/create-frontend my-app
```

### Quick Mode (Defaults)

```bash
npx @oxlayer/create-frontend my-app --defaults
```

### Specify Template

```bash
# Base template
npx @oxlayer/create-frontend my-app --template base

# Auth template
npx @oxlayer/create-frontend my-app --template auth

# Dashboard template
npx @oxlayer/create-frontend my-app --template dashboard
```

## Generated Commands

```bash
cd my-app
pnpm install
pnpm dev
```

## Project Structure

```
my-app/
├── src/
│   ├── components/          # UI components
│   ├── lib/                 # Utilities (auth, api, etc.)
│   ├── routes/              # Route components (dashboard)
│   ├── layouts/             # Layout components (dashboard)
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css           # Global styles
├── package.json
├── vite.config.ts
├── tsconfig*.json
├── eslint.config.js
└── .env.example            # Environment variables (auth/dashboard)
```

## Component Patterns

All generated components follow OxLayer frontend patterns:

```tsx
import { tv, type VariantProps } from 'tailwind-variants';
import { twMerge } from 'tailwind-merge';
import type { ComponentProps } from 'react';

export const buttonVariants = tv({
  base: ['inline-flex items-center justify-center'],
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
    },
  },
});

export interface ButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={twMerge(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}
```

## Theme Colors

Uses CSS variables for theming:

```css
@theme {
  --color-surface: oklch(98% 0.01 270);
  --color-primary: oklch(47% 0.18 265);
  --color-secondary: oklch(90% 0.01 270);
  --color-muted: oklch(94% 0.01 270);
  --color-foreground: oklch(15% 0.02 270);
  --color-destructive: oklch(55% 0.22 25);
  /* ... */
}
```

## Keycloak Configuration (Auth/Dashboard)

Set environment variables in `.env`:

```bash
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=my-app
VITE_KEYCLOAK_CLIENT_ID=my-app-frontend
```

## Routing (Dashboard)

Uses React Router v7 file-based routing:

```tsx
import { createRouter, createRoute, createRootRoute } from 'react-router';

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => import('./routes'),
  path: '/',
  component: Index,
});

const tree = rootRoute.addChildren([indexRoute]);
export const router = createRouter({ routeTree: tree });
```

## Development

```bash
# Install dependencies
pnpm install

# Build CLI
pnpm build

# Test CLI locally
node dist/index.js test-app
```

## License

MIT
