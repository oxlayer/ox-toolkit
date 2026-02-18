/**
 * CLI commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, loadEnvFile } from '../config/loader.js';
import { KeycloakAdminClient } from '../keycloak/admin.js';
import { BootstrapEngine } from '../bootstrap.js';
import type { CliOptions, InitOptions } from '../types/cli.js';

/**
 * Bootstrap command
 */
export const bootstrapCommand = new Command('bootstrap')
  .description('Bootstrap Keycloak realm and clients')
  .option('-c, --config <path>', 'Configuration file', 'keycloak.config.ts')
  .option('-e, --env <name>', 'Environment (for logging)', 'development')
  .option('--env-file <path>', 'Load environment variables from .env file')
  .option('--dry-run', 'Show what would be done without applying changes')
  .option('--idempotent', 'Skip existing resources', true)
  .option('--force', 'Overwrite existing resources')
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Quiet output (errors only)')
  .action(async (options: CliOptions) => {
    const spinner = ora({ spinner: 'dots', isSilent: options.quiet });

    try {
      if (!options.quiet) {
        console.log(chalk.bold(`\n🚀 Keycloak Bootstrap\n`));
        console.log(chalk.dim(`Config: ${options.config}`));
        console.log(chalk.dim(`Environment: ${options.env}\n`));
      }

      // Load configuration
      spinner.start('Loading configuration...');

      // Load environment variables from file if specified
      let envVars: Record<string, string | undefined> = process.env;
      if (options.envFile) {
        const fileEnv = await loadEnvFile(options.envFile);
        envVars = { ...process.env, ...fileEnv };
        spinner.info(chalk.dim(`Loaded environment from ${options.envFile}`));
      }

      const config = await loadConfig(options.config, { env: envVars });
      spinner.succeed(chalk.green('Configuration loaded'));

      // Create Keycloak client and bootstrap engine
      const keycloak = new KeycloakAdminClient(config.keycloak);
      const engine = new BootstrapEngine(keycloak, config);

      // Apply configuration
      const applyOptions = {
        dryRun: options.dryRun || false,
        idempotent: !options.force,
        force: options.force || false,
        verbose: options.verbose || false,
      };

      if (options.dryRun) {
        spinner.info(chalk.yellow('Dry run mode - no changes will be applied\n'));
        const result = await engine.dryRun();

        console.log(chalk.bold('\n📋 Changes that would be made:\n'));

        if (result.wouldCreate.length > 0) {
          console.log(chalk.green('To create:'));
          for (const resource of result.wouldCreate) {
            console.log(chalk.green(`  + ${resource.type}: ${resource.name}`));
          }
        }

        if (result.wouldSkip.length > 0) {
          console.log(chalk.yellow('\nTo skip (already exists):'));
          for (const resource of result.wouldSkip) {
            console.log(chalk.yellow(`  - ${resource.type}: ${resource.name}`));
          }
        }

        console.log('');
        process.exit(0);
      }

      spinner.start('Bootstrapping Keycloak...');
      const result = await engine.apply(applyOptions);

      if (result.success) {
        spinner.succeed(chalk.green('Bootstrap completed successfully'));

        if (!options.quiet && result.created && result.created.length > 0) {
          console.log(chalk.green('\n✅ Created:'));
          for (const item of result.created) {
            console.log(chalk.green(`  ✓ ${item}`));
          }
        }

        if (!options.quiet && result.skipped && result.skipped.length > 0) {
          console.log(chalk.yellow('\n⏭️  Skipped:'));
          for (const item of result.skipped) {
            console.log(chalk.yellow(`  - ${item}`));
          }
        }

        console.log('');
        process.exit(0);
      } else {
        spinner.fail(chalk.red('Bootstrap failed'));

        if (result.errors && result.errors.length > 0) {
          console.log(chalk.red('\n❌ Errors:'));
          for (const error of result.errors) {
            console.log(chalk.red(`  ✗ ${error.message}`));
          }
        }

        console.log('');
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red('Bootstrap failed'));

      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}`));
        if (options.verbose && error.stack) {
          console.error(chalk.dim(error.stack));
        }
      } else {
        console.error(chalk.red(`\n❌ Unknown error: ${String(error)}`));
      }

      console.log('');
      process.exit(1);
    }
  });

/**
 * Init command - generate sample configuration
 */
export const initCommand = new Command('init')
  .description('Generate sample configuration file')
  .option('-o, --output <path>', 'Output file', 'keycloak.config.json')
  .option('-t, --type <type>', 'Configuration type (shared, dedicated, full)', 'shared')
  .option('-f, --format <format>', 'Output format (json, yaml, ts)', 'json')
  .action(async (options: InitOptions & { format?: 'json' | 'yaml' | 'ts' }) => {
    const spinner = ora();

    try {
      const format = options.format || (options.output.endsWith('.yaml') || options.output.endsWith('.yml') ? 'yaml' : 'json');
      const sampleConfig = await generateSampleConfig(options.type || 'shared', format);

      spinner.start(`Creating ${options.output}...`);

      await import('fs/promises').then(({ writeFile }) => {
        return writeFile(options.output, sampleConfig);
      });

      spinner.succeed(chalk.green(`Configuration file created: ${options.output}`));
      console.log(chalk.dim('\nEdit the configuration file and run:'));
      console.log(chalk.dim(`  keycloak bootstrap --config ${options.output}\n`));
      process.exit(0);
    } catch (error) {
      spinner.fail(chalk.red('Failed to create configuration file'));

      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}`));
      }

      process.exit(1);
    }
  });

/**
 * Validate command - validate configuration
 */
export const validateCommand = new Command('validate')
  .description('Validate configuration file')
  .option('-c, --config <path>', 'Configuration file', 'keycloak.config.ts')
  .action(async (options: { config: string }) => {
    const spinner = ora();

    try {
      spinner.start('Validating configuration...');
      await loadConfig(options.config);
      spinner.succeed(chalk.green('Configuration is valid'));
      process.exit(0);
    } catch (error) {
      spinner.fail(chalk.red('Configuration validation failed'));

      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}`));
      }

      process.exit(1);
    }
  });

/**
 * Generate sample configuration
 */
async function generateSampleConfig(
  type: 'shared' | 'dedicated' | string,
  format: 'json' | 'yaml' | 'ts' = 'json'
): Promise<string> {
  const baseConfig = type === 'dedicated'
    ? {
      extends: 'enterprise',
      keycloak: {
        url: '${KEYCLOAK_URL:-http://localhost:8080}',
        admin: {
          username: '${KEYCLOAK_ADMIN:-admin}',
          password: '${KEYCLOAK_ADMIN_PASSWORD:-admin}',
        },
      },
      realm: {
        name: 'enterprise-acme',
        displayName: 'ACME Corporation',
        type: 'dedicated',
      },
      clients: [
        {
          name: 'acme-api',
          template: 'api-client',
          overrides: {
            description: 'ACME Backend API',
          },
        },
        {
          name: 'acme-web',
          template: 'web-client',
          overrides: {
            description: 'ACME Web Frontend',
            redirectUris: ['${FRONTEND_URL:-https://acme.com}/*'],
            validPostLogoutRedirectUris: ['${FRONTEND_URL:-https://acme.com}'],
            webOrigins: ['${FRONTEND_URL:-https://acme.com}'],
          },
        },
      ],
      protocolMappers: [
        {
          name: 'organization-id-mapper',
          protocol: 'openid-connect',
          protocolMapper: 'oidc-usermodel-attribute-mapper',
          clients: ['acme-web', 'acme-api'],
          config: {
            'access.token.claim': 'true',
            'claim.name': 'organization',
            'jsonType.label': 'JSON',
            'introspection.token.claim': 'true',
            'multivalued': 'true',
            'userinfo.token.claim': 'true',
            'id.token.claim': 'true',
            'addOrganizationId': 'true',
          },
        },
      ],
    }
    : {
      keycloak: {
        url: '${KEYCLOAK_URL:-http://localhost:8080}',
        admin: {
          username: '${KEYCLOAK_ADMIN:-admin}',
          password: '${KEYCLOAK_ADMIN_PASSWORD:-admin}',
        },
      },
      realm: {
        name: 'my-app',
        displayName: 'My Application',
        type: 'shared',
      },
      clients: [
        {
          name: 'my-app-api',
          template: 'api-client',
          overrides: {
            description: 'My App Backend API',
          },
        },
        {
          name: 'my-app-web',
          template: 'web-client',
          overrides: {
            description: 'My App Web Frontend',
            redirectUris: ['${FRONTEND_URL:-http://localhost:3000}/*'],
            validPostLogoutRedirectUris: ['${FRONTEND_URL:-http://localhost:3000}'],
            webOrigins: ['${FRONTEND_URL:-http://localhost:3000}'],
          },
        },
      ],
      roles: [
        { name: 'user', description: 'Standard user' },
        { name: 'admin', description: 'Application administrator' },
      ],
      protocolMappers: [
        {
          name: 'organization-id-mapper',
          protocol: 'openid-connect',
          protocolMapper: 'oidc-usermodel-attribute-mapper',
          clients: ['my-app-web', 'my-app-api'],
          config: {
            'access.token.claim': 'true',
            'claim.name': 'organization',
            'jsonType.label': 'JSON',
            'introspection.token.claim': 'true',
            'multivalued': 'true',
            'userinfo.token.claim': 'true',
            'id.token.claim': 'true',
            'addOrganizationId': 'true',
          },
        },
      ],
    };

  if (format === 'yaml') {
    // Import dump for YAML format
    const { dump } = await import('js-yaml');
    return `# Keycloak bootstrap configuration
# Generated by: keycloak init
# Environment variables use \${VAR:-default} syntax

${dump(baseConfig, { indent: 2, lineWidth: 120, noRefs: true })}`;
  }

  if (format === 'ts') {
    const baseImports = `// Keycloak bootstrap configuration
// Generated by: keycloak init
`;

    if (type === 'dedicated') {
      return `${baseImports}
import { defineConfig } from '@oxlayer/cli-keycloak/templates';

export default defineConfig({
  extends: 'enterprise', // Use enterprise blueprint

  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    admin: {
      username: process.env.KEYCLOAK_ADMIN || 'admin',
      password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    },
  },

  realm: {
    name: 'enterprise-acme',
    displayName: 'ACME Corporation',
    type: 'dedicated',
  },

  clients: [
    {
      name: 'acme-api',
      template: 'api-client',
      overrides: {
        description: 'ACME Backend API',
      },
    },
    {
      name: 'acme-web',
      template: 'web-client',
      overrides: {
        description: 'ACME Web Frontend',
        redirectUris: [\`\${process.env.FRONTEND_URL || 'https://acme.com'}/*\`],
        validPostLogoutRedirectUris: [process.env.FRONTEND_URL || 'https://acme.com'],
        webOrigins: [process.env.FRONTEND_URL || 'https://acme.com'],
      },
    },
  ],

  protocolMappers: [
    {
      name: 'organization-id-mapper',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      clients: ['acme-web', 'acme-api'],
      config: {
        'access.token.claim': 'true',
        'claim.name': 'organization',
        'jsonType.label': 'JSON',
        'introspection.token.claim': 'true',
        'multivalued': 'true',
        'userinfo.token.claim': 'true',
        'id.token.claim': 'true',
        'addOrganizationId': 'true',
      },
    },
  ],
});
`;
    }

    // Default: shared TS
    return `${baseImports}
import { defineConfig } from '@oxlayer/cli-keycloak/templates';

export default defineConfig({
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    admin: {
      username: process.env.KEYCLOAK_ADMIN || 'admin',
      password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    },
  },

  realm: {
    name: 'my-app',
    displayName: 'My Application',
    type: 'shared',
  },

  clients: [
    {
      name: 'my-app-api',
      template: 'api-client',
      overrides: {
        description: 'My App Backend API',
      },
    },
    {
      name: 'my-app-web',
      template: 'web-client',
      overrides: {
        description: 'My App Web Frontend',
        redirectUris: [\`\${process.env.FRONTEND_URL || 'http://localhost:3000'}/*\`],
        validPostLogoutRedirectUris: [process.env.FRONTEND_URL || 'http://localhost:3000'],
        webOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
      },
    },
  ],

  roles: [
    { name: 'user', description: 'Standard user' },
    { name: 'admin', description: 'Application administrator' },
  ],

  protocolMappers: [
    {
      name: 'organization-id-mapper',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      clients: ['my-app-web', 'my-app-api'],
      config: {
        'access.token.claim': 'true',
        'claim.name': 'organization',
        'jsonType.label': 'JSON',
        'introspection.token.claim': 'true',
        'multivalued': 'true',
        'userinfo.token.claim': 'true',
        'id.token.claim': 'true',
        'addOrganizationId': 'true',
      },
    },
  ],
});
`;
  }

  // Default: JSON
  return JSON.stringify(baseConfig, null, 2);
}
