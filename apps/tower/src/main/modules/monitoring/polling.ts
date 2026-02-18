/**
 * Status Polling Module
 * Handles periodic status updates for Docker containers
 */

import { BrowserWindow } from 'electron';
import { getDockerContainerStatus, getServicesStatus } from './docker-status';
import { POLLING_FREQUENCY_DEFAULT } from '../utils/constants';

export class StatusPollingManager {
  private pollingInterval: NodeJS.Timeout | null = null;
  private pollingFrequency: number;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow, initialFrequency = POLLING_FREQUENCY_DEFAULT) {
    this.mainWindow = mainWindow;
    this.pollingFrequency = initialFrequency;
  }

  /**
   * Start status polling
   */
  start(): void {
    // Clear existing interval if any
    this.stop();

    // Poll for status updates
    this.pollingInterval = setInterval(async () => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        try {
          // Get overall infra status
          const status = await getDockerContainerStatus();
          this.mainWindow.webContents.send('infra-status-update', status);

          // Get individual service statuses
          const servicesResult = await getServicesStatus();
          if (servicesResult) {
            this.mainWindow.webContents.send('services-status-update', servicesResult);
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }
    }, this.pollingFrequency);

    console.log(`Status polling started with ${this.pollingFrequency}ms interval`);
  }

  /**
   * Stop status polling
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Status polling stopped');
    }
  }

  /**
   * Set polling frequency and restart
   */
  setFrequency(frequency: number): void {
    this.pollingFrequency = frequency;
    this.start(); // Restart with new frequency
  }

  /**
   * Get current polling frequency
   */
  getFrequency(): number {
    return this.pollingFrequency;
  }
}
