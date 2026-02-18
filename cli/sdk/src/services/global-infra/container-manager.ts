/**
 * Container Manager for Global OxLayer Infrastructure Service
 * Handles Docker container lifecycle (start, stop, status, logs)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export class ContainerManager {
  constructor(
    private readonly infraDir: string,
    private readonly composeFile: string
  ) { }

  /**
   * Start global infrastructure
   * Starts static containers - no project-specific logic here
   */
  async start(): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Global infrastructure not initialized. Run: ox global init');
    }

    const running = await this.isRunning();
    if (running) {
      console.log('ℹ  Global infrastructure is already running');
      return;
    }

    console.log('🚀 Starting global OxLayer infrastructure...');
    await execAsync(`docker-compose -f ${this.composeFile} -p oxlayer up -d`, {
      cwd: this.infraDir,
    });

    console.log('✓ Global infrastructure started');
    console.log('  Services: PostgreSQL, Redis, RabbitMQ, Keycloak');
  }

  /**
   * Stop global infrastructure
   */
  async stop(): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Global infrastructure not initialized');
    }

    const running = await this.isRunning();
    if (!running) {
      console.log('ℹ  Global infrastructure is not running');
      return;
    }

    console.log('🛑 Stopping global OxLayer infrastructure...');
    await execAsync(`docker-compose -f ${this.composeFile} -p oxlayer stop`, {
      cwd: this.infraDir,
    });

    console.log('✓ Global infrastructure stopped');
  }

  /**
   * Check if global infrastructure is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `docker-compose -f ${this.composeFile} -p oxlayer ps -q`,
        { cwd: this.infraDir }
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get status of global infrastructure
   */
  async getStatus(): Promise<string> {
    if (!this.isInitialized()) {
      return 'Not initialized';
    }

    const running = await this.isRunning();
    if (!running) {
      return 'Not running';
    }

    try {
      const { stdout } = await execAsync(
        `docker-compose -f ${this.composeFile} -p oxlayer ps --services`,
        { cwd: this.infraDir }
      );
      return `Running: ${stdout.trim().split('\n').join(', ')}`;
    } catch {
      return 'Error fetching status';
    }
  }

  /**
   * Get logs from global infrastructure services
   */
  async getLogs(service?: string, follow = false): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Global infrastructure not initialized');
    }

    const running = await this.isRunning();
    if (!running) {
      throw new Error('Global infrastructure is not running');
    }

    const followFlag = follow ? '--follow' : '';
    const serviceArg = service ? `${service}` : '';

    try {
      // Use spawn for logs to stream output properly
      const { spawn } = await import('child_process');

      const args = [
        '-f', this.composeFile,
        '-p', 'oxlayer',
        'logs',
        followFlag,
        serviceArg,
      ].filter(Boolean);

      const child = spawn('docker-compose', args, {
        cwd: this.infraDir,
        stdio: 'inherit',
      });

      await new Promise<void>((resolve, reject) => {
        child.on('error', reject);
        child.on('exit', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Logs exited with code ${code}`));
        });
      });
    } catch (error: any) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }

  /**
   * Check if global infrastructure is initialized
   */
  isInitialized(): boolean {
    return existsSync(this.infraDir) && existsSync(this.composeFile);
  }
}
