/**
 * Window Management Module
 * Handles Electron window creation and lifecycle
 */

import * as path from 'path';
import { app, BrowserWindow } from 'electron';
import { WINDOW_DEFAULTS } from '../utils/constants';
import { BrowserViewManager } from './browser-view';
import { StatusPollingManager } from '../monitoring/polling';
import { registerIPCHandlers } from '../ipc';
import { GlobalInfraService } from '@oxlayer/cli';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private browserViewManager: BrowserViewManager | null = null;
  private pollingManager: StatusPollingManager | null = null;
  private infraService: GlobalInfraService;

  constructor() {
    this.infraService = new GlobalInfraService();
  }

  /**
   * Create the main application window
   */
  createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: WINDOW_DEFAULTS.width,
      height: WINDOW_DEFAULTS.height,
      minWidth: WINDOW_DEFAULTS.minWidth,
      minHeight: WINDOW_DEFAULTS.minHeight,
      webPreferences: {
        preload: path.join(__dirname, '../../preload/index.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
      },
      icon: path.join(__dirname, '../../../assets/icon.png')
    });

    // Initialize BrowserView manager
    this.browserViewManager = new BrowserViewManager(this.mainWindow);

    // Initialize status polling
    this.pollingManager = new StatusPollingManager(this.mainWindow);

    // Register all IPC handlers
    registerIPCHandlers(
      this.infraService,
      this.browserViewManager,
      this.pollingManager
    );

    // Start status polling
    this.pollingManager.start();

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      // In development, load from Vite dev server
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      // In production, load from built files
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    console.log('Main window created successfully');
  }

  /**
   * Get the main window
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * Stop all managers and cleanup
   */
  cleanup(): void {
    if (this.pollingManager) {
      this.pollingManager.stop();
    }
  }

  /**
   * Check if window exists
   */
  hasWindow(): boolean {
    return this.mainWindow !== null && !this.mainWindow.isDestroyed();
  }
}
