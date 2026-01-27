# OxLayer Frontend Monorepo Guide

Complete guide to structuring OxLayer frontend projects as a monorepo with shared UI components.

## Overview

OxLayer frontend projects use a **monorepo structure** with pnpm workspaces. The key principle is:

> **Single source of truth for UI components, brand-specific customizations only where needed.**

## Architecture

### Package Structure

```
frontend/
├── package.json                    # Workspace root
├── pnpm-workspace.yaml            # Workspace configuration
├── tsconfig.base.json             # Shared TypeScript config
│
└── packages/
    ├── @oxlayer/
    │   └── shared-ui/            # 🔵 SHARED UI (all brands use this)
    │       ├── src/
    │       │   ├── components/   # Base UI components
    │       │   ├── lib/          # Utilities
    │       │   ├── hooks/        # Shared hooks
    │       │   ├── tokens/       # Design tokens
    │       │   └── styles/       # Global styles
    │       └── package.json
    │
    ├── @acme/
    │   └── ui/                   # 🟢 ALO BRAND (customizations)
    │       ├── src/
    │       │   ├── components/
    │       │   │   └── tech/     # Brand-specific components
    │       │   ├── styles/       # Brand CSS overrides
    │       │   └── index.ts      # Re-exports + custom
    │       └── package.json      # Depends on @oxlayer/shared-ui
    │
    ├── @globex/
    │   └── ui/                   # 🟡 GLOBEX BRAND (customizations)
    │       └── ...
    │
    └── @initech/
        └── ui/                   # 🔴 INITECH BRAND (customizations)
            └── ...
```

### Package Responsibilities

| Package | Purpose | Contains |
|---------|---------|----------|
| **@oxlayer/shared-ui** | Shared UI library | All base components, utilities, design tokens |
| **@acme/ui** | Alo brand | Brand overrides, Alo-specific components |
| **@globex/ui** | Globex brand | Brand overrides, Globex-specific components |
| **@initech/ui** | Initech brand | Brand overrides, Initech-specific components |

## Workspace Configuration

### Root package.json

```json
{
  "name": "oxlayer-frontend-workspace",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter './packages/**' dev",
    "build": "pnpm --filter './packages/**' build",
    "lint": "pnpm --filter './packages/**' lint",
    "test": "pnpm --filter './packages/**' test",
    "clean": "pnpm --filter './packages/**' clean",
    "typecheck": "pnpm --filter './packages/**' typecheck"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
  - 'packages/@*/*'
```

### tsconfig.base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "OxLayer Frontend",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  }
}
```

## @oxlayer/shared-ui Package

The shared-ui package contains all common UI components and utilities.

### Package Structure

```
@oxlayer/shared-ui/
├── src/
│   ├── index.ts              # Main export file
│   ├── components/
│   │   ├── base/            # Base UI components (Button, Input, etc.)
│   │   ├── patterns/        # Design patterns (FormField, DataTable)
│   │   └── lib/             # Component library components
│   ├── lib/
│   │   ├── utils.ts         # cn(), formatters, validators
│   │   └── index.ts
│   ├── hooks/
│   │   ├── use-theme.ts
│   │   ├── use-media-query.ts
│   │   └── index.ts
│   ├── primitives/
│   │   └── slot.tsx         # Radix Slot wrapper
│   ├── tokens/
│   │   └── index.ts         # Design token exports
│   └── styles/
│       ├── globals.css
│       └── web-globals.css
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### package.json

```json
{
  "name": "@oxlayer/shared-ui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/globals.css",
    "./web-styles": "./src/styles/web-globals.css",
    "./lib": "./src/lib/index.ts",
    "./hooks": "./src/hooks/index.ts",
    "./tokens": "./src/tokens/index.ts"
  },
  "scripts": {
    "lint": "oxlint src",
    "typecheck": "tsc --noEmit",
    "storybook": "storybook dev -p 6006"
  },
  "dependencies": {
    "@base-ui/react": "^1.0.0",
    "@dnd-kit/core": "^6.3.1",
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.562.0",
    "tailwind-merge": "^3.4.0",
    "tailwind-variants": "^3.2.2",
    "date-fns": "^4.1.0",
    "recharts": "3.6.0"
    // ... all other UI dependencies
  },
  "peerDependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "tailwindcss": ">=3.0.0"
  }
}
```

### Main Export (src/index.ts)

```typescript
/**
 * @oxlayer/shared-ui
 *
 * Shared UI component library for all OxLayer brand packages.
 */

// Design tokens
export * from './tokens';

// Utilities
export { cn } from './lib';

// Primitives
export { Slot } from './primitives/slot';

// Base components (to be migrated)
// export { Button } from './components/base/button';
// export { Input } from './components/base/input';
// ... all 40+ base components

// Lib exports
export * from './lib';

// Hooks
export * from './hooks';
```

## Brand Package Structure

Each brand package (@acme/ui, @globex/ui, @initech/ui) should:

1. **Depend on @oxlayer/shared-ui**
2. **Re-export shared components**
3. **Add brand-specific customizations**
4. **Override design tokens via CSS variables**
5. **Contain only brand-specific components**

### Brand Package Structure

```
@globex/ui/
├── src/
│   ├── index.ts              # Re-exports + brand components
│   ├── components/
│   │   └── tech/             # 🔵 BRAND-SPECIFIC ONLY
│   │       ├── badge-tech.tsx
│   │       ├── button-tech.tsx
│   │       ├── card-tech.tsx
│   │       └── ...
│   ├── styles/
│   │   ├── brand.css         # 🎨 BRAND CSS OVERRIDES
│   │   └── globals.css       # Imports shared styles
│   └── pages/               # Brand-specific page components
├── package.json             # Depends on @oxlayer/shared-ui
└── tsconfig.json
```

### Brand package.json

```json
{
  "name": "@globex/ui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/globals.css",
    "./web-styles": "./src/styles/web-globals.css"
  },
  "scripts": {
    "lint": "oxlint src",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@oxlayer/shared-ui": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "@types/react": "19.2.8",
    "@types/react-dom": "19.2.3",
    "typescript": "5.9.3"
  }
}
```

### Brand index.ts

```typescript
/**
 * @globex/ui
 *
 * Globex brand UI components.
 * Re-exports shared components and adds Globex-specific customizations.
 */

// Re-export everything from shared-ui
export * from '@oxlayer/shared-ui';

// Re-export styles
export { defaultStyles } from '@oxlayer/shared-ui/styles';
export { defaultWebStyles } from '@oxlayer/shared-ui/web-styles';

// Brand-specific components
export { BadgeTech } from './components/tech/badge-tech';
export { ButtonTech } from './components/tech/button-tech';
export { CardTech } from './components/tech/card-tech';
// ... other tech components
```

### Brand CSS Overrides (src/styles/brand.css)

```css
/**
 * Globex Brand Overrides
 * Override design tokens for Globex brand
 */

:root {
  /* Globex brand colors */
  --color-brand: #caea28;
  --color-brand-hover: #b5d820;
  --color-brand-foreground: #000000;

  /* Globex-specific overrides */
  --color-surface: 248 250 252;
  --radius-md: 0.5rem;
}
```

### Brand globals.css

```css
/**
 * Globex Global Styles
 */

/* Import shared styles */
@import '@oxlayer/shared-ui/styles';

/* Import brand overrides */
@import './brand.css';
```

## Design Tokens

Design tokens are CSS custom properties that can be overridden by brand packages.

### Shared Tokens (@oxlayer/shared-ui/src/tokens/index.ts)

```typescript
export const colors = {
  brand: 'var(--color-brand)',
  brandHover: 'var(--color-brand-hover)',
  brandForeground: 'var(--color-brand-foreground)',
  background: 'var(--color-background)',
  foreground: 'var(--color-foreground)',
  // ... more tokens
} as const;

export const spacing = {
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
} as const;

export const borderRadius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  full: 'var(--radius-full)',
} as const;
```

### Shared CSS (@oxlayer/shared-ui/src/styles/globals.css)

```css
@import "tailwindcss";

:root {
  /* Default tokens - to be overridden */
  --color-brand: #caea28;
  --color-brand-hover: #b5d820;
  --color-brand-foreground: #000000;

  --color-background: 255 255 255;
  --color-foreground: 10 10 10;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Geist', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Transitions */
  --transition-fast: 150ms;
  --transition-base: 200ms;
  --transition-slow: 300ms;
}
```

## Usage in Applications

### Installing Dependencies

```bash
cd frontend
pnpm install
```

### Using Brand Components

```tsx
// In your app
import { Button, ButtonTech } from '@globex/ui';

// Shared component from @oxlayer/shared-ui
<Button variant="default">Click me</Button>

// Globex-specific component
<ButtonTech>Technical Action</ButtonTech>
```

### Using Utilities

```tsx
import { cn } from '@globex/ui';

// This comes from @oxlayer/shared-ui
<div className={cn('base-class', condition && 'conditional')} />
```

## Migration Strategy

### Phase 1: Setup (Current)

- Create `@oxlayer/shared-ui` package
- Set up workspace configuration
- Migrate all base components to shared-ui

### Phase 2: Update Brand Packages

- Update brand packages to depend on `@oxlayer/shared-ui`
- Re-export shared components
- Remove duplicate code

### Phase 3: Brand Customization

- Keep only brand-specific `tech/` components
- Add brand CSS overrides
- Test all brand packages

### Phase 4: Cleanup

- Remove duplicate dependencies from brand packages
- Optimize bundle sizes
- Update documentation

## Benefits

| Before | After |
|--------|-------|
| 300+ duplicate component files | Single source of truth |
| Update 3 packages for 1 component | Update 1 package, all benefit |
| Inconsistent design | Guaranteed consistency |
| Large bundle sizes | Smaller bundles (shared deps) |
| Maintenance nightmare | Easy maintenance |

## Best Practices

### 1. Shared Components

**DO** put in @oxlayer/shared-ui:
- Generic UI components (Button, Input, Card)
- Utility functions (cn, formatters)
- Custom hooks (useTheme, useMediaQuery)
- Design tokens

**DON'T** put in @oxlayer/shared-ui:
- Brand-specific styling
- Brand logos or assets
- Business logic specific to one brand

### 2. Brand Components

**DO** put in brand packages:
- Brand-specific design system components
- Brand color/logo usage
- Industry-specific components

**DON'T** put in brand packages:
- Generic UI components (use shared-ui instead)
- Utility functions (use shared-ui instead)

### 3. Dependencies

```json
// shared-ui/package.json - ALL UI dependencies
{
  "dependencies": {
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "tailwind-merge": "^3.4.0"
  }
}

// @globex/ui/package.json - ONLY shared-ui
{
  "dependencies": {
    "@oxlayer/shared-ui": "workspace:*"
  }
}
```

## Troubleshooting

### Workspace Not Resolving

Ensure `pnpm-workspace.yaml` is correct:

```yaml
packages:
  - 'packages/*'
  - 'packages/@*/*'
```

### Import Errors

Verify `tsconfig.json` has correct paths:

```json
{
  "compilerOptions": {
    "composite": true,
    "paths": {
      "@oxlayer/shared-ui": ["../shared-ui/src"]
    }
  }
}
```

### Styles Not Applying

Ensure brand CSS imports shared styles:

```css
@import '@oxlayer/shared-ui/styles';
```

## See Also

- [Frontend Implementation Guide](./implementation-guide.md) - Component patterns and API integration
- [Web Capabilities Guide](./web-capabilities-guide.md) - Offline-first sync engine
