/**
 * Project-related IPC Handlers
 * Handles project registration, unregistration, and queries
 */

import { ipcMain } from 'electron';
import { GlobalInfraService } from '@oxlayer/cli';

export function registerProjectHandlers(infraService: GlobalInfraService): void {
  // Get all projects
  ipcMain.handle('oxlayer:get-projects', async () => {
    try {
      return infraService.listProjects();
    } catch (error: any) {
      throw new Error(error.message);
    }
  });

  // Register a new project
  ipcMain.handle('oxlayer:register-project', async (_event, name: string, projectPath: string) => {
    try {
      await infraService.registerProject(name, projectPath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Unregister a project
  ipcMain.handle('oxlayer:unregister-project', async (_event, name: string) => {
    try {
      await infraService.unregisterProject(name);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Reset a project (delete all resources)
  ipcMain.handle('oxlayer:reset-project', async (_event, name: string, confirm: boolean) => {
    try {
      await infraService.resetProject(name, confirm);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Get connection strings for a project
  ipcMain.handle('oxlayer:get-connections', async (_event, name: string) => {
    try {
      return infraService.getConnectionStrings(name);
    } catch (error: any) {
      throw new Error(error.message);
    }
  });
}
