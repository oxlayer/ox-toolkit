#!/usr/bin/env bun

/**
 * Script to update all adapter package.json files with Apache 2.0 license
 * and proper naming convention
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const ADAPTERS_BASE = join(import.meta.dir, '../capabilities/adapters');

interface AdapterConfig {
  category: string;
  name: string;
  description: string;
}

const ADAPTER_CATEGORIES: Record<string, AdapterConfig[]> = {
  database: [
    { name: 'postgres', description: 'PostgreSQL adapter' },
    { name: 'postgres-tenancy', description: 'PostgreSQL adapter with multi-tenancy support' },
    { name: 'mongo', description: 'MongoDB adapter' },
    { name: 'mongo-tenancy', description: 'MongoDB adapter with multi-tenancy support' },
    { name: 'redis', description: 'Redis adapter' },
    { name: 'redis-tenancy', description: 'Redis adapter with multi-tenancy support' },
    { name: 'clickhouse', description: 'ClickHouse adapter' },
    { name: 'clickhouse-tenancy', description: 'ClickHouse adapter with multi-tenancy support' },
    { name: 'influxdb', description: 'InfluxDB adapter' },
    { name: 'influxdb-tenancy', description: 'InfluxDB adapter with multi-tenancy support' },
  ],
  storage: [
    { name: 's3', description: 'AWS S3 storage adapter' },
    { name: 's3-tenancy', description: 'AWS S3 storage adapter with multi-tenancy support' },
    { name: 'qdrant', description: 'Qdrant vector storage adapter' },
    { name: 'qdrant-tenancy', description: 'Qdrant vector storage adapter with multi-tenancy support' },
    { name: 'quickwit', description: 'Quickwit storage adapter' },
    { name: 'quickwit-tenancy', description: 'Quickwit storage adapter with multi-tenancy support' },
  ],
  messaging: [
    { name: 'rabbitmq', description: 'RabbitMQ messaging adapter' },
    { name: 'rabbitmq-tenancy', description: 'RabbitMQ messaging adapter with multi-tenancy support' },
    { name: 'bullmq', description: 'BullMQ queue adapter' },
    { name: 'bullmq-scheduler', description: 'BullMQ scheduler adapter' },
    { name: 'sqs', description: 'AWS SQS messaging adapter' },
    { name: 'sqs-tenancy', description: 'AWS SQS messaging adapter with multi-tenancy support' },
    { name: 'mqtt', description: 'MQTT messaging adapter' },
    { name: 'mqtt-tenancy', description: 'MQTT messaging adapter with multi-tenancy support' },
    { name: 'eventemitter', description: 'EventEmitter adapter for local events' },
  ],
  search: [
    // Add search adapters when available
    // { name: 'meilisearch', description: 'Meilisearch adapter' },
    // { name: 'opensearch', description: 'OpenSearch adapter' },
  ],
  vector: [
    // Vector adapters are in storage category
  ],
};

async function updatePackageJson(category: string, adapter: AdapterConfig) {
  const packagePath = join(ADAPTERS_BASE, category, adapter.name, 'package.json');

  try {
    const content = await readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    // Update package name
    const oldName = pkg.name;
    pkg.name = `@oxlayer/adapters-${adapter.name}`;

    // Update license
    if (!pkg.private) {
      pkg.license = 'Apache-2.0';
    }

    // Update description if provided
    if (adapter.description) {
      pkg.description = adapter.description;
    }

    // Add repository field
    pkg.repository = {
      type: 'git',
      url: 'https://github.com/oxlayer/oxlayer.git',
      directory: `capabilities/adapters/${category}/${adapter.name}`,
    };

    // Add homepage
    pkg.homepage = `https://github.com/oxlayer/oxlayer/tree/main/capabilities/adapters/${category}/${adapter.name}`;

    // Write updated package.json
    await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n');

    console.log(`✅ Updated ${oldName} -> ${pkg.name}`);
  } catch (error) {
    console.error(`❌ Error updating ${adapter.name}:`, error.message);
  }
}

async function createCategoryReadme(category: string, adapters: AdapterConfig[]) {
  const readmePath = join(ADAPTERS_BASE, category, 'README.md');

  const categoryDescriptions: Record<string, string> = {
    database: 'Database adapters for PostgreSQL, MongoDB, Redis, ClickHouse, InfluxDB, and more.',
    storage: 'Storage adapters for AWS S3, Qdrant, Quickwit, and other storage services.',
    messaging: 'Messaging adapters for RabbitMQ, BullMQ, SQS, MQTT, and other messaging systems.',
    search: 'Search adapters for Meilisearch, OpenSearch, and other search engines.',
    vector: 'Vector database adapters for semantic search and vector operations.',
  };

  const content = `# ${category.charAt(0).toUpperCase() + category.slice(1)} Adapters

${categoryDescriptions[category] || `Adapters for ${category} services.`}

## Available Adapters

${adapters.map(adapter => {
  const packageName = `@oxlayer/adapters-${adapter.name}`;
  return `### ${adapter.name}

\`\`\`bash
pnpm add ${packageName}
\`\`\`

${adapter.description}
`;
}).join('\n')}

## Multi-Tenancy Support

Many adapters come with multi-tenancy support. These packages are suffixed with \`-tenancy\` and provide:
- Automatic tenant context injection
- Tenant-isolated connections
- Dynamic resource provisioning
- Row-level security (where applicable)

## License

Apache-2.0 - see [LICENSE](../../../LICENSE) for details.
`;

  await writeFile(readmePath, content);
  console.log(`✅ Created ${category}/README.md`);
}

async function main() {
  console.log('📦 Updating adapter package.json files...\n');

  for (const [category, adapters] of Object.entries(ADAPTER_CATEGORIES)) {
    console.log(`\n📁 Processing ${category} adapters...`);

    for (const adapter of adapters) {
      await updatePackageJson(category, adapter);
    }

    await createCategoryReadme(category, adapters);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
