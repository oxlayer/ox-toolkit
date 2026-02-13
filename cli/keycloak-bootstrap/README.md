# @oxlayer/cli-keycloak-bootstrap

Bootstrapping Keycloak realms and clients with convention-over-configuration for the OxLayer framework.

## Features

- **Convention-over-Configuration**: Auto-generate clients using templates (`api-client`, `web-client`, `mobile-client`, `admin-client`)
- **Blueprint System**: Pre-configured setups for B2C SaaS and Enterprise deployments
- **Multi-Realm Support**: Both shared (B2C) and dedicated (enterprise) realm patterns
- **Idempotent Operations**: Safe to run multiple times - skips existing resources
- **Dry-Run Mode**: Preview changes before applying
- **Environment Variable Substitution**: Secure configuration with `${VAR:-default}` syntax
- **Multiple Config Formats**: JSON, YAML, TypeScript support
- **npx Ready**: Works with `npx` - no installation required

## Quick Start

### Installation

```bash
# Install globally
npm install -g @oxlayer/cli-keycloak-bootstrap

# Or use with npx (no installation needed)
npx @oxlayer/cli-keycloak-bootstrap
```

### Generate Sample Configuration

```bash
# Generate JSON config (recommended for npx usage)
npx @oxlayer/cli-keycloak-bootstrap init --output keycloak.config.json

# Generate YAML config
npx @oxlayer/cli-keycloak-bootstrap init --output keycloak.config.yaml

# Generate TypeScript config (requires local package installation)
npx @oxlayer/cli-keycloak-bootstrap init --format ts --output keycloak.config.ts
```

### Bootstrap Keycloak

```bash
# With JSON config (works with npx!)
npx @oxlayer/cli-keycloak-bootstrap bootstrap --config keycloak.config.json --env-file .env
```

## Configuration

### Basic Configuration (JSON)

```json
{
  "keycloak": {
    "url": "${KEYCLOAK_URL:-http://localhost:8080}",
    "admin": {
      "username": "${KEYCLOAK_ADMIN:-admin}",
      "password": "${KEYCLOAK_ADMIN_PASSWORD:-admin}"
    }
  },
  "realm": {
    "name": "my-app",
    "displayName": "My Application",
    "type": "shared"
  },
  "clients": [
    {
      "name": "my-app-api",
      "template": "api-client",
      "overrides": {
        "description": "My App Backend API"
      }
    },
    {
      "name": "my-app-web",
      "template": "web-client",
      "overrides": {
        "description": "My App Web Frontend",
        "redirectUris": ["${FRONTEND_URL:-http://localhost:3000}/*"],
        "validPostLogoutRedirectUris": ["${FRONTEND_URL:-http://localhost:3000}"],
        "webOrigins": ["${FRONTEND_URL:-http://localhost:3000}"]
      }
    }
  ],
  "roles": [
    { "name": "user", "description": "Standard user" },
    { "name": "admin", "description": "Application administrator" }
  ],
  "protocolMappers": [
    {
      "name": "organization-id-mapper",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-attribute-mapper",
      "clients": ["my-app-web", "my-app-api"],
      "config": {
        "access.token.claim": "true",
        "claim.name": "organization",
        "jsonType.label": "JSON",
        "introspection.token.claim": "true",
        "multivalued": "true",
        "userinfo.token.claim": "true",
        "id.token.claim": "true",
        "addOrganizationId": "true"
      }
    }
  ]
}
```

### Basic Configuration (YAML)

```yaml
keycloak:
  url: ${KEYCLOAK_URL:-http://localhost:8080}
  admin:
    username: ${KEYCLOAK_ADMIN:-admin}
    password: ${KEYCLOAK_ADMIN_PASSWORD:-admin}

realm:
  name: my-app
  displayName: My Application
  type: shared

clients:
  - name: my-app-api
    template: api-client
    overrides:
      description: My App Backend API
  - name: my-app-web
    template: web-client
    overrides:
      description: My App Web Frontend
      redirectUris:
        - ${FRONTEND_URL:-http://localhost:3000}/*
      validPostLogoutRedirectUris:
        - ${FRONTEND_URL:-http://localhost:3000}
      webOrigins:
        - ${FRONTEND_URL:-http://localhost:3000}

roles:
  - name: user
    description: Standard user
  - name: admin
    description: Application administrator
```

### TypeScript Configuration

For TypeScript configs, you need to install the package locally:

```bash
npm install --save-dev @oxlayer/cli-keycloak-bootstrap
```

```typescript
import { defineConfig } from '@oxlayer/cli-keycloak-bootstrap/templates';

export default defineConfig({
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    admin: {
      username: process.env.KEYCLOAK_ADMIN || 'admin',
      password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    },
  },

  realm: {
    name: 'my-app',
    displayName: 'My Application',
    type: 'shared',
  },

  clients: [
    {
      name: 'my-app-api',
      template: 'api-client',
      overrides: {
        description: 'My App Backend API',
      },
    },
    {
      name: 'my-app-web',
      template: 'web-client',
      overrides: {
        description: 'My App Web Frontend',
        redirectUris: [`${process.env.FRONTEND_URL || 'http://localhost:3000'}/*`],
        validPostLogoutRedirectUris: [process.env.FRONTEND_URL || 'http://localhost:3000'],
        webOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
      },
    },
  ],
});
```

## CLI Commands

### `bootstrap` - Bootstrap Keycloak

```bash
keycloak-bootstrap bootstrap [options]

Options:
  -c, --config <path>      Configuration file (default: keycloak.config.json)
  -e, --env <name>         Environment name for logging (default: development)
  --env-file <path>        Load environment variables from .env file
  --dry-run               Show what would be done without applying changes
  --idempotent            Skip existing resources (default: true)
  --force                 Overwrite existing resources
  -v, --verbose           Verbose output
  -q, --quiet             Quiet output (errors only)
```

### `init` - Generate Sample Configuration

```bash
keycloak-bootstrap init [options]

Options:
  -o, --output <path>     Output file (default: keycloak.config.json)
  -t, --type <type>       Configuration type: shared, dedicated (default: shared)
  -f, --format <format>   Output format: json, yaml, ts (default: auto-detected from file extension)
```

### `validate` - Validate Configuration

```bash
keycloak-bootstrap validate [options]

Options:
  -c, --config <path>     Configuration file (default: keycloak.config.json)
```

## Usage Examples

### With Environment File

Create a `.env` file:

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
FRONTEND_URL=http://localhost:3000
```

Then run:

```bash
keycloak-bootstrap bootstrap --config keycloak.config.json --env-file .env
```

### Using npx (No Installation)

```bash
# Generate config
npx @oxlayer/cli-keycloak-bootstrap init --output keycloak.config.json

# Create .env file with your credentials
echo "KEYCLOAK_URL=http://localhost:8080" > .env
echo "KEYCLOAK_ADMIN=admin" >> .env
echo "KEYCLOAK_ADMIN_PASSWORD=admin" >> .env

# Bootstrap Keycloak
npx @oxlayer/cli-keycloak-bootstrap bootstrap --config keycloak.config.json --env-file .env
```

### Dry Run (Preview Changes)

```bash
keycloak-bootstrap bootstrap --config keycloak.config.json --dry-run
```

### Force Re-create Resources

```bash
keycloak-bootstrap bootstrap --config keycloak.config.json --force
```

## Client Templates

The CLI includes built-in client templates:

| Template | Description | Public | Flow |
|----------|-------------|--------|------|
| `api-client` | Backend API (confidential) | No | Authorization Code |
| `web-client` | Web application | Yes | Authorization Code + PKCE |
| `mobile-client` | Mobile app | Yes | Authorization Code + Deep Linking |
| `admin-client` | Admin panel | Yes | Authorization Code + PKCE |

## Blueprints

### `b2c-saas` - Shared Realm (B2C, Small Business)

For applications using Keycloak Organizations for multi-tenancy:

```json
{
  "extends": "b2c-saas",
  "realm": {
    "name": "my-saas"
  }
}
```

### `enterprise` - Dedicated Realm (Enterprise)

For enterprise customers with isolated identity:

```json
{
  "extends": "enterprise",
  "realm": {
    "name": "enterprise-acme",
    "displayName": "ACME Corporation",
    "type": "dedicated"
  }
}
```

## Environment Variable Substitution

Configuration supports environment variable substitution using shell-style syntax:

| Syntax | Description |
|--------|-------------|
| `${VAR}` | Required variable - error if not set |
| `${VAR:-default}` | Optional with default value |
| `${VAR:?error}` | Required with custom error message |

**JSON/YAML configs** use shell-style syntax:
```json
{
  "url": "${KEYCLOAK_URL:-http://localhost:8080}"
}
```

**TypeScript configs** use JavaScript syntax:
```typescript
{
  url: process.env.KEYCLOAK_URL || 'http://localhost:8080'
}
```

## Examples

### Shared Realm (Todo App)

See [examples/todo-app/keycloak.config.json](../../examples/todo-app/keycloak.config.json) for a complete JSON example.

### Enterprise (ACME Corporation)

```bash
npx @oxlayer/cli-keycloak-bootstrap init --type dedicated --output enterprise-acme.json
```

## Programmatic Usage

You can also use the CLI as a library:

```typescript
import { loadConfig } from '@oxlayer/cli-keycloak-bootstrap';
import { KeycloakAdminClient } from '@oxlayer/cli-keycloak-bootstrap';
import { BootstrapEngine } from '@oxlayer/cli-keycloak-bootstrap';

const config = await loadConfig('./keycloak.config.json');
const keycloak = new KeycloakAdminClient(config.keycloak);
const engine = new BootstrapEngine(keycloak, config);

// Apply configuration
await engine.apply({
  dryRun: false,
  idempotent: true,
  force: false,
});
```

## Docker Integration

Add to your `docker-compose.yml`:

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin

  keycloak-bootstrap:
    image: node:18
    working_dir: /app
    volumes:
      - ./keycloak.config.json:/app/keycloak.config.json
      - ./.env:/.env
    command: >
      sh -c "
        sleep 10 &&
        npx @oxlayer/cli-keycloak-bootstrap
          --config keycloak.config.json
          --env-file .env
      "
    depends_on:
      - keycloak
```

## Troubleshooting

### "Module not found" errors with TypeScript configs

TypeScript configs require the package to be installed locally:

```bash
npm install --save-dev @oxlayer/cli-keycloak-bootstrap
```

For npx usage, prefer JSON or YAML configs instead.

### Authentication errors

Verify your Keycloak admin credentials:

```bash
export KEYCLOAK_URL=http://localhost:8080
export KEYCLOAK_ADMIN=admin
export KEYCLOAK_ADMIN_PASSWORD=admin
```

Or use a `.env` file:

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
```

### Idempotency not working

Use `--force` to overwrite existing resources:

```bash
keycloak-bootstrap bootstrap --config keycloak.config.json --force
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
