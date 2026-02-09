/**
 * Login Command
 *
 * Authenticate with the OxLayer Control Panel
 */

import { saveConfig, validateApiKey } from '../services/index.js';
import { info, success, error, createSpinner } from '../utils/cli.js';

export interface LoginOptions {
  key?: string;
  environment?: 'development' | 'staging' | 'production';
}

/**
 * Login command - authenticate and save API key
 */
export async function login(options: LoginOptions = {}): Promise<void> {
  let apiKey = options.key;

  // Prompt for API key if not provided
  if (!apiKey) {
    const { default: prompts } = await import('confirms');

    const result = await prompts.input({
      message: 'Enter your OxLayer API key:',
      validate: (value) => {
        if (!value) return 'API key is required';
        if (!validateApiKey(value)) {
          return 'Invalid API key format. OxLayer API keys start with "oxl_"';
        }
        return true;
      },
    });

    apiKey = result;
  }

  // Validate API key
  if (!validateApiKey(apiKey)) {
    error('Invalid API key format. OxLayer API keys start with "oxl_"');
    process.exit(1);
  }

  // Test the API key
  const spinner = createSpinner('Verifying API key...');
  spinner.start();

  try {
    const { healthCheck } = await import('../services/index.js');
    const isHealthy = await healthCheck();

    if (!isHealthy) {
      spinner.fail('API health check failed');
      error('Could not connect to OxLayer API. Please check your network connection.');
      process.exit(1);
    }

    spinner.succeed('API key verified');

    // Save configuration
    await saveConfig({
      apiKey,
      environment: options.environment || 'development',
      vendorDir: '.capabilities-vendor',
    });

    success('Logged in successfully');
    info(`API key saved to ${await import('../services/auth.service.js').then(m => m.getConfigFile())}`);
  } catch (err) {
    spinner.fail('Authentication failed');
    error(err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }
}
