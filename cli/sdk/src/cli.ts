#!/usr/bin/env node
/**
 * OxLayer SDK Installer CLI
 *
 * A command-line tool for downloading and installing OxLayer SDK packages
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getBanner } from './utils/cli.js';
import { login } from './commands/login.command.js';
import { status } from './commands/status.command.js';
import { install } from './commands/install.command.js';
import { resolve } from './commands/resolve.command.js';
import { logout } from './commands/logout.command.js';
import { doctor } from './commands/doctor.command.js';
import { diff, showLatest } from './commands/diff.command.js';
import { telemetryEnable, telemetryDisable, telemetryStatus } from './commands/telemetry.command.js';
import { update, check } from './commands/update.command.js';
import {
  infraStart,
  infraStop,
  infraRestart,
  infraLogs,
  infraList,
  infraInit,
  infraProject,
} from './commands/infra.command.js';
import { trackCommand, trackError } from './services/telemetry.service.js';

const program = new Command();

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(import.meta.dirname, '../package.json'), 'utf-8'));
const CLI_VERSION = packageJson.version;

// Show banner on help/version
program.addHelpText('beforeAll', getBanner());

program
  .name('ox')
  .description('OxLayer CLI - Install and manage OxLayer SDK packages')
  .version(CLI_VERSION);

// Show version before every command (except help/version)
program.hook('preAction', (thisCommand) => {
  // Don't show version for help or version commands
  const commandName = thisCommand.name();
  if (commandName !== 'help' && commandName !== 'version') {
    console.log(`OxLayer CLI v${CLI_VERSION}\n`);
  }
});

// Login command
program
  .command('login')
  .description('Authenticate with OxLayer Control Panel')
  .option('-k, --key <key>', 'API key (will prompt if not provided)')
  .option('-e, --environment <env>', 'Environment (development|staging|production)', 'development')
  .action(async (options) => {
    trackCommand('login');
    await login(options);
  });

// Status command
program
  .command('status')
  .description('Show installation and authentication status')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    trackCommand('status');
    await status(options);
  });

// Install command
program
  .command('install [version]')
  .description('Install SDK packages')
  .option('-p, --packages <packages...>', 'Specific packages to install')
  .option('-e, --environment <env>', 'Environment (development|staging|production)', 'development')
  .option('--dry-run', 'Show what would be installed without installing')
  .option('-f, --force', 'Force reinstall even if already installed')
  .option('--save', 'Add to dependencies')
  .option('--save-dev', 'Add to devDependencies')
  .action(async (version, options) => {
    trackCommand('install', { sdkVersion: version });
    await install(version || 'latest', options);
  });

// Resolve command
program
  .command('resolve')
  .description('Resolve capabilities for current project')
  .option('-e, --environment <env>', 'Environment (development|staging|production)', 'development')
  .option('-v, --verbose', 'Show usage examples')
  .action(async (options) => {
    trackCommand('resolve');
    await resolve(options);
  });

// Logout command
program
  .command('logout')
  .description('Remove stored API key')
  .action(async () => {
    trackCommand('logout');
    await logout();
  });

// Doctor command
program
  .command('doctor')
  .description('Run diagnostics to troubleshoot issues')
  .option('-v, --verbose', 'Show detailed diagnostic information')
  .option('--fix', 'Attempt to fix common issues automatically')
  .action(async (options) => {
    trackCommand('doctor');
    await doctor(options);
  });

// Diff command
program
  .command('diff [from-version] [to-version]')
  .description('Compare capabilities between SDK versions')
  .option('-v, --verbose', 'Show detailed changes')
  .option('--format <format>', 'Output format (text|json)', 'text')
  .action(async (fromVersion, toVersion, options) => {
    trackCommand('diff');
    if (!fromVersion) {
      await showLatest();
    } else {
      await diff(fromVersion, toVersion || 'latest', options);
    }
  });

// Update command
program
  .command('update')
  .description('Update SDK to the latest version')
  .option('--dry-run', 'Show what would be updated without installing')
  .action(async (options) => {
    trackCommand('update');
    await update(options);
  });

// Check command
program
  .command('check')
  .description('Quick check for SDK updates')
  .action(async () => {
    await check();
  });

// Telemetry commands
const telemetryCmd = program
  .command('telemetry')
  .description('Manage telemetry settings');

telemetryCmd
  .command('enable')
  .description('Enable anonymous usage tracking')
  .action(async () => {
    await telemetryEnable();
  });

telemetryCmd
  .command('disable')
  .description('Disable anonymous usage tracking')
  .action(async () => {
    await telemetryDisable();
  });

telemetryCmd
  .command('status')
  .description('Show telemetry status')
  .action(async () => {
    await telemetryStatus();
  });

// Infrastructure commands
const infraCmd = program.command('infra').description('Manage OxLayer infrastructure');

// Development environment
infraCmd
  .command('dev')
  .description('Start development environment')
  .option('-s, --services <services...>', 'Specific services to start')
  .action(async (options) => {
    trackCommand('infra.dev');
    await infraStart('dev');
  });

// Staging environment
infraCmd
  .command('stg')
  .description('Start staging environment')
  .option('-s, --services <services...>', 'Specific services to start')
  .action(async (options) => {
    trackCommand('infra.stg');
    await infraStart('stg');
  });

// Production environment
infraCmd
  .command('prd')
  .description('Start production environment')
  .option('-s, --services <services...>', 'Specific services to start')
  .action(async (options) => {
    trackCommand('infra.prd');
    await infraStart('prd');
  });

// Start command
infraCmd
  .command('start [environment]')
  .description('Start infrastructure (default: dev)')
  .option('-s, --services <services...>', 'Specific services to start')
  .action(async (environment = 'dev', options) => {
    trackCommand('infra.start', { environment });
    await infraStart(environment as any);
  });

// Stop command
infraCmd
  .command('stop [environment]')
  .description('Stop infrastructure (default: dev)')
  .action(async (environment = 'dev', options) => {
    trackCommand('infra.stop', { environment });
    await infraStop(environment as any);
  });

// Restart command
infraCmd
  .command('restart [environment]')
  .description('Restart infrastructure (default: dev)')
  .action(async (environment = 'dev', options) => {
    trackCommand('infra.restart', { environment });
    await infraRestart(environment as any);
  });

// Status command
infraCmd
  .command('status [environment]')
  .description('Show infrastructure status (default: dev)')
  .action(async (environment = 'dev') => {
    trackCommand('infra.status', { environment });
    const { showStatus } = await import('./commands/infra.command.js');
    await showStatus(environment as any);
  });

// Logs command
infraCmd
  .command('logs <service>')
  .description('Show logs for a service')
  .option('-f, --follow', 'Follow log output')
  .action(async (service, options) => {
    trackCommand('infra.logs', { service });
    await infraLogs(service, options.follow || false);
  });

// List command
infraCmd
  .command('list')
  .description('List all available services')
  .action(async () => {
    trackCommand('infra.list');
    await infraList();
  });

// Init command
infraCmd
  .command('init')
  .description('Initialize project infrastructure folder')
  .action(async () => {
    trackCommand('infra.init');
    await infraInit();
  });

// Project command
infraCmd
  .command('project')
  .description('Show project infrastructure status')
  .action(async () => {
    trackCommand('infra.project');
    await infraProject();
  });

// Register command (new global infra)
infraCmd
  .command('register')
  .description('Register project to global infrastructure')
  .action(async () => {
    trackCommand('infra.register');
    const { infraRegister } = await import('./commands/infra.command.js');
    await infraRegister();
  });

// Unregister command (new global infra)
infraCmd
  .command('unregister')
  .description('Unregister project from global infrastructure')
  .action(async () => {
    trackCommand('infra.unregister');
    const { infraUnregister } = await import('./commands/infra.command.js');
    await infraUnregister();
  });

// Env command (new global infra)
infraCmd
  .command('env')
  .description('Generate .env file for project')
  .action(async () => {
    trackCommand('infra.env');
    const { infraEnv } = await import('./commands/infra.command.js');
    await infraEnv();
  });

// Connections command (new global infra)
infraCmd
  .command('connections')
  .description('Show connection URLs for project')
  .action(async () => {
    trackCommand('infra.connections');
    const { showConnections } = await import('./commands/global-infra.command.js');
    await showConnections();
  });

// Reset command (new global infra)
infraCmd
  .command('reset <project>')
  .description('Reset project - delete all resources (DANGEROUS)')
  .option('--confirm', 'Confirm deletion (required)')
  .action(async (project, options) => {
    trackCommand('infra.reset', { project, confirmed: !!options.confirm });
    const { infraReset } = await import('./commands/infra.command.js');
    await infraReset(project, options.confirm || false);
  });

// Sync command (sync monitoring configuration)
infraCmd
  .command('sync')
  .description('Sync project monitoring configuration (Grafana dashboards, Prometheus configs, etc.)')
  .action(async () => {
    trackCommand('infra.sync');
    const { syncProject } = await import('./commands/global-infra.command.js');
    await syncProject();
  });

// ═══════════════════════════════════════════════════════════════
// GLOBAL INFRASTRUCTURE COMMANDS
// ═══════════════════════════════════════════════════════════════

const globalCmd = program.command('global').description('Manage global OxLayer infrastructure');

// Global init command
globalCmd
  .command('init')
  .description('Initialize global OxLayer infrastructure')
  .action(async () => {
    trackCommand('global.init');
    const { globalInit } = await import('./commands/infra.command.js');
    await globalInit();
  });

// Global start command
globalCmd
  .command('start')
  .description('Start global OxLayer infrastructure')
  .action(async () => {
    trackCommand('global.start');
    const { globalStart } = await import('./commands/infra.command.js');
    await globalStart();
  });

// Global stop command
globalCmd
  .command('stop')
  .description('Stop global OxLayer infrastructure')
  .action(async () => {
    trackCommand('global.stop');
    const { globalStop } = await import('./commands/infra.command.js');
    await globalStop();
  });

// Global status command
globalCmd
  .command('status')
  .description('Show global OxLayer infrastructure status')
  .action(async () => {
    trackCommand('global.status');
    const { globalStatus } = await import('./commands/infra.command.js');
    await globalStatus();
  });

// Global doctor command
globalCmd
  .command('doctor')
  .description('Run health check and diagnostics')
  .action(async () => {
    trackCommand('global.doctor');
    const { globalDoctor } = await import('./commands/infra.command.js');
    await globalDoctor();
  });

// Global logs command
globalCmd
  .command('logs [service]')
  .description('Show logs from global infrastructure services')
  .option('-f, --follow', 'Follow log output')
  .action(async (service, options) => {
    trackCommand('global.logs');
    const { globalLogs } = await import('./commands/global-infra.command.js');
    await globalLogs(service, options.follow || false);
  });

// Parse arguments
program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  trackError('cli', 'parse_error');
  process.exit(1);
});
