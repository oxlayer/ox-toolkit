/**
 * OxLayer Tower - Main Process (Refactored)
 *
 * This is the main entry point for the Electron application.
 * It has been refactored into a modular structure for better maintainability.
 *
 * Architecture:
 * - modules/window/ - Window creation and BrowserView management
 * - modules/monitoring/ - Docker status monitoring and polling
 * - modules/ipc/ - IPC handlers organized by feature
 * - modules/utils/ - Constants and utility functions
 */

import { app, BrowserWindow } from 'electron';
import { WindowManager } from './modules/window';

let windowManager: WindowManager;

/**
 * Disable hardware acceleration in WSL to avoid GPU issues
 */
if (process.env.WSL_DISTRO_NAME) {
  console.log('WSL detected, disabling hardware acceleration');
  app.disableHardwareAcceleration();
}

/**
 * Create window when Electron is ready
 */
app.whenReady().then(() => {
  windowManager = new WindowManager();
  windowManager.createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createWindow();
    }
  });
});

/**
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  if (windowManager) {
    windowManager.cleanup();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Cleanup before quitting
 */
app.on('before-quit', () => {
  if (windowManager) {
    windowManager.cleanup();
  }
});
