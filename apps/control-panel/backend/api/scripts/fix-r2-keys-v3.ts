/**
 * Fix R2 keys - remove leading slash
 */

import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function fixR2Keys() {
  console.log('Removing leading slash from R2 keys...');

  const result = await db.execute(sql`
    UPDATE package_releases
    SET r2_key = SUBSTRING(r2_key FROM 2)
    WHERE version = '2026_02_14_001'
    AND r2_key LIKE '/%'
    RETURNING package_type, r2_key
  `) as any;

  console.log('Updated package releases:');
  const rows = Array.isArray(result) ? result : (result?.rows || []);
  rows.forEach((r: any) => {
    console.log(`  - ${r.package_type}: ${r.r2_key}`);
  });

  console.log('\n✅ Done!');
  process.exit(0);
}

fixR2Keys().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
