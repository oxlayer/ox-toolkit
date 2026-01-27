#!/usr/bin/env bun
/**
 * Tenant Provisioning CLI
 *
 * Command-line tool for provisioning new multi-tenant infrastructure.
 *
 * Usage:
 *   bun scripts/provision-tenant.ts provision <tenant-id> <tier> [options]
 *   bun scripts/provision-tenant.ts list
 *   bun scripts/provision-tenant.ts status <tenant-id>
 *
 * Examples:
 *   # Provision a B2C tenant (shared database)
 *   bun scripts/provision-tenant.ts provision b2c-test b2c
 *
 *   # Provision a B2B enterprise tenant (dedicated database)
 *   bun scripts/provision-tenant.ts provision acme-corp b2b-enterprise --region us-east-1
 *
 *   # List all tenants
 *   bun scripts/provision-tenant.ts list
 *
 *   # Check tenant status
 *   bun scripts/provision-tenant.ts status acme-corp
 */

import { getDatabase } from '../packages/database/src/index.js';
import { tenants, tenantDatabases, tenantStorage } from '../packages/database/src/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Tenant tier type
 */
type TenantTier = 'b2c' | 'b2b-enterprise';

/**
 * Isolation mode for resources
 */
type IsolationMode = 'shared' | 'schema' | 'database' | 'dedicated';

/**
 * Provisioning input
 */
interface ProvisionTenantInput {
  tenantId: string;
  tier: TenantTier;
  region: string;
  isolation?: {
    database?: IsolationMode;
    bucket?: IsolationMode;
    cache?: IsolationMode;
  };
}

/**
 * Tenant configuration output
 */
interface TenantConfig {
  tenantId: string;
  state: string;
  tier: string;
  region: string;
  isolation: {
    database: IsolationMode;
    bucket?: IsolationMode;
    cache?: IsolationMode;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    secretRef: string;
  };
  storage?: {
    bucket: string;
    prefix?: string;
    region: string;
    secretRef?: string;
  };
}

/**
 * Provision a new tenant
 *
 * Steps:
 * 1. Validate input
 * 2. Create infrastructure (B2B only)
 * 3. Generate credentials
 * 4. Store in Bitwarden
 * 5. Store in control plane
 * 6. Run migrations (B2B only)
 * 7. Mark as ready
 */
async function provisionTenant(input: ProvisionTenantInput): Promise<TenantConfig> {
  console.log(`🚀 Provisioning tenant: ${input.tenantId}`);
  console.log(`   Tier: ${input.tier}`);
  console.log(`   Region: ${input.region}`);

  const db = getDatabase();

  // Step 1: Check if tenant already exists
  const [existing] = await db.select().from(tenants).where(eq(tenants.tenantId, input.tenantId));
  if (existing) {
    throw new Error(`Tenant ${input.tenantId} already exists with state: ${existing.state}`);
  }

  // Determine isolation strategy based on tier
  const isolationDatabase = input.isolation?.database ?? (input.tier === 'b2b-enterprise' ? 'database' : 'shared');
  const isolationBucket = input.isolation?.bucket ?? (input.tier === 'b2b-enterprise' ? 'dedicated' : 'shared');
  const isolationCache = input.isolation?.cache ?? (input.tier === 'b2b-enterprise' ? 'dedicated' : 'shared');

  // Step 2: Create infrastructure (B2B only)
  if (input.tier === 'b2b-enterprise') {
    console.log(`   📦 Creating infrastructure...`);

    if (isolationDatabase === 'database') {
      console.log(`      → Provisioning RDS database...`);
      // TODO: Call AWS SDK to create RDS instance
      // const rds = await createRDSDatabase(input.tenantId, input.region);
      console.log(`      → Skipping RDS creation (demo mode)`);
    }

    if (isolationBucket === 'dedicated') {
      console.log(`      → Provisioning S3 bucket...`);
      // TODO: Call AWS SDK to create S3 bucket
      // const bucket = await createS3Bucket(input.tenantId, input.region);
      console.log(`      → Skipping S3 creation (demo mode)`);
    }
  }

  // Step 3: Generate credentials
  console.log(`   🔐 Generating credentials...`);
  const dbCredentials = generateDatabaseCredentials(input.tenantId);
  const storageCredentials = isolationBucket === 'dedicated' ? generateStorageCredentials(input.tenantId) : null;

  // Step 4: Store in Bitwarden
  console.log(`   🗄️  Storing secrets in Bitwarden...`);
  const dbSecretRef = `tenants/${input.tenantId}/database`;
  // TODO: Call Bitwarden API to store secrets
  console.log(`      → Database secret: ${dbSecretRef}`);
  console.log(`      → Skipping Bitwarden storage (demo mode)`);

  const storageSecretRef = storageCredentials ? `tenants/${input.tenantId}/storage` : undefined;

  // Step 5: Store in control plane database
  console.log(`   💾 Storing configuration in control plane...`);

  // Insert tenant record
  await db.insert(tenants).values({
    tenantId: input.tenantId,
    state: 'provisioning',
    tier: input.tier,
    region: input.region,
    isolationDatabase,
    isolationBucket,
    isolationCache,
  });

  // Insert database routing
  const dbHost = input.tier === 'b2b-enterprise'
    ? `postgres-${input.tenantId}.internal`
    : 'postgres.main.internal';

  const dbName = input.tier === 'b2b-enterprise'
    ? `tenant_${input.tenantId}`
    : 'app_main';

  await db.insert(tenantDatabases).values({
    tenantId: input.tenantId,
    dbHost,
    dbPort: 5432,
    dbName,
    dbUser: 'tenant_user',
    secretRef: dbSecretRef,
    region: input.region,
  });

  // Insert storage routing (if applicable)
  let storageConfig: { bucket: string; prefix?: string; region: string; secretRef?: string } | undefined;
  if (isolationBucket === 'dedicated') {
    storageConfig = {
      bucket: `${input.tenantId}-data`,
      region: input.region,
      secretRef: storageSecretRef,
    };

    await db.insert(tenantStorage).values({
      tenantId: input.tenantId,
      bucketName: storageConfig.bucket,
      region: storageConfig.region,
      secretRef: storageSecretRef,
    });
  } else if (isolationBucket === 'shared') {
    storageConfig = {
      bucket: 'app-production',
      prefix: input.tenantId,
      region: input.region,
    };

    await db.insert(tenantStorage).values({
      tenantId: input.tenantId,
      bucketName: storageConfig.bucket,
      bucketPrefix: storageConfig.prefix,
      region: storageConfig.region,
    });
  }

  // Step 6: Run migrations (B2B only)
  if (input.tier === 'b2b-enterprise' && isolationDatabase === 'database') {
    console.log(`   🔄 Running database migrations...`);
    // TODO: Run migrations for tenant database
    console.log(`      → Skipping migrations (demo mode)`);
  }

  // Step 7: Mark as ready
  console.log(`   ✅ Marking tenant as ready...`);
  await db.update(tenants)
    .set({ state: 'ready' })
    .where(eq(tenants.tenantId, input.tenantId));

  console.log(`\n✅ Tenant ${input.tenantId} provisioned successfully!\n`);

  return {
    tenantId: input.tenantId,
    state: 'ready',
    tier: input.tier,
    region: input.region,
    isolation: {
      database: isolationDatabase,
      bucket: isolationBucket,
      cache: isolationCache,
    },
    database: {
      host: dbHost,
      port: 5432,
      name: dbName,
      user: 'tenant_user',
      secretRef: dbSecretRef,
    },
    storage: storageConfig,
  };
}

/**
 * Generate database credentials for a tenant
 */
function generateDatabaseCredentials(tenantId: string) {
  const password = generateRandomPassword(32);
  return {
    username: `tenant_${tenantId}`,
    password,
    host: `postgres-${tenantId}.internal`,
    port: 5432,
  };
}

/**
 * Generate storage credentials for a tenant
 */
function generateStorageCredentials(tenantId: string) {
  return {
    accessKeyId: `AKIAIOSFODNN7EXAMPLE`,
    secretAccessKey: generateRandomPassword(40),
    region: 'us-east-1',
  };
}

/**
 * Generate a random password
 */
function generateRandomPassword(length: number): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const random = [];
  for (let i = 0; i < length; i++) {
    random.push(charset[Math.floor(Math.random() * charset.length)]);
  }
  return random.join('');
}

/**
 * List all tenants
 */
async function listTenants(): Promise<void> {
  const db = getDatabase();
  const allTenants = await db.select().from(tenants);

  console.log('\n📋 All Tenants:\n');

  if (allTenants.length === 0) {
    console.log('   No tenants found.');
    return;
  }

  for (const tenant of allTenants) {
    const statusEmoji = tenant.state === 'ready' ? '✅' : tenant.state === 'provisioning' ? '🔄' : '❌';
    console.log(`   ${statusEmoji} ${tenant.tenantId}`);
    console.log(`      Tier: ${tenant.tier}`);
    console.log(`      State: ${tenant.state}`);
    console.log(`      Region: ${tenant.region}`);
    console.log(`      Database Isolation: ${tenant.isolationDatabase}`);
    if (tenant.isolationBucket) {
      console.log(`      Bucket Isolation: ${tenant.isolationBucket}`);
    }
    console.log(`      Created: ${tenant.createdAt}`);
    console.log('');
  }
}

/**
 * Get tenant status
 */
async function getTenantStatus(tenantId: string): Promise<void> {
  const db = getDatabase();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.tenantId, tenantId));

  if (!tenant) {
    console.log(`❌ Tenant not found: ${tenantId}`);
    return;
  }

  const [dbConfig] = await db.select().from(tenantDatabases).where(eq(tenantDatabases.tenantId, tenantId));
  const [storageConfig] = await db.select().from(tenantStorage).where(eq(tenantStorage.tenantId, tenantId));

  console.log(`\n📋 Tenant Status: ${tenantId}\n`);
  console.log(`   State: ${tenant.state}`);
  console.log(`   Tier: ${tenant.tier}`);
  console.log(`   Region: ${tenant.region}`);
  console.log(`   Created: ${tenant.createdAt}`);
  console.log(`   Updated: ${tenant.updatedAt}`);
  console.log(`\n   Isolation:`);
  console.log(`   - Database: ${tenant.isolationDatabase}`);
  if (tenant.isolationBucket) {
    console.log(`   - Bucket: ${tenant.isolationBucket}`);
  }
  if (tenant.isolationCache) {
    console.log(`   - Cache: ${tenant.isolationCache}`);
  }

  if (dbConfig) {
    console.log(`\n   Database:`);
    console.log(`   - Host: ${dbConfig.dbHost}`);
    console.log(`   - Port: ${dbConfig.dbPort}`);
    console.log(`   - Name: ${dbConfig.dbName}`);
    console.log(`   - User: ${dbConfig.dbUser}`);
    console.log(`   - Secret: ${dbConfig.secretRef}`);
  }

  if (storageConfig) {
    console.log(`\n   Storage:`);
    console.log(`   - Bucket: ${storageConfig.bucketName}`);
    if (storageConfig.bucketPrefix) {
      console.log(`   - Prefix: ${storageConfig.bucketPrefix}`);
    }
    console.log(`   - Region: ${storageConfig.region}`);
    if (storageConfig.secretRef) {
      console.log(`   - Secret: ${storageConfig.secretRef}`);
    }
  }

  console.log('');
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'provision': {
        const tenantId = args[1];
        const tier = (args[2] || 'b2c') as TenantTier;
        const regionIndex = args.indexOf('--region');
        const region = regionIndex !== -1 ? args[regionIndex + 1] : 'us-east-1';

        if (!tenantId) {
          console.error('❌ Error: Missing tenant ID');
          console.log('\nUsage: bun scripts/provision-tenant.ts provision <tenant-id> <tier> [options]');
          console.log('  tenant-id: Unique tenant identifier (e.g., acme-corp)');
          console.log('  tier: b2c | b2b-enterprise');
          console.log('  --region: AWS region (default: us-east-1)');
          process.exit(1);
        }

        if (tier !== 'b2c' && tier !== 'b2b-enterprise') {
          console.error(`❌ Error: Invalid tier "${tier}". Must be "b2c" or "b2b-enterprise"`);
          process.exit(1);
        }

        await provisionTenant({
          tenantId,
          tier,
          region,
        });
        break;
      }

      case 'list': {
        await listTenants();
        break;
      }

      case 'status': {
        const tenantId = args[1];
        if (!tenantId) {
          console.error('❌ Error: Missing tenant ID');
          console.log('\nUsage: bun scripts/provision-tenant.ts status <tenant-id>');
          process.exit(1);
        }
        await getTenantStatus(tenantId);
        break;
      }

      default:
        console.log(`
Tenant Provisioning CLI
========================

Usage:
  bun scripts/provision-tenant.ts provision <tenant-id> <tier> [options]
  bun scripts/provision-tenant.ts list
  bun scripts/provision-tenant.ts status <tenant-id>

Commands:
  provision  Provision a new tenant
  list       List all tenants
  status     Show tenant status

Arguments:
  tenant-id  Unique tenant identifier (e.g., acme-corp, b2c-test)

Options:
  tier       Tenant tier: b2c | b2b-enterprise
  --region   AWS region (default: us-east-1)

Examples:
  # Provision a B2C tenant (shared database)
  bun scripts/provision-tenant.ts provision b2c-test b2c

  # Provision a B2B enterprise tenant (dedicated database)
  bun scripts/provision-tenant.ts provision acme-corp b2b-enterprise --region us-east-1

  # List all tenants
  bun scripts/provision-tenant.ts list

  # Check tenant status
  bun scripts/provision-tenant.ts status acme-corp
        `);
        break;
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run CLI
main();
