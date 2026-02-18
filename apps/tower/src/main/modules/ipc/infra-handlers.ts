/**
 * Infrastructure-related IPC Handlers
 * Handles infrastructure start/stop and status queries
 */

import { ipcMain } from 'electron';
import { GlobalInfraService } from '@oxlayer/cli';
import { getDockerContainerStatus, getServicesStatus } from '../monitoring/docker-status';

export function registerInfraHandlers(infraService: GlobalInfraService): void {
  // Get infrastructure status
  ipcMain.handle('oxlayer:get-infra-status', async () => {
    try {
      // Use real Docker status instead of SDK
      return await getDockerContainerStatus();
    } catch (error: any) {
      throw new Error(error.message);
    }
  });

  // Get individual services status
  ipcMain.handle('oxlayer:get-services-status', async () => {
    try {
      const servicesStatus = await getServicesStatus();
      if (servicesStatus) {
        return { success: true, services: servicesStatus };
      } else {
        return { success: false, error: 'Failed to get services status' };
      }
    } catch (error: any) {
      console.error('Failed to get services status:', error);
      return { success: false, error: error.message };
    }
  });

  // Start infrastructure
  ipcMain.handle('oxlayer:start-infra', async () => {
    try {
      await infraService.start();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Stop infrastructure
  ipcMain.handle('oxlayer:stop-infra', async () => {
    try {
      await infraService.stop();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Get service logs
  ipcMain.handle('oxlayer:get-service-logs', async (_event, serviceName: string) => {
    try {
      const { getServiceLogs } = require('../monitoring/docker-status');
      const logs = await getServiceLogs(serviceName, 100);
      return { success: true, logs };
    } catch (error: any) {
      // If container doesn't exist or has no logs, return empty array
      if (error.message.includes('No such container')) {
        return { success: true, logs: [] };
      }
      return { success: false, error: error.message };
    }
  });
}
