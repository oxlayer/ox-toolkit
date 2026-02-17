/**
 * Resolve Command
 *
 * Resolve capabilities for the current project
 */

import { resolveCapabilities } from '../services/index.js';
import { detectProjectType } from '../utils/env.js';
import { header, success, error, info, printCapabilities } from '../utils/cli.js';
import type { CapabilityName, Environment } from '../types/index.js';
import chalk from 'chalk';

export interface ResolveOptions {
  environment?: Environment;
  verbose?: boolean;
}

/**
 * Resolve command - show capability configuration for the project
 */
export async function resolve(options: ResolveOptions = {}): Promise<void> {
  header('OxLayer Capability Resolution');

  // Detect project type to determine capabilities
  const projectConfig = await detectProjectType();
  const environment = options.environment || 'development';

  info(`Project type: ${projectConfig.type}`);
  info(`Environment: ${environment}`);

  // Determine capabilities based on project type
  const capabilitiesToRequest: CapabilityName[] = [];

  switch (projectConfig.type) {
    case 'backend':
      capabilitiesToRequest.push(
        'auth',
        'storage',
        'cache',
        'events',
        'queues',
        'metrics',
        'telemetry'
      );
      break;
    case 'frontend':
      capabilitiesToRequest.push('auth', 'storage');
      break;
    default:
      // Request all capabilities for unknown projects
      capabilitiesToRequest.push(
        'auth',
        'storage',
        'search',
        'vector',
        'cache',
        'events',
        'queues',
        'metrics',
        'telemetry'
      );
  }

  const spinner = await import('../utils/cli.js').then(m => m.createSpinner('Resolving capabilities...'));
  spinner.start();

  try {
    const result = await resolveCapabilities(capabilitiesToRequest, environment);

    spinner.succeed('Capabilities resolved');

    console.log();

    // Show license info
    info(`Organization: ${result.organizationId}`);
    info(`License: ${result.licenseId}`);
    info(`Resolved at: ${new Date(result.resolvedAt).toLocaleString()}`);

    console.log();

    // Show capabilities
    header('Available Capabilities');
    printCapabilities(result.capabilities);

    // Show example usage
    if (options.verbose) {
      console.log();
      header('Usage Example');
      console.log();
      console.log('Import and use capabilities in your code:');
      console.log();
      console.log(chalk.gray('```typescript'));
      console.log(chalk.gray('import { resolveCapabilities } from \'@oxlayer/capabilities-internal\';'));
      console.log();
      console.log(chalk.gray('const capabilities = await resolveCapabilities({'));
      console.log(chalk.gray(`  projectId: 'your-project-id',`));
      console.log(chalk.gray(`  environment: '${environment}',`));
      console.log(chalk.gray(`  requested: ['${capabilitiesToRequest.join("', '")}']`));
      console.log(chalk.gray('});'));
      console.log(chalk.gray('```'));
      console.log();
    }

    success(`Your project has access to ${Object.keys(result.capabilities).length} capabilities`);
  } catch (err) {
    spinner.fail('Failed to resolve capabilities');
    error(err instanceof Error ? err.message : 'Unknown error');

    if (err instanceof Error && err.message.includes('API key')) {
      console.log();
      info('Make sure you\'re authenticated:');
      console.log('  ox login');
    }

    process.exit(1);
  }
}
