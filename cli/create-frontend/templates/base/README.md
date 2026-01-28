# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS v4
- Axios
- TanStack React Query

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Utility libraries
├── pages/          # Page components
├── services/       # API service functions
├── types/          # TypeScript type definitions
├── App.tsx         # Main app component
├── main.tsx        # Entry point
└── index.css       # Global styles
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint

# Type check
pnpm typecheck
```

## Features

- Weather app that fetches real-time data from Open-Meteo API
- 5-day weather forecast
- React Query for data fetching and caching
- Responsive design with dark mode support
- Clean, modern UI with Tailwind CSS v4

## API

Uses the free Open-Meteo API (no API key required).

## Learn More

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
