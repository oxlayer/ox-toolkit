# MCP OxLayer

Model Context Protocol (MCP) server for OxLayer DDD patterns and capabilities documentation.

This MCP server makes OxLayer documentation available to AI agents through the MCP protocol, enabling agents to understand and follow OxLayer's DDD architecture patterns, code templates, and best practices.

## Features

- **Standalone Bundle**: All documentation embedded in single 147KB JavaScript file - no docs folder needed
- **7 Documentation Resources**: Implementation guide, DDD pattern, agent prompt, capabilities guide, frontend guide, frontend implementation, and web capabilities
- **12 Interactive Tools**: Query patterns, templates, capabilities, frontend docs, and best practices
- **Full-Text Search**: Search across all OxLayer documentation
- **Type-Safe**: Built with TypeScript for reliability

## Installation

```bash
cd mcp-oxlayer
pnpm install
pnpm run build
```

The build process automatically embeds all markdown documentation into the bundled JavaScript, creating a completely standalone `dist/index.js` file.

## Configuration

Add to your Claude Desktop config (`claude_desktop_config.json`):

**Linux/macOS:**
```json
{
  "mcpServers": {
    "oxlayer": {
      "command": "node",
      "args": ["/absolute/path/to/oxlayer/mcp_oxlayer/dist/index.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "oxlayer": {
      "command": "node",
      "args": ["C:\\path\\to\\oxlayer\\mcp-oxlayer\\dist/index.js"]
    }
  }
}
```

## Documentation Bundled

The server embeds these markdown files from the `docs/` folder:

| Category | File | Description |
|----------|------|-------------|
| Basic | `basic/implementation-guide.md` | Project rules - clean code, documentation, database changes |
| Backend | `backend/oxlayer-ddd-pattern.md` | Complete DDD architecture with templates |
| Backend | `backend/oxlayer-ddd-agent-prompt.md` | AI agent system prompt for OxLayer-compliant code |
| Backend | `backend/oxlayer-capabilities-guide.md` | Backend capabilities reference guide |
| Frontend | `frontend/frontend-guide.md` | React component patterns with Tailwind CSS and Base UI |
| Frontend | `frontend/implementation-guide.md` | Complete frontend implementation: React, Tailwind, React Query, offline-first sync |
| Frontend | `frontend/web-capabilities-guide.md` | Local-first state management guide |

## Tools

### get_doc
Get any OxLayer documentation by name or category.

**Parameters:**
- `name` (required): Doc name or category
  - Docs: `implementation-guide`, `ddd-pattern`, `ddd-agent-prompt`, `capabilities-guide`, `frontend-guide`, `frontend-implementation`, `web-capabilities`
  - Categories: `basic`, `backend`, `frontend`, `all`
- `section` (optional): Specific section (only works with some docs)

**Example:**
```
Get the frontend documentation from mcp-oxlayer
```

### get_backend_pattern
Get the complete OxLayer DDD architecture pattern documentation.

**Parameters:**
- `section` (optional): Specific section to retrieve
  - `overview`, `packages`, `structure`, `naming`, `entity`, `repository`, `use-case`, `controller`, `container`, `testing`, `security`, `concepts`, `stack`, `best-practices`

**Example:**
```
Get the entity template pattern from OxLayer DDD documentation
```

### get_agent_prompt
Get the system prompt for AI agents working with OxLayer.

**Parameters:**
- `section` (optional): `expertise`, `packages`, `structure`, `guidelines`, `patterns`, `best-practices`, `how-to-work`, `questions`, `response-style`

### get_capability_info
Get information about a specific OxLayer capability package.

**Parameters:**
- `capability` (required): `auth`, `cache`, `events`, `internal`, `metrics`, `openapi`, `queues`, `scheduler`, `search`, `telemetry`, `testing`, `vector`, `all`
- `section` (optional): `installation`, `exports`, `configuration`, `usage`, `adapters`, `examples`

### get_template_pattern
Get code templates for a specific OxLayer pattern.

**Parameters:**
- `pattern` (required): `entity`, `repository`, `use-case-create`, `use-case-update`, `use-case-list`, `controller`, `container`, `domain-event`, `test-builder`, `mock-repository`, `validation`

### list_capabilities
List all available OxLayer capability packages with descriptions.

### get_adapter_info
Get information about infrastructure adapters.

**Parameters:**
- `adapter` (required): `postgres`, `redis`, `rabbitmq`, `bullmq`, `sqs`, `mqtt`, `quickwit`, `qdrant`, `eventemitter`, `all`

### get_frontend_guide
Get React component patterns and frontend documentation.

**Parameters:**
- `section` (optional): `stack`, `naming`, `structure`, `colors`, `typescript`, `patterns`, `compound`, `checklist`

### get_web_capabilities
Get local-first state management documentation for @oxlayer/capabilities-web-state.

**Parameters:**
- `section` (optional): `overview`, `quick-start`, `core-concepts`, `storage`, `sync`, `workspace`, `export`, `api-reference`, `best-practices`

### search_docs
Search the OxLayer documentation for specific keywords.

**Parameters:**
- `query` (required): Search keywords
- `category` (optional): `all`, `basic`, `backend`, `frontend`

### get_best_practices
Get OxLayer best practices for specific topics.

**Parameters:**
- `topic` (required): `templates`, `domain-purity`, `dependency-injection`, `validation`, `xss`, `events`, `testing`, `tracing`, `auto-migration`, `lazy-loading`, `all`

### list_docs
List all available documentation by category.

**Parameters:**
- `category` (optional): `all`, `basic`, `backend`, `frontend` (default: `all`)

## Usage Examples

### For AI Agents

When working with an AI agent, reference the MCP server:

```
Please create a new entity for the User aggregate following the OxLayer DDD pattern.
Use the mcp-oxlayer server to get the entity template pattern.
```

The agent can:
1. Call `get_template_pattern` with `pattern: "entity"`
2. Use the returned template to generate code
3. Call `get_best_practices` with `topic: "validation"` to add validation

### Example Conversation

```
User: Create a Todo entity using OxLayer patterns

Agent: [Calls get_template_pattern with pattern="entity"]

I'll create a Todo entity using the CrudEntityTemplate from @oxlayer/snippets:

[Generates code following the template]

User: Add validation for the title field

Agent: [Calls get_best_practices with topic="xss"]
[Calls get_template_pattern with pattern="validation"]

I'll add validation with XSS protection following OxLayer security patterns:
[Adds validation code]
```

## Project Structure

```
mcp-oxlayer/
├── docs/
│   ├── basic/
│   │   └── implementation-guide.md
│   ├── backend/
│   │   ├── oxlayer-ddd-pattern.md
│   │   ├── oxlayer-ddd-agent-prompt.md
│   │   └── oxlayer-capabilities-guide.md
│   └── frontend/
│       ├── frontend-guide.md
│       └── web-capabilities-guide.md
├── src/
│   ├── index.ts           # MCP server implementation
│   └── docs-embedded.ts   # Auto-generated embedded docs
├── scripts/
│   └── embed-docs.ts      # Script to embed markdown into JS
├── dist/
│   └── index.js           # Bundled standalone output (116KB)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Install dependencies
pnpm install

# Build (auto-embeds docs and bundles with esbuild)
pnpm run build

# Development mode (build + run)
pnpm run dev

# Watch mode for development
pnpm run watch

# Test the server manually
pnpm run start
```

The build process:
1. Runs `prebuild` script to embed all markdown files into `src/docs-embedded.ts`
2. Uses esbuild to bundle everything into a single standalone `dist/index.js`
3. Excludes `@modelcontextprotocol/sdk` (marked as external)

## Standalone Deployment

Since all documentation is embedded in the bundled JavaScript, you only need to distribute the single `dist/index.js` file. No docs folder or other assets are required at runtime.

## License

MIT
