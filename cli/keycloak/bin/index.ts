#!/usr/bin/env node
/**
 * CLI entry point
 */

import { Command } from 'commander';
import { bootstrapCommand, initCommand, validateCommand } from '../src/cli/commands.js';

const program = new Command();

program
  .name('keycloak')
  .description('Bootstrap Keycloak realms and clients with convention-over-configuration')
  .version('1.0.0');

// Add commands
program.addCommand(bootstrapCommand);
program.addCommand(initCommand);
program.addCommand(validateCommand);

// Default to bootstrap if no command provided
program.action(() => {
  bootstrapCommand.parseAsync(process.argv);
});

program.parseAsync(process.argv);
