/**
 * Login Command
 *
 * Authenticate with the OxLayer Control Panel using Device Authorization Flow.
 *
 * This implements a browser-based login flow (similar to GitHub CLI, Azure CLI):
 * 1. CLI requests a device code from the API
 * 2. CLI opens the user's browser to a verification page
 * 3. User logs in and approves the device
 * 4. CLI polls for completion and receives a scoped access token
 */

import {
  initiateDeviceAuth,
  pollForToken,
  saveConfig,
  openBrowser,
  getDeviceName,
} from '../services/device-auth.service.js';
import { info, success, error, createSpinner, header } from '../utils/cli.js';
import type { CliConfig } from '../types/capabilities.js';

export interface LoginOptions {
  environment?: 'development' | 'staging' | 'production';
  apiEndpoint?: string;
  'no-browser'?: boolean;
  'poll-interval'?: number;
}

/**
 * Login command - authenticate using Device Authorization Flow
 */
export async function login(options: LoginOptions = {}): Promise<void> {
  header('OxLayer Authentication');

  const deviceName = await getDeviceName();
  info(`Device: ${deviceName}`);
  info(`Environment: ${options.environment || 'development'}`);
  info(`API Endpoint: ${options.apiEndpoint || process.env.OXLAYER_API_ENDPOINT}`);
  console.log();

  // Step 1: Initiate device authorization
  const spinner = createSpinner('Initiating device authorization...');
  spinner.start();

  let deviceCodeResponse;
  try {
    const apiEndpoint = options.apiEndpoint || process.env.OXLAYER_API_ENDPOINT;
    info(`API Endpoint: ${apiEndpoint}`);
    deviceCodeResponse = await initiateDeviceAuth(
      options.environment || 'development',
      apiEndpoint
    );
    spinner.succeed('Device authorization initiated');
  } catch (err) {
    spinner.fail('Failed to initiate device authorization');
    error(err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }

  // Step 2: Display instructions
  console.log();
  info('To complete authentication, follow these steps:');
  console.log();

  const verificationUrl = deviceCodeResponse.verificationUrl;
  const userCode = deviceCodeResponse.userCode;

  // Show the URL and code
  console.log(`  1. Visit this URL in your browser:`);
  console.log(`     ${verificationUrl}`);
  console.log();

  console.log(`  2. Enter this code when prompted:`);
  console.log(`     ${userCode}`);
  console.log();

  // Step 3: Open browser (unless --no-browser flag)
  if (!options['no-browser']) {
    try {
      const urlWithCode = new URL(verificationUrl);
      urlWithCode.searchParams.set('device_code', deviceCodeResponse.deviceCode);

      const openSpinner = createSpinner('Opening browser...');
      openSpinner.start();
      await openBrowser(urlWithCode.toString());
      openSpinner.succeed('Browser opened');
    } catch (err) {
      info('Could not open browser automatically. Please visit the URL manually.');
    }
  } else {
    info('Browser auto-open disabled (--no-browser flag set)');
  }

  console.log();
  info('Waiting for authentication to complete...');

  // Step 4: Poll for token
  const pollSpinner = createSpinner('Waiting for approval');

  try {
    pollSpinner.start();

    const result = await pollForToken(
      deviceCodeResponse.pollEndpoint,
      deviceCodeResponse.deviceCode,
      {
        interval: options['poll-interval'] || deviceCodeResponse.interval,
        maxAttempts: 120, // 2 minutes
        onProgress: (attempt, maxAttempts) => {
          if (attempt % 8 === 0) {
            // Update every 15 seconds
            pollSpinner.text = `Waiting for approval (${Math.floor((attempt / maxAttempts) * 100)}%)`;
          }
        },
      }
    );

    pollSpinner.succeed('Authentication successful');

    // Step 5: Save configuration
    const apiEndpoint = options.apiEndpoint || process.env.OXLAYER_API_ENDPOINT;
    const config: CliConfig = {
      token: result.accessToken!,
      tokenInfo: result.tokenInfo!,
      organizationId: result.organizationId!,
      environment: options.environment || 'development',
      vendorDir: '.ox',
      apiEndpoint: apiEndpoint,
      updatedAt: new Date().toISOString(),
    };

    await saveConfig(config);

    pollSpinner.stop();

    console.log();
    success('Logged in successfully');
    info(`Organization: ${result.organizationId}`);
    info(`Device ID: ${result.tokenInfo!.deviceId}`);
    info(`Scopes: ${result.tokenInfo!.scopes.join(', ')}`);
    info(`Expires: ${new Date(result.tokenInfo!.expiresAt).toLocaleString()}`);

    // Ensure clean exit
    process.exit(0);
  } catch (err) {
    pollSpinner.fail('Authentication failed');
    error(err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }
}
