#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { embeddedDocs } from './docs-embedded.js';

// Documentation mapping with category
const DOCS: Record<string, { key: string; category: string; description: string }> = {
  // Basic principles
  'implementation-guide': {
    key: 'basic_implementation_guide_md',
    category: 'basic',
    description: 'Project rules - clean code, documentation, database changes',
  },

  // Backend
  'ddd-pattern': {
    key: 'backend_oxlayer_ddd_pattern_md',
    category: 'backend',
    description: 'DDD architecture pattern with templates and code patterns',
  },
  'ddd-agent-prompt': {
    key: 'backend_oxlayer_ddd_agent_prompt_md',
    category: 'backend',
    description: 'AI agent system prompt for generating OxLayer-compliant code',
  },
  'capabilities-guide': {
    key: 'backend_oxlayer_capabilities_guide_md',
    category: 'backend',
    description: 'Reference guide for all OxLayer backend capability packages',
  },

  // Frontend
  'frontend-guide': {
    key: 'frontend_frontend_guide_md',
    category: 'frontend',
    description: 'React component patterns with Tailwind CSS and Base UI',
  },
  'frontend-implementation': {
    key: 'frontend_implementation_guide_md',
    category: 'frontend',
    description: 'Complete frontend implementation guide with React, Tailwind, React Query, and capabilities-web',
  },
  'frontend-monorepo': {
    key: 'frontend_monorepo_guide_md',
    category: 'frontend',
    description: 'Frontend monorepo guide with shared-ui package structure and workspace setup',
  },
  'web-capabilities': {
    key: 'frontend_web_capabilities_guide_md',
    category: 'frontend',
    description: 'Local-first state management with @oxlayer/capabilities-web-state',
  },
};

// Helper function to get doc content
function getDocContent(name: string): string {
  const doc = DOCS[name];
  if (!doc) {
    throw new Error(`Document not found: ${name}`);
  }
  const content = embeddedDocs[doc.key];
  if (!content) {
    throw new Error(`Embedded content not found for: ${doc.key}`);
  }
  return content;
}

// Create server
const server = new Server(
  {
    name: 'mcp-oxlayer',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.entries(DOCS).map(([name, doc]) => ({
      uri: `docs://${name}`,
      name: `oxlayer-${name}`,
      description: doc.description,
      mimeType: 'text/markdown',
    })),
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = request.params.uri;
  const docName = Object.entries(DOCS).find(
    ([_, doc]) => url === `docs://${doc.key}`
  );

  if (!docName) {
    throw new Error(`Resource not found: ${url}`);
  }

  try {
    const content = getDocContent(docName[0]);
    return {
      contents: [
        {
          uri: url,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to read documentation: ${error}`);
  }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_doc',
        description: 'Get any OxLayer documentation by name or category. Returns list of available docs if no arguments provided.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Document name or category to retrieve',
              enum: [
                // Specific docs
                'implementation-guide', 'ddd-pattern', 'ddd-agent-prompt', 'capabilities-guide', 'frontend-guide', 'web-capabilities',
                // Categories
                'basic', 'backend', 'frontend', 'all'
              ],
            },
          },
        },
      },
      {
        name: 'get_backend_pattern',
        description: 'Get the OxLayer DDD architecture pattern documentation including templates, code patterns, and best practices',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              description: 'Optional section to retrieve',
              enum: ['overview', 'packages', 'structure', 'naming', 'entity', 'repository', 'use-case', 'controller', 'container', 'testing', 'security', 'concepts', 'stack', 'best-practices'],
            },
          },
        },
      },
      {
        name: 'get_agent_prompt',
        description: 'Get the system prompt for AI agents working with OxLayer DDD patterns',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              description: 'Optional section to retrieve',
              enum: ['expertise', 'packages', 'structure', 'guidelines', 'patterns', 'best-practices', 'how-to-work', 'questions', 'response-style'],
            },
          },
        },
      },
      {
        name: 'get_capability_info',
        description: 'Get information about a specific OxLayer backend capability package (auth, cache, events, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            capability: {
              type: 'string',
              description: 'The capability name',
              enum: ['auth', 'cache', 'events', 'internal', 'metrics', 'openapi', 'queues', 'scheduler', 'search', 'telemetry', 'testing', 'vector', 'all'],
            },
            section: {
              type: 'string',
              description: 'Optional section: installation, exports, configuration, usage, adapters, examples',
              enum: ['installation', 'exports', 'configuration', 'usage', 'adapters', 'examples'],
            },
          },
          required: ['capability'],
        },
      },
      {
        name: 'get_template_pattern',
        description: 'Get code templates for backend patterns (entity, repository, use case, controller, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'The pattern to get template for',
              enum: ['entity', 'repository', 'use-case-create', 'use-case-update', 'use-case-list', 'controller', 'container', 'domain-event', 'test-builder', 'mock-repository', 'validation'],
            },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'list_capabilities',
        description: 'List all available OxLayer backend capability packages',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_adapter_info',
        description: 'Get information about backend infrastructure adapters (Redis, RabbitMQ, BullMQ, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            adapter: {
              type: 'string',
              description: 'The adapter name or "all" for all adapters',
              enum: ['postgres', 'redis', 'rabbitmq', 'bullmq', 'sqs', 'mqtt', 'quickwit', 'qdrant', 'eventemitter', 'all'],
            },
          },
          required: ['adapter'],
        },
      },
      {
        name: 'get_frontend_guide',
        description: 'Get the React frontend component guide with Tailwind CSS and Base UI patterns',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              description: 'Optional section: stack, naming, structure, colors, typescript, patterns, compound, checklist',
              enum: ['stack', 'naming', 'structure', 'colors', 'typescript', 'patterns', 'compound', 'checklist'],
            },
          },
        },
      },
      {
        name: 'get_web_capabilities',
        description: 'Get the web capabilities guide for local-first state management with @oxlayer/capabilities-web-state',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              description: 'Optional section: overview, quick-start, intent-system, storage, sync, workspace, export, api-reference',
              enum: ['overview', 'quick-start', 'intent-system', 'storage', 'sync', 'workspace', 'export', 'api-reference', 'best-practices'],
            },
          },
        },
      },
      {
        name: 'search_docs',
        description: 'Search the OxLayer documentation for specific keywords or topics',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query - keywords to find in the documentation',
            },
            category: {
              type: 'string',
              description: 'Which category to search',
              enum: ['all', 'basic', 'backend', 'frontend'],
              default: 'all',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_best_practices',
        description: 'Get OxLayer best practices for specific topics',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'The topic to get best practices for',
              enum: ['templates', 'domain-purity', 'dependency-injection', 'validation', 'xss', 'events', 'testing', 'tracing', 'auto-migration', 'lazy-loading', 'all'],
            },
          },
          required: ['topic'],
        },
      },
      {
        name: 'list_docs',
        description: 'List all available OxLayer documentation organized by category',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category',
              enum: ['all', 'basic', 'backend', 'frontend'],
              default: 'all',
            },
          },
        },
      },
    ],
  };
});

// Helper to load doc content
async function loadDoc(name: string): Promise<string> {
  return getDocContent(name);
}

// Helper to load docs by category
async function loadDocsByCategory(category: string): Promise<string> {
  const docs = Object.entries(DOCS)
    .filter(([_, doc]) => category === 'all' || doc.category === category)
    .map(([name, doc]) => `## ${name}\n\n${doc.description}\n\nKey: \`${doc.key}\`\n`);

  return docs.join('\n\n---\n\n');
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_doc': {
        if (!args) return { content: [{ type: 'text', text: 'Missing arguments' }] };

        if (['basic', 'backend', 'frontend', 'all'].includes(args.name as string)) {
          // Return category listing
          const docs = await loadDocsByCategory(args.name as string);
          return { content: [{ type: 'text', text: docs }] };
        }

        // Return specific doc
        const content = await loadDoc(args.name as string);
        return { content: [{ type: 'text', text: content }] };
      }

      case 'get_backend_pattern': {
        const content = await loadDoc('ddd-pattern');
        if (!args?.section) {
          return { content: [{ type: 'text', text: content }] };
        }
        const section = extractSection(content, args.section as string, '## ');
        return { content: [{ type: 'text', text: section }] };
      }

      case 'get_agent_prompt': {
        const content = await loadDoc('ddd-agent-prompt');
        if (!args?.section) {
          return { content: [{ type: 'text', text: content }] };
        }
        const section = extractSection(content, args.section as string, '## ');
        return { content: [{ type: 'text', text: section }] };
      }

      case 'get_capability_info': {
        const content = await loadDoc('capabilities-guide');
        if (!args) return { content: [{ type: 'text', text: 'Missing arguments' }] };

        if (args.capability === 'all') {
          return { content: [{ type: 'text', text: content }] };
        }

        const section = extractCapabilitySection(content, args.capability as string, args?.section as string);
        return { content: [{ type: 'text', text: section }] };
      }

      case 'get_template_pattern': {
        const content = await loadDoc('ddd-pattern');
        if (!args) return { content: [{ type: 'text', text: 'Missing arguments' }] };

        const template = extractTemplate(content, args.pattern as string);
        return { content: [{ type: 'text', text: template }] };
      }

      case 'list_capabilities': {
        const content = await loadDoc('capabilities-guide');
        const overviewMatch = content.match(/^# Overview\n([\s\S]*?)(?=\n##|$)/m);
        const overview = overviewMatch ? overviewMatch[1].trim() : '';
        const tableMatch = content.match(/\| Package \| Version \| Purpose \|\n[\s\S]*?\n\n/);
        const table = tableMatch ? tableMatch[0] : '';
        return { content: [{ type: 'text', text: '# OxLayer Capabilities\n\n' + overview + '\n\n' + table }] };
      }

      case 'get_adapter_info': {
        const content = await loadDoc('capabilities-guide');
        if (!args) return { content: [{ type: 'text', text: 'Missing arguments' }] };

        if (args.adapter === 'all') {
          const section = extractSection(content, 'adapter-packages', '## ');
          return { content: [{ type: 'text', text: section }] };
        }

        const info = extractAdapterInfo(content, args.adapter as string);
        return { content: [{ type: 'text', text: info }] };
      }

      case 'get_frontend_guide': {
        const content = await loadDoc('frontend-guide');
        if (!args?.section) {
          return { content: [{ type: 'text', text: content }] };
        }

        const sections: Record<string, RegExp> = {
          'stack': /## Stack\n([\s\S]*?)(?=\n##|$)/,
          'naming': /## Naming\n([\s\S]*?)(?=\n##|$)/,
          'structure': /## Component Structure\n([\s\S]*?)(?=\n##|$)/,
          'colors': /## Colors \(CSS Variables\)\n([\s\S]*?)(?=\n##|$)/,
          'typescript': /## TypeScript\n([\s\S]*?)(?=\n##|$)/,
          'patterns': /## Important Patterns\n([\s\S]*?)(?=\n##|$)/,
          'compound': /## Compound Components\n([\s\S]*?)(?=\n##|$)/,
          'checklist': /## Checklist\n([\s\S]*?)(?=$)/,
        };

        const pattern = sections[args.section as string];
        if (!pattern) {
          return { content: [{ type: 'text', text: 'Section "' + args.section + '" not found. Available: ' + Object.keys(sections).join(', ') }] };
        }

        const match = content.match(pattern);
        return { content: [{ type: 'text', text: match ? match[1].trim() : 'Section not found' }] };
      }

      case 'get_web_capabilities': {
        const content = await loadDoc('web-capabilities');
        if (!args?.section) {
          return { content: [{ type: 'text', text: content }] };
        }

        const sections: Record<string, RegExp> = {
          'overview': /## Overview\n([\s\S]*?)(?=\n##)/,
          'quick-start': /## Quick Start\n([\s\S]*?)(?=\n##)/,
          'intent-system': /## Core Concepts\n([\s\S]*?)(?=\n##)/,
          'storage': /## Storage Backends\n([\s\S]*?)(?=\n##)/,
          'sync': /## Sync Management\n([\s\S]*?)(?=\n##)/,
          'workspace': /## Workspace Management\n([\s\S]*?)(?=\n##)/,
          'export': /## Export\/Import\n([\s\S]*?)(?=\n##)/,
          'api-reference': /## API Reference\n([\s\S]*?)(?=\n##)/,
          'best-practices': /## Best Practices\n([\s\S]*?)(?=$)/,
        };

        const pattern = sections[args.section as string];
        if (!pattern) {
          return { content: [{ type: 'text', text: 'Section "' + args.section + '" not found. Available: ' + Object.keys(sections).join(', ') }] };
        }

        const match = content.match(pattern);
        return { content: [{ type: 'text', text: match ? match[1].trim() : 'Section not found' }] };
      }

      case 'search_docs': {
        const results: string[] = [];
        let docsToSearch: Array<{ name: string; key: string; category: string }>;

        if (!args) return { content: [{ type: 'text', text: 'Missing arguments' }] };

        docsToSearch = Object.entries(DOCS).filter(([_, doc]) =>
          args.category === 'all' || doc.category === args.category
        ).map(([name, doc]) => ({ name, key: doc.key, category: doc.category }));

        for (const doc of docsToSearch) {
          const docContent = embeddedDocs[doc.key];
          if (docContent) {
            const matches = searchInDoc(docContent, args.query as string, doc.name);
            if (matches) results.push(matches);
          }
        }

        if (results.length === 0) {
          return { content: [{ type: 'text', text: 'No results found for "' + args.query + '"' }] };
        }
        return { content: [{ type: 'text', text: results.join('\n\n---\n\n') }] };
      }

      case 'get_best_practices': {
        const content = await loadDoc('ddd-agent-prompt');
        if (!args) return { content: [{ type: 'text', text: 'Missing arguments' }] };

        if (args.topic === 'all') {
          const section = extractSection(content, 'best-practices', '## ');
          return { content: [{ type: 'text', text: section }] };
        }

        const practice = extractBestPractice(content, args.topic as string);
        return { content: [{ type: 'text', text: practice }] };
      }

      case 'list_docs': {
        const category = args?.category as string ?? 'all';
        const docs = await loadDocsByCategory(category);
        return { content: [{ type: 'text', text: docs }] };
      }

      default:
        throw new Error('Unknown tool: ' + name);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: 'Error: ' + error }],
      isError: true,
    };
  }
});

// Helper functions
function extractSection(content: string, sectionName: string, headingLevel: string = '## '): string {
  const patterns: Record<string, RegExp> = {
    'overview': /## Overview\n([\s\S]*?)(?=\n##|$)/,
    'packages': /## OxLayer Packages\n([\s\S]*?)(?=\n##|$)/,
    'structure': /## Project Structure\n([\s\S]*?)(?=\n##|$)/,
    'naming': /## Naming Conventions\n([\s\S]*?)(?=\n##|$)/,
    'entity': /### 1\. Domain Entity\n([\s\S]*?)(?=\n###|##)/,
    'repository': /### 2\. Repository\n([\s\S]*?)(?=\n###|##)/,
    'use-case': /### [34]\. Use Case\n([\s\S]*?)(?=\n###|##)/,
    'controller': /### [56]\. Controller\n([\s\S]*?)(?=\n###|##)/,
    'container': /### 7\. DI Container\n([\s\S]*?)(?=\n###|##)/,
    'testing': /### 8\. Testing\n([\s\S]*?)(?=\n###|##)/,
    'security': /## Security Patterns\n([\s\S]*?)(?=\n##)/,
    'concepts': /## Key Concepts\n([\s\S]*?)(?=\n##)/,
    'stack': /## Technology Stack\n([\s\S]*?)(?=\n##)/,
    'best-practices': /## Best Practices\n([\s\S]*?)(?=\n##)/,
    'adapter-packages': /## Adapter Packages\n([\s\S]*?)(?=\n##)/,
    'root-overview': /# Overview\n([\s\S]*?)(?=\n##)/,
  };

  const pattern = patterns[sectionName];
  if (!pattern) {
    return 'Section "' + sectionName + '" not found. Available sections: ' + Object.keys(patterns).join(', ');
  }

  const match = content.match(pattern);
  return match ? '## ' + sectionName + '\n' + match[1].trim() : 'Section "' + sectionName + '" not found';
}

function extractCapabilitySection(content: string, capability: string, section?: string): string {
  const searchPattern = '^## ' + capability.toUpperCase() + '$';
  const headerPattern = new RegExp(searchPattern, 'i');
  const lines = content.split('\n');
  let startIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (headerPattern.test(lines[i])) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    return 'Capability "' + capability + '" not found';
  }

  let endIdx = startIdx + 1;
  while (endIdx < lines.length && !lines[endIdx].startsWith('## ')) {
    endIdx++;
  }

  let sectionContent = lines.slice(startIdx, endIdx).join('\n');

  if (section) {
    const subPattern = '^###+ ' + section;
    const subsectionPattern = new RegExp(subPattern, 'i');
    const subLines = sectionContent.split('\n');
    let subStart = -1;

    for (let i = 0; i < subLines.length; i++) {
      if (subsectionPattern.test(subLines[i])) {
        subStart = i;
        break;
      }
    }

    if (subStart === -1) {
      return 'Subsection "' + section + '" not found in capability "' + capability + '"';
    }

    let subEnd = subStart + 1;
    while (subEnd < subLines.length && !subLines[subEnd].startsWith('###')) {
      subEnd++;
    }

    sectionContent = subLines.slice(subStart, subEnd).join('\n');
  }

  return sectionContent;
}

function extractTemplate(content: string, pattern: string): string {
  const patterns: Record<string, string> = {
    'entity': '### 1. Domain Entity with Template',
    'repository': '### 2. Repository with Template',
    'use-case-create': '### 3. Use Case with Template (Create)',
    'use-case-list': '### 4. Use Case with Template (List)',
    'controller': '### 6. Controller with BaseController',
    'container': '### 7. DI Container with Template',
    'domain-event': '### 5. Domain Event with Template',
    'test-builder': '### 8. Testing with Templates',
    'validation': '## Security Patterns',
  };

  const searchStr = patterns[pattern];
  if (!searchStr) {
    return 'Template pattern "' + pattern + '" not found';
  }

  const lines = content.split('\n');
  let startIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === searchStr) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    return 'Template pattern "' + pattern + '" not found. Searching for: "' + searchStr + '"';
  }

  let endIdx = startIdx + 1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('###') || lines[i].startsWith('## ')) {
      endIdx = i;
      break;
    }
    endIdx = i + 1;
  }

  return lines.slice(startIdx, endIdx).join('\n');
}

function extractAdapterInfo(content: string, adapter: string): string {
  const tableMatch = content.match(/\| Adapter \| Implements \| Technology \|\n[\s\S]*?\n\n/);
  const adapterTable = tableMatch ? tableMatch[0] : '';

  if (adapter === 'all') {
    return '# OxLayer Adapters\n\n' + adapterTable;
  }

  const rows = adapterTable.split('\n').filter(line =>
    line.toLowerCase().includes(adapter.toLowerCase())
  );

  if (rows.length === 0) {
    return 'Adapter "' + adapter + '" not found. Available adapters: postgres, redis, rabbitmq, bullmq, sqs, mqtt, quickwit, qdrant, eventemitter';
  }

  return '# ' + adapter + ' Adapter\n\n' + rows.join('\n');
}

function searchInDoc(content: string, query: string, docName: string): string | null {
  const keywords = query.toLowerCase().split(/\s+/);
  const lines = content.split('\n');
  const matches: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (keywords.some(k => k.length > 2 && line.includes(k))) {
      const contextStart = Math.max(0, i - 1);
      const contextEnd = Math.min(lines.length, i + 2);
      const context = lines.slice(contextStart, contextEnd).join('\n');
      if (!matches.includes(context)) {
        matches.push(context);
      }
    }
  }

  if (matches.length === 0) return null;

  return '# Results from ' + docName + '\n\nFound ' + matches.length + ' matches for "' + query + '":\n\n' + matches.slice(0, 10).join('\n\n');
}

function extractBestPractice(content: string, topic: string): string {
  const practices: Record<string, string> = {
    'templates': '**Use Templates First**',
    'domain-purity': '**Domain Layer Purity**',
    'dependency-injection': '**Dependency Injection**',
    'validation': '**Validate at Boundaries**',
    'xss': '**XSS Protection**',
    'events': '**Event Fault Tolerance**',
    'testing': '**Test with Builders**',
    'tracing': '**Enable Tracing**',
    'auto-migration': '**Auto-Migration**',
    'lazy-loading': '**Lazy Loading**',
  };

  const practiceSearch = practices[topic];
  if (!practiceSearch) {
    return 'Best practice "' + topic + '" not found';
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(practiceSearch)) {
      const match = lines[i].match(/^(\d+)\.\s+\*\*([^*]+)\*\*:\s*(.+)$/);
      if (match) {
        const num = match[1];
        const title = match[2];
        const description = match[3];
        return '## Best Practice: ' + title + '\n\n' + num + '. **' + title + '**: ' + description;
      }
    }
  }

  return practiceSearch;
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP OxLayer server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
