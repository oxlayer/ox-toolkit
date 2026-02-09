# OxLayer SDK Installer

A command-line tool for downloading and installing OxLayer SDK packages.

## Installation

```bash
npm install -g @oxlayer/sdk-installer
```

Or use without installing:

```bash
npx @oxlayer/sdk-installer <command>
```

## Commands

### `oxlayer login`

Authenticate with the OxLayer Control Panel using your API key.

```bash
oxlayer login
```

You can also provide the key directly:

```bash
oxlayer login --key oxl_your_api_key_here
```

### `oxlayer status`

Show your current authentication status and SDK installation.

```bash
oxlayer status
```

With verbose output:

```bash
oxlayer status --verbose
```

### `oxlayer install`

Download and install SDK packages.

```bash
# Install latest version
oxlayer install

# Install specific version
oxlayer install 2025_02_08_001

# Install specific packages
oxlayer install --packages backend-sdk frontend-sdk

# Install with options
oxlayer install --save --environment production
```

Options:
- `[version]` - Specific version to install (default: latest)
- `-p, --packages <packages...>` - Specific packages to install
- `-e, --environment <env>` - Environment (development|staging|production)
- `--dry-run` - Show what would be installed without installing
- `-f, --force` - Force reinstall even if already installed
- `--save` - Add to dependencies in package.json
- `--save-dev` - Add to devDependencies in package.json

### `oxlayer resolve`

Resolve and display capability configuration for the current project.

```bash
oxlayer resolve
```

With usage examples:

```bash
oxlayer resolve --verbose
```

### `oxlayer logout`

Remove stored API key and configuration.

```bash
oxlayer logout
```

## Usage Example

```bash
# 1. Authenticate
oxlayer login

# 2. Check your project's capabilities
oxlayer resolve

# 3. Install the SDK
oxlayer install

# 4. Install dependencies
pnpm install
```

## Configuration

The installer stores its configuration in `~/.oxlayer/config.json`:

```json
{
  "apiKey": "oxl_...",
  "environment": "development",
  "vendorDir": ".capabilities-vendor"
}
```

You can also use environment variables:

- `OXLAYER_API_KEY` - Your API key
- `OXLAYER_API_ENDPOINT` - Custom API endpoint (default: https://api.oxlayer.dev)

## Vendor Directory

Installed packages are stored in `.capabilities-vendor/<version>/` in your project:

```
.my-project/
├── .capabilities-vendor/
│   └── 2025_02_08_001/
│       ├── foundation/
│       ├── capabilities/
│       └── frontend/
├── package.json
└── src/
```

## Security Notes

- Your API key is stored locally in `~/.oxlayer/config.json`
- Never commit `.capabilities-vendor/` to version control
- Add `.capabilities-vendor/` to your `.gitignore`

## License

MIT © OxLayer
