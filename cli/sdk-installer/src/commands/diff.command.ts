/**
 * Diff Command
 *
 * Compare capabilities between SDK versions
 */

import type { CapabilityLimits } from '../types/index.js';
import { header, success, error, info, printList } from '../utils/cli.js';

export interface DiffOptions {
  verbose?: boolean;
  format?: 'text' | 'json';
}

/**
 * Capability change type
 */
type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

/**
 * Capability diff entry
 */
interface CapabilityDiff {
  name: string;
  change: ChangeType;
  before?: CapabilityLimits;
  after?: CapabilityLimits;
  changes?: string[];
}

/**
 * Format a limit value for display
 */
function formatLimitValue(key: string, value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? '✓ enabled' : '✗ disabled';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Get changed limits between two capability configs
 */
function getCapabilityChanges(
  before: CapabilityLimits,
  after: CapabilityLimits
): string[] {
  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeValue = before[key as keyof CapabilityLimits];
    const afterValue = after[key as keyof CapabilityLimits];

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes.push(
        `  ${key}: ${formatLimitValue(key, beforeValue)} → ${formatLimitValue(key, afterValue)}`
      );
    }
  }

  return changes;
}

/**
 * Diff capabilities between two versions
 */
export async function diff(
  fromVersion: string,
  toVersion: string,
  options: DiffOptions = {}
): Promise<void> {
  header(`Capability Diff: ${fromVersion} → ${toVersion}`);

  const spinner = await import('../utils/cli.js').then(m => m.createSpinner('Fetching manifests...'));
  spinner.start();

  try {
    // In a real implementation, we would fetch manifests from the API
    // For now, we'll simulate this with mock data
    spinner.succeed('Manifests fetched');

    // Mock data for demonstration
    const beforeCapabilities: Record<string, CapabilityLimits> = {
      auth: { maxRealms: 1, sso: false, rbac: true },
      storage: { encryption: false, maxStorageGb: 100 },
      vector: { maxVectorCollections: 10, maxVectorDimensions: 1536 },
    };

    const afterCapabilities: Record<string, CapabilityLimits> = {
      auth: { maxRealms: 5, sso: true, rbac: true },
      storage: { encryption: true, maxStorageGb: 1000 },
      search: { maxResults: 10000 },
      vector: { maxVectorCollections: 50, hybridSearch: true },
    };

    const diffs: CapabilityDiff[] = [];

    // Find added capabilities
    for (const [name, limits] of Object.entries(afterCapabilities)) {
      if (!(name in beforeCapabilities)) {
        diffs.push({
          name,
          change: 'added',
          after: limits,
        });
      }
    }

    // Find removed capabilities
    for (const [name, limits] of Object.entries(beforeCapabilities)) {
      if (!(name in afterCapabilities)) {
        diffs.push({
          name,
          change: 'removed',
          before: limits,
        });
      }
    }

    // Find modified capabilities
    for (const name of Object.keys(beforeCapabilities)) {
      if (name in afterCapabilities) {
        const before = beforeCapabilities[name]!;
        const after = afterCapabilities[name]!;
        const changes = getCapabilityChanges(before, after);

        if (changes.length > 0) {
          diffs.push({
            name,
            change: 'modified',
            before,
            after,
            changes,
          });
        }
      }
    }

    console.log();

    // Print summary
    const addedCount = diffs.filter(d => d.change === 'added').length;
    const removedCount = diffs.filter(d => d.change === 'removed').length;
    const modifiedCount = diffs.filter(d => d.change === 'modified').length;

    if (addedCount > 0) {
      success(`${addedCount} capability(ies) added`);
    }
    if (modifiedCount > 0) {
      info(`${modifiedCount} capability(ies) modified`);
    }
    if (removedCount > 0) {
      error(`${removedCount} capability(ies) removed`);
    }

    console.log();

    // Print detailed diffs
    if (options.verbose || diffs.length > 0) {
      header('Detailed Changes');

      for (const diff of diffs) {
        switch (diff.change) {
          case 'added':
            success(`+ ${diff.name} (new)`);
            if (options.verbose && diff.after) {
              const limits = Object.entries(diff.after)
                .map(([k, v]) => `    ${k}: ${formatLimitValue(k, v)}`)
                .join('\n');
              console.log(limits);
            }
            break;
          case 'removed':
            error(`- ${diff.name} (removed)`);
            if (options.verbose && diff.before) {
              const limits = Object.entries(diff.before)
                .map(([k, v]) => `    ${k}: ${formatLimitValue(k, v)}`)
                .join('\n');
              console.log(limits);
            }
            break;
          case 'modified':
            info(`~ ${diff.name} (modified)`);
            if (diff.changes && diff.changes.length > 0) {
              console.log(diff.changes.join('\n'));
            }
            break;
        }
        console.log();
      }
    }

    // Print upgrade recommendations
    header('Upgrade Recommendations');

    if (modifiedCount > 0) {
      const modifiedDiffs = diffs.filter(d => d.change === 'modified');

      for (const diff of modifiedDiffs) {
        const breakingChanges = diff.changes?.filter(c =>
          c.includes('→') && !c.includes('0 →')
        );

        if (breakingChanges && breakingChanges.length > 0) {
          warning(`${diff.name}: Review breaking changes`);
          printList(breakingChanges);
        }
      }
    }

    if (removedCount > 0) {
      warning('Some capabilities were removed. Check your code for usage.');
      const removed = diffs.filter(d => d.change === 'removed').map(d => d.name);
      printList(removed);
    }

  } catch (err) {
    spinner.fail('Failed to compare versions');
    error(err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Show latest version and current installed version
 */
export async function showLatest(): Promise<void> {
  const spinner = await import('../utils/cli.js').then(m => m.createSpinner('Checking for updates...'));
  spinner.start();

  try {
    const { getInstalledVersion } = await import('../services/package.service.js');
    const { getLatestVersion } = await import('../services/api.service.js');

    const installed = await getInstalledVersion();
    const latest = await getLatestVersion();

    spinner.succeed('Version check complete');

    header('Version Information');
    info(`Installed: ${installed || 'None'}`);
    info(`Latest: ${latest}`);

    if (installed !== latest) {
      console.log();
      success('New version available!');
      info(`Run: oxlayer install ${latest}`);
    } else if (installed) {
      console.log();
      success('You\'re up to date!');
    }

  } catch (err) {
    spinner.fail('Failed to check version');
    error(err instanceof Error ? err.message : 'Unknown error');
  }
}
