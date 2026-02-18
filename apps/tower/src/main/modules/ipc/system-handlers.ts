/**
 * System-related IPC Handlers
 * Handles system operations like doctor, folder opening, polling
 */

import { ipcMain, shell } from 'electron';
import { GlobalInfraService } from '@oxlayer/cli';
import { OXLAYER_VERSION } from '../utils/constants';
import { StatusPollingManager } from '../monitoring/polling';

export function registerSystemHandlers(
  infraService: GlobalInfraService,
  pollingManager: StatusPollingManager
): void {
  // Get OxLayer version
  ipcMain.handle('oxlayer:get-version', () => {
    return OXLAYER_VERSION;
  });

  // Run doctor and capture console output
  ipcMain.handle('oxlayer:run-doctor', async () => {
    try {
      // Capture console output by intercepting it
      const logs: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      // Override console methods to capture output
      const captureLog = (prefix: string) => (...args: any[]) => {
        const logLine = args.map(arg => {
          if (typeof arg === 'string') return arg;
          if (arg === undefined) return 'undefined';
          if (arg === null) return 'null';
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');

        logs.push(logLine);
        originalLog(prefix, ...args);
      };

      console.log = captureLog('');
      console.error = captureLog('[ERROR]');
      console.warn = captureLog('[WARN]');

      // Run the doctor
      await infraService.runDoctor();

      // Restore console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      const output = logs.join('\n');

      // Debug logging
      originalLog('=== Doctor Capture Debug ===');
      originalLog('Logs array length:', logs.length);
      originalLog('Output length:', output.length);
      if (output.length > 0) {
        originalLog('First 500 chars:', output.substring(0, 500));
      } else {
        originalLog('⚠️  No output captured!');
      }
      originalLog('==========================');

      return { success: true, output };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Open folder in file explorer
  ipcMain.handle('oxlayer:open-folder', async (_event, folderPath: string) => {
    try {
      await shell.openPath(folderPath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Login (TODO)
  ipcMain.handle('oxlayer:login', async (_event, _email: string, _password: string) => {
    // TODO: Integrate with SDK for login
    return { success: false, error: 'Not implemented' };
  });

  // Set polling frequency
  ipcMain.handle('oxlayer:set-polling-frequency', async (_event, frequency: number) => {
    try {
      pollingManager.setFrequency(frequency);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Get polling frequency
  ipcMain.handle('oxlayer:get-polling-frequency', () => {
    return pollingManager.getFrequency();
  });
}
