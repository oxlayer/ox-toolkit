# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Features

- React 19 with TypeScript
- Vite for fast development and building
- Tailwind CSS v4 with modern theming
- ESLint with TypeScript support
- Path aliases (`@/` for `./src/`)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint
```

## Project Structure

```
src/
├── App.tsx          # Main app component
├── main.tsx         # Entry point
├── index.css        # Global styles
└── components/      # Your components
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |

## Customization

### Theme Colors

Edit `src/index.css` to customize the theme:

```css
@theme {
  --color-primary: oklch(47% 0.18 265);
  /* ... other colors */
}
```

### Path Aliases

Use `@/` to import from the `src` directory:

```tsx
import { Button } from '@/components/button';
```

## Learn More

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs/v4-beta)
