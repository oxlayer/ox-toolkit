/**
 * Doctor Service for Global OxLayer Infrastructure Service
 * Handles health checks and self-healing operations
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { ProjectsRegistry } from './types';

const execAsync = promisify(exec);

export class DoctorService {
  constructor(
    private readonly infraDir: string,
    private readonly composeFile: string,
    private readonly lockFile: string,
    private readonly loadRegistry: () => ProjectsRegistry
  ) {}

  /**
   * Run health check and self-healing
   */
  async runDoctor(): Promise<void> {
    console.log('🩺 OxLayer Global Infrastructure Doctor');
    console.log('═'.repeat(50));
    console.log();

    const issues: string[] = [];

    // Check 1: Global infrastructure initialized
    if (!this.isInitialized()) {
      issues.push('❌ Global infrastructure not initialized');
      console.log('❌ Global Infrastructure: Not initialized');
      console.log('   Fix: Run `ox global init`');
    } else {
      console.log('✅ Global Infrastructure: Initialized');
    }

    // Check 2: Docker network exists
    try {
      const { stdout } = await execAsync('docker network inspect ox_net', {
        timeout: 5000,
      });
      if (stdout.trim()) {
        console.log('✅ Docker Network (ox_net): Exists');
      }
    } catch {
      issues.push('Docker network ox_net missing');
      console.log('❌ Docker Network (ox_net): Missing');
      console.log('   Fix: Run `ox global start`');
    }

    // Check 3: Containers running
    const expectedContainers = [
      'ox-postgres',
      'ox-redis',
      'ox-rabbitmq',
      'ox-keycloak',
      'ox-prometheus',
      'ox-grafana',
      'ox-traefik',
    ];

    const runningContainers: string[] = [];
    const stoppedContainers: string[] = [];
    const missingContainers: string[] = [];

    for (const container of expectedContainers) {
      try {
        const { stdout } = await execAsync(
          `docker inspect -f '{{.State.Status}}' ${container} 2>/dev/null || echo "missing"`,
          { timeout: 3000 }
        );
        const status = stdout.trim();
        if (status === 'running') {
          runningContainers.push(container);
        } else if (status === 'missing') {
          missingContainers.push(container);
        } else {
          stoppedContainers.push(container);
        }
      } catch {
        missingContainers.push(container);
      }
    }

    console.log(`\n📊 Container Status:`);
    console.log(`   ✅ Running: ${runningContainers.length}/${expectedContainers.length}`);
    if (runningContainers.length > 0) {
      runningContainers.forEach((c) => console.log(`      • ${c}`));
    }

    if (stoppedContainers.length > 0) {
      console.log(`   ⚠️  Stopped: ${stoppedContainers.length}`);
      stoppedContainers.forEach((c) => console.log(`      • ${c}`));
      issues.push(`${stoppedContainers.length} containers stopped`);
    }

    if (missingContainers.length > 0) {
      console.log(`   ❌ Missing: ${missingContainers.length}`);
      missingContainers.forEach((c) => console.log(`      • ${c}`));
      issues.push(`${missingContainers.length} containers missing`);
    }

    // Check 4: Registry integrity
    console.log(`\n📋 Registry Integrity:`);
    try {
      const registry = this.loadRegistry();
      console.log(`   ✅ Registry file exists and is valid`);
      console.log(`   📊 Registered projects: ${Object.keys(registry.projects).length}`);

      // Check for Redis DB allocation consistency
      const { used, nextDb } = registry.redisDbAllocation;
      const maxDb = Math.max(...used, 0);
      if (nextDb !== maxDb + 1) {
        issues.push(`Redis DB allocation inconsistent (nextDb=${nextDb}, but max used=${maxDb})`);
        console.log(`   ⚠️  Redis DB allocation may be inconsistent`);
      } else {
        console.log(`   ✅ Redis DB allocation consistent (DB 0-${maxDb} used, next is ${nextDb})`);
      }

      // Check for orphaned resources
      console.log(`\n🔍 Resource Orphan Check:`);
      const projectDbs = Object.values(registry.projects).map((p) => p.resources.postgres.database);
      const projectVhosts = Object.values(registry.projects).map((p) => p.resources.rabbitmq.vhost);

      // Check PostgreSQL databases
      try {
        const { stdout } = await execAsync(
          `docker exec ox-postgres psql -U postgres -tAc "SELECT datname FROM pg_database WHERE datistemplate = false;"`,
          { timeout: 5000 }
        );
        const allDbs = stdout.trim().split('\n');
        const orphanedDbs = allDbs.filter(
          (db) => !['postgres', 'template0', 'template1'].includes(db) && !projectDbs.includes(db)
        );

        if (orphanedDbs.length > 0) {
          console.log(`   ⚠️  Orphaned PostgreSQL databases: ${orphanedDbs.length}`);
          orphanedDbs.forEach((db) => console.log(`      • ${db}`));
        } else {
          console.log(`   ✅ No orphaned PostgreSQL databases`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not check PostgreSQL databases`);
      }

      // Check RabbitMQ vhosts
      try {
        const { stdout } = await execAsync(`docker exec ox-rabbitmq rabbitmqctl list_vhosts`, {
          timeout: 5000,
        });
        const allVhosts = stdout
          .trim()
          .split('\n')
          .map((v) => v.replace(/\s.*$/, ''))
          .filter((v) => v && v !== '/');
        const orphanedVhosts = allVhosts.filter((vhost) => !projectVhosts.includes(vhost));

        if (orphanedVhosts.length > 0) {
          console.log(`   ⚠️  Orphaned RabbitMQ vhosts: ${orphanedVhosts.length}`);
          orphanedVhosts.forEach((v) => console.log(`      • ${v}`));
        } else {
          console.log(`   ✅ No orphaned RabbitMQ vhosts`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not check RabbitMQ vhosts`);
      }
    } catch (error: any) {
      issues.push(`Registry corrupted or invalid: ${error.message}`);
      console.log(`   ❌ Registry file corrupted or invalid`);
    }

    // Check 5: Lock file status
    console.log(`\n🔒 Lock File Status:`);
    if (existsSync(this.lockFile)) {
      const lockPid = readFileSync(this.lockFile, 'utf-8').trim();
      try {
        process.kill(parseInt(lockPid), 0);
        console.log(`   ⚠️  Lock file held by PID ${lockPid} (active)`);
        console.log(`      If stale, remove: ${this.lockFile}`);
      } catch {
        console.log(`   ⚠️  Stale lock file from PID ${lockPid} (process dead)`);
        console.log(`      Fix: Remove stale lock file`);
        issues.push('Stale lock file detected');
      }
    } else {
      console.log(`   ✅ No lock file (not in operation)`);
    }

    // Summary
    console.log();
    console.log('═'.repeat(50));
    if (issues.length === 0) {
      console.log('✅ All checks passed! System is healthy.');
    } else {
      console.log(`⚠️  Found ${issues.length} issue(s):`);
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
      console.log();
      console.log('💡 Run suggested fixes to resolve issues.');
    }
    console.log();
  }

  /**
   * Reset project - delete all resources
   * DANGEROUS: This cannot be undone!
   */
  async resetProject(projectName: string, confirm: boolean, getProject: (name: string) => any, unregisterProject: (name: string) => Promise<void>): Promise<void> {
    console.log('🔄 Reset Project Resources');
    console.log('═'.repeat(50));
    console.log();
    console.log(`⚠️  WARNING: This will DELETE all resources for project '${projectName}'`);
    console.log();
    console.log('This will:');
    console.log('  • Drop PostgreSQL database');
    console.log('  • Delete PostgreSQL user');
    console.log('  • Delete RabbitMQ vhost');
    console.log('  • Delete RabbitMQ user');
    console.log('  • Remove from registry');
    console.log('  • Free Redis DB number');
    console.log();

    const project = getProject(projectName);
    if (!project) {
      throw new Error(`Project '${projectName}' not found`);
    }

    console.log('Resources to be deleted:');
    console.log(`  PostgreSQL DB: ${project.resources.postgres.database}`);
    console.log(`  PostgreSQL User: ${project.resources.postgres.user}`);
    console.log(`  RabbitMQ VHost: ${project.resources.rabbitmq.vhost}`);
    console.log(`  RabbitMQ User: ${project.resources.rabbitmq.user}`);
    console.log(`  Redis DB: ${project.resources.redis.db}`);
    console.log();

    if (!confirm) {
      console.log('❌ Aborted. Use --confirm to proceed.');
      console.log('   Example: ox infra reset ' + projectName + ' --confirm');
      return;
    }

    console.log('🗑️  Deleting resources...');

    // Drop PostgreSQL database and user
    try {
      console.log(`  • Dropping PostgreSQL database ${project.resources.postgres.database}...`);
      await execAsync(
        `docker exec ox-postgres psql -U postgres -c "DROP DATABASE IF EXISTS ${project.resources.postgres.database};"`,
        { timeout: 5000 }
      );
    } catch (error: any) {
      console.warn(`    ⚠ Failed to drop database: ${error.message}`);
    }

    try {
      console.log(`  • Dropping PostgreSQL user ${project.resources.postgres.user}...`);
      await execAsync(
        `docker exec ox-postgres psql -U postgres -c "DROP USER IF EXISTS ${project.resources.postgres.user};"`,
        { timeout: 5000 }
      );
    } catch (error: any) {
      console.warn(`    ⚠ Failed to drop user: ${error.message}`);
    }

    // Delete RabbitMQ vhost and user
    try {
      console.log(`  • Deleting RabbitMQ vhost ${project.resources.rabbitmq.vhost}...`);
      await execAsync(`docker exec ox-rabbitmq rabbitmqctl delete_vhost ${project.resources.rabbitmq.vhost}`, {
        timeout: 5000,
      });
    } catch (error: any) {
      console.warn(`    ⚠ Failed to delete vhost: ${error.message}`);
    }

    try {
      console.log(`  • Deleting RabbitMQ user ${project.resources.rabbitmq.user}...`);
      await execAsync(`docker exec ox-rabbitmq rabbitmqctl delete_user ${project.resources.rabbitmq.user}`, {
        timeout: 5000,
      });
    } catch (error: any) {
      console.warn(`    ⚠ Failed to delete user: ${error.message}`);
    }

    // Unregister project (frees Redis DB)
    await unregisterProject(projectName);

    console.log();
    console.log('✅ Project resources deleted successfully!');
    console.log();
    console.log('💡 Note: Keycloak realm should be deleted manually via Admin UI');
  }

  /**
   * Check if global infrastructure is initialized
   */
  private isInitialized(): boolean {
    return existsSync(this.infraDir) && existsSync(this.composeFile);
  }
}
