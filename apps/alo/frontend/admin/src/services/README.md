# API Services Structure

Este frontend manager está configurado para trabalhar com microserviços através do API Gateway (Nginx).

## API Endpoints Prefixes

Cada microserviço tem um prefixo específico configurado no nginx:

| Microserviço | Prefixo | Arquivo API |
|--------------|---------|-------------|
| Auth API | `/api/auth` | `api/authApi.ts` |
| Order API | `/api/order` | `api/orderApi.ts` |
| Delivery API | `/api/delivery` | `api/deliveryApi.ts` |

## Exemplos de Uso

### Users, Establishments, Service Providers (Auth API)
```typescript
import { createApiClient } from '../lib/api/client';

const authApi = createApiClient('/api/auth');

// Lista todos os usuários
await authApi.get('/users');  // → GET /api/users

// Cria um novo estabelecimento
await authApi.post('/establishments', data);  // → POST /api/establishments

// Atualiza um service provider
await authApi.put(`/service-providers/${id}`, data);  // → PUT /api/service-providers/{id}
```

### Services Helpers

Use os serviços pré-configurados que já importam a API correta:

```typescript
import { usersService } from './services/users';
import { establishmentsService } from './services/establishments';
import { serviceProvidersService } from './services/serviceProviders';

// Users
await usersService.getAll();  // → GET /api/users
await usersService.getById(1);  // → GET /api/users/1

// Establishments
await establishmentsService.getAll();  // → GET /api/establishments
await establishmentsService.create(data);  // → POST /api/establishments

// Service Providers
await serviceProvidersService.getAll();  // → GET /api/service-providers
await serviceProvidersService.toggleAvailability(id, true);  // → PATCH /api/service-providers/{id}/availability
```

## Variável de Ambiente

Configure a URL base no `.env`:

```env
VITE_PUBLIC_API_BASE_URL=http://localhost:80
```

ou para produção com Cloudflare Tunnel:

```env
VITE_PUBLIC_API_BASE_URL=https://your-tunnel-url.trycloudflare.com
```

## Autenticação

O token JWT é automaticamente incluído em todas as requisições através do interceptor de configuração. O token é obtido do Keycloak através do `getToken()`.
