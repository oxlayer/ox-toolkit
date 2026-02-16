#!/usr/bin/env node
/**
 * OxLayer SDK Installer CLI
 *
 * A command-line tool for downloading and installing OxLayer SDK packages
 */

import { Command } from 'commander';
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
import { trackCommand, trackError } from './services/telemetry.service.js';

const program = new Command();

// Show banner on help/version
program.addHelpText('beforeAll', getBanner());

program
  .name('ox')
  .description('OxLayer CLI - Install and manage OxLayer SDK packages')
  .version('0.0.1');

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

// Parse arguments
program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  trackError('cli', 'parse_error');
  process.exit(1);
});
