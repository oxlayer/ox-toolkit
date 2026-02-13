/**
 * CLI Utilities
 *
 * Shared utilities for CLI output and formatting
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import type { CapabilityLimits } from '../types/index.js';
import ora from 'ora';

/**
 * Print an info message
 */
export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Print a success message
 */
export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Print a warning message
 */
export function warning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Print an error message
 */
export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

/**
 * Print a header/section title
 */
export function header(title: string): void {
  console.log();
  console.log(chalk.bold.white(title));
  console.log(chalk.gray('─'.repeat(title.length)));
}

/**
 * Print capability limits as a table
 */
export function printCapabilities(capabilities: Record<string, CapabilityLimits>): void {
  if (Object.keys(capabilities).length === 0) {
    info('No capabilities available');
    return;
  }

  const table = new Table({
    head: [chalk.cyan('Capability'), chalk.cyan('Limits')],
    colWidths: [20, 60],
  });

  for (const [name, limits] of Object.entries(capabilities)) {
    const limitStr = Object.entries(limits)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? chalk.green(key) : chalk.red(key);
        }
        return `${key}: ${chalk.yellow(String(value))}`;
      })
      .join(', ');

    table.push([chalk.white(name), limitStr || 'No limits configured']);
  }

  console.log(table.toString());
}

/**
 * Print a list of items
 */
export function printList(items: string[]): void {
  items.forEach((item) => console.log(`  ${chalk.gray('•')} ${item}`));
}

/**
 * Create a spinner for long-running operations
 */
export function createSpinner(text: string) {
  return ora({
    text,
    color: 'blue',
  });
}

/**
 * Ask for confirmation
 */
export async function confirm(message: string): Promise<boolean> {
  const { default: prompts } = await import('prompts');
  const result = await prompts.confirm({
    message,
    default: false,
  });
  return result;
}

/**
 * Format a file size
 */
export function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format a duration
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Print the OxLayer banner
 */
export function printBanner(): void {
  console.log();
  console.log(chalk.gray('Oxlayer CLI'));
  console.log();
}
