/**
 * Seed Development Data
 *
 * On-demand script to:
 * 1. Sync organization from Keycloak
 * 2. Create/update developer with owner role
 * 3. Create an active enterprise license
 * 4. Seed package releases from R2
 *
 * Usage: bun scripts/seed-dev-data.ts
 */

import { db } from '../src/db/index.js';
import { getContainer } from '../src/infrastructure/di/container.js';
import { KeycloakSyncService } from '../src/services/keycloak-sync.service.js';
import { Organization, Developer, License } from '../src/domain/index.js';
import { packageReleases } from '../src/db/schema.js';
import { generateId } from '@oxlayer/foundation-domain-kit';

interface SeedConfig {
  organizationId: string;
  developerId: string;
  developerEmail: string;
  developerName: string;
  licenseExpiryDays?: number;
  sdkVersion?: string;
}

async function seedDevData(config: SeedConfig) {
  console.log('🌱 Seeding development data...');
  console.log('Config:', config);

  const container = getContainer();
  const { organizationRepository, developerRepository, licenseRepository } = container;

  // 1. Sync or create organization
  console.log('\n📋 Syncing organization...');
  const syncService = new KeycloakSyncService(organizationRepository, developerRepository);

  const orgSyncResult = await syncService.syncOrganization(config.organizationId);
  if (orgSyncResult.error) {
    console.error('❌ Failed to sync organization:', orgSyncResult.error);
    throw orgSyncResult.error;
  }
  console.log(`✅ Organization ${config.organizationId} ${orgSyncResult.synced ? 'created' : 'already exists'}`);

  // 2. Sync or create developer
  console.log('\n👤 Syncing developer...');
  const devSyncResult = await syncService.syncDeveloper(
    config.developerId,
    config.organizationId,
    config.developerEmail
  );
  if (devSyncResult.error) {
    console.error('❌ Failed to sync developer:', devSyncResult.error);
    throw devSyncResult.error;
  }
  console.log(`✅ Developer ${config.developerId} ${devSyncResult.synced ? 'created' : 'already exists'}`);

  // 3. Check for existing license
  console.log('\n📜 Checking for existing license...');
  const existingLicenses = await licenseRepository.findActiveByOrganization(config.organizationId);

  let license: License;
  if (existingLicenses && existingLicenses.length > 0) {
    license = existingLicenses[0];
    console.log(`ℹ️  Organization already has ${existingLicenses.length} active license(s)`);
    console.log('License IDs:', existingLicenses.map(l => l.id));
  } else {
    // 4. Create enterprise license
    console.log('\n➕ Creating enterprise license...');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (config.licenseExpiryDays || 365));

    license = License.create({
      organizationId: config.organizationId,
      name: 'Enterprise License',
      tier: 'enterprise',
      expiresAt,
    });

    // Add all packages
    license.addPackage('backend-sdk');
    license.addPackage('frontend-sdk');
    license.addPackage('cli-tools');

    // Activate the license
    license.activate();

    await licenseRepository.save(license);

    console.log('✅ License created successfully!');
    console.log(`   License ID: ${license.id}`);
    console.log(`   Tier: ${license.tier}`);
    console.log(`   Expires: ${license.expiresAt?.toISOString() || 'Never'}`);
    console.log(`   Packages: ${license.packages.join(', ')}`);
  }

  // 5. Seed package releases (R2 versions)
  console.log('\n📦 Seeding package releases...');
  const version = config.sdkVersion || '2026_02_14_001';

  const packagesToSeed = [
    { type: 'backend-sdk' as const, name: 'Backend SDK' },
    { type: 'frontend-sdk' as const, name: 'Frontend SDK' },
    { type: 'cli-tools' as const, name: 'CLI Tools' },
  ];

  for (const pkg of packagesToSeed) {
    try {
      // Try to insert package release record
      await db.insert(packageReleases).values({
        id: generateId(),
        packageType: pkg.type,
        version,
        checksum: 'auto-generated', // You may want to fetch actual checksum from R2
        sizeBytes: 650000, // Approximate size from R2 (622KB)
        r2Key: `capabilities-sdk/releases/${version}/oxlayer-sdk-${version}.zip`,
      });

      console.log(`   ✅ Seeded ${pkg.name} ${version}`);
    } catch (error: any) {
      // If it's a unique constraint violation, it already exists
      if (error?.code === '23505' || error?.message?.includes('unique constraint')) {
        console.log(`   ℹ️  ${pkg.name} ${version} already exists`);
      } else {
        console.error(`   ❌ Failed to seed ${pkg.name}:`, error.message);
        throw error;
      }
    }
  }

  console.log('\n✅ Seed complete!');
}

// Import eq function for query
import { eq } from 'drizzle-orm';

// Get config from environment or use defaults
const config: SeedConfig = {
  organizationId: process.env.SEED_ORG_ID || '3e5cfdfe-81ae-421b-a258-e0885a6ea8fb',
  developerId: process.env.SEED_DEV_ID || '0ebd0e8f-0aac-4492-ba59-12d6aff9aad4',
  developerEmail: process.env.SEED_DEV_EMAIL || 'admin@oxlayer.local',
  developerName: process.env.SEED_DEV_NAME || 'Admin',
  licenseExpiryDays: parseInt(process.env.SEED_LICENSE_DAYS || '365'),
  sdkVersion: process.env.SEED_SDK_VERSION || '2026_02_14_001',
};

// Run seed
seedDevData(config)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });
