/**
 * OxLayer Tower - Main Process
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { GlobalInfraService } from '@oxlayer/cli';

let mainWindow: BrowserWindow | null = null;
let infraService: GlobalInfraService;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // Initialize the infrastructure service
  infraService = new GlobalInfraService();

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('oxlayer:get-version', () => {
  return '1.0.0';
});

ipcMain.handle('oxlayer:get-projects', async () => {
  try {
    return infraService.listProjects();
  } catch (error: any) {
    throw new Error(error.message);
  }
});

ipcMain.handle('oxlayer:get-infra-status', async () => {
  try {
    return await infraService.getStatus();
  } catch (error: any) {
    throw new Error(error.message);
  }
});

ipcMain.handle('oxlayer:register-project', async (_, name: string, projectPath: string) => {
  try {
    await infraService.registerProject(name, projectPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oxlayer:unregister-project', async (_, name: string) => {
  try {
    await infraService.unregisterProject(name);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oxlayer:reset-project', async (_, name: string, confirm: boolean) => {
  try {
    await infraService.resetProject(name, confirm);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oxlayer:get-connections', async (_, name: string) => {
  try {
    return infraService.getConnectionStrings(name);
  } catch (error: any) {
    throw new Error(error.message);
  }
});

ipcMain.handle('oxlayer:run-doctor', async () => {
  try {
    await infraService.runDoctor();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oxlayer:start-infra', async () => {
  try {
    await infraService.start();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oxlayer:stop-infra', async () => {
  try {
    await infraService.stop();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oxlayer:login', async (_, email: string, password: string) => {
  // TODO: Integrate with SDK for login
  return { success: false, error: 'Not implemented' };
});
