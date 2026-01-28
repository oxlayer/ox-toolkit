# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS v4
- React Router v7
- TanStack React Query
- Axios
- Keycloak JS for authentication

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Utility libraries (keycloak, api-client)
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

# Copy environment variables and configure
cp .env.example .env

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

- **Keycloak Authentication**: SSO integration with automatic token management
- **React Query**: Server state management with caching and optimistic updates
- **Axios API Client**: Automatic token injection and 401 redirect to Keycloak login
- **React Router v7**: Client-side routing
- **Tailwind CSS v4**: Modern utility-first CSS with dark mode support

## Environment Variables

See `.env.example` for required environment variables:

- `VITE_KEYCLOAK_URL`: Keycloak server URL
- `VITE_KEYCLOAK_REALM`: Keycloak realm name
- `VITE_KEYCLOAK_CLIENT_ID`: Keycloak client ID
- `VITE_API_BASE_URL`: Backend API base URL

## Authentication Flow

1. App initializes and calls `initKeycloak()`
2. Keycloak checks for existing SSO session
3. If not authenticated, user sees login button
4. Clicking login redirects to Keycloak login page
5. After successful login, user is redirected back to app
6. Access token is automatically included in API requests
7. On 401 response, user is redirected to Keycloak login again

## API Usage

```typescript
import { api } from './lib/api-client'

// GET request
const data = await api.get<EstablishmentsResponse>('/establishments')

// POST request
const result = await api.post<Establishment>('/establishments', { name: 'Test' })

// PATCH request
const updated = await api.patch<Establishment>('/establishments/1', { name: 'Updated' })

// DELETE request
await api.delete<void>('/establishments/1')
```

## Learn More

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
