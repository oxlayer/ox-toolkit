#!/usr/bin/env node
/**
 * Wrapper script that runs create-frontend from the current directory
 * instead of the workspace root.
 */

const { execSync } = require('child_process');
const path = require('path');

// Get the directory where the user invoked pnpm (not where pnpm runs the script)
// pnpm sets INIT_CWD to the original working directory before changing to the package directory
const cwd = process.env.INIT_CWD || process.env.PWD || process.cwd();

// Path to the CLI - resolve from workspace root
const workspaceRoot = path.join(__dirname, '..');
const cliPath = path.join(workspaceRoot, 'cli/create-frontend/dist/index.cjs');

// Build the command
const args = process.argv.slice(2).join(' ');
const command = `node "${cliPath}" ${args}`;

try {
  execSync(command, {
    cwd: cwd,
    stdio: 'inherit'
  });
} catch (error) {
  process.exit(error.status || 1);
}
