/**
 * Logout Command
 *
 * Remove stored API key and configuration
 */

import { removeConfig, getConfigFile } from '../services/index.js';
import { success, info, warning } from '../utils/cli.js';

/**
 * Logout command - remove stored credentials
 */
export async function logout(): Promise<void> {
  try {
    await removeConfig();
    success('Logged out successfully');
    info(`Configuration removed from ${getConfigFile()}`);
    info('Your API key is no longer stored locally.');
  } catch (err) {
    warning('Could not remove configuration');
    info(err instanceof Error ? err.message : 'Unknown error');
  }
}
