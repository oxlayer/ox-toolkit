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
import authApi from './services/api/authApi';

// Lista todos os usuários
await authApi.get('/users');  // → GET /api/auth/users

// Cria um novo estabelecimento
await authApi.post('/establishments', data);  // → POST /api/auth/establishments

// Atualiza um service provider
await authApi.put(`/service-providers/${id}`, data);  // → PUT /api/auth/service-providers/{id}
```

### Services Helpers

Use os serviços pré-configurados que já importam a API correta:

```typescript
import { usersService } from './services/users';
import { establishmentsService } from './services/establishments';
import { serviceProvidersService } from './services/serviceProviders';

// Users
await usersService.getAll();  // → GET /api/auth/users
await usersService.getById(1);  // → GET /api/auth/users/1

// Establishments
await establishmentsService.getAll();  // → GET /api/auth/establishments
await establishmentsService.create(data);  // → POST /api/auth/establishments

// Service Providers
await serviceProvidersService.getAll();  // → GET /api/auth/service-providers
await serviceProvidersService.toggleAvailability(id, true);  // → PATCH /api/auth/service-providers/{id}/availability
```

## Variável de Ambiente

Configure a URL base no `.env`:

```env
VITE_API_BASE_URL=http://localhost:80
```

ou para produção com Cloudflare Tunnel:

```env
VITE_API_BASE_URL=https://your-tunnel-url.trycloudflare.com
```

## Autenticação

O token JWT é automaticamente incluído em todas as requisições através do interceptor de configuração. O token é obtido do `localStorage` com a chave `auth_token`.
