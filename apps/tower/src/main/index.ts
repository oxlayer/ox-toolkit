/**
 * OxLayer Tower - Main Process
 */

import { app, BrowserWindow, ipcMain, shell, BrowserView } from 'electron';
import * as path from 'path';
import { GlobalInfraService } from '@oxlayer/cli';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

const execAsync = promisify(exec);

// Disable hardware acceleration in WSL to avoid GPU issues
if (process.env.WSL_DISTRO_NAME) {
  console.log("Disabling hardware acceleration")
  app.disableHardwareAcceleration();
}

let mainWindow: BrowserWindow | null = null;
let infraService: GlobalInfraService;
let statusPollingInterval: NodeJS.Timeout | null = null;
let pollingFrequency = 15000; // Default 15 seconds

// BrowserView Management
interface BrowserViewTab {
  id: string;
  name: string;
  url: string;
  browserView: BrowserView;
  bounds: { x: number; y: number; width: number; height: number };
}

const browserViewTabs = new Map<string, BrowserViewTab>();
let activeTabId: string | null = null;

// Calculate content bounds (below header and tab bar)
function getContentBounds() {
  if (!mainWindow) return { x: 0, y: 0, width: 800, height: 600 };

  const [width, height] = mainWindow.getSize();
  // Sidebar: 256px, Header: ~64px, Tab bar: ~48px
  return {
    x: 256, // After sidebar
    y: 112, // After header + tabs
    width: width - 256,
    height: height - 112,
  };
}

// Create a new BrowserView tab
function createBrowserViewTab(id: string, name: string, url: string): BrowserViewTab {
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
    },
  });

  // Security: Block navigation outside localhost
  view.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const hostname = parsedUrl.hostname;

    // Only allow localhost, 127.0.0.1, and .localhost domains
    const allowedHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
    const isAllowed = allowedHosts.includes(hostname) || hostname.endsWith('.localhost');

    if (!isAllowed) {
      console.warn(`Blocked navigation to: ${navigationUrl}`);
      event.preventDefault();
    }
  });

  // Block new windows (popups)
  view.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`Blocked popup to: ${url}`);
    return { action: 'deny' };
  });

  // Add permission handling (deny all permissions for embedded services)
  view.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  const bounds = getContentBounds();

  const tab: BrowserViewTab = {
    id,
    name,
    url,
    browserView: view,
    bounds,
  };

  browserViewTabs.set(id, tab);

  // Preload the URL but don't add to window yet
  // The BrowserView will be added when we switch to this tab
  view.webContents.loadURL(`http://${url}`);

  console.log(`[BrowserView] Created tab ${id} for ${url} (not attached to window yet)`);

  return tab;
}

// Show a specific tab's BrowserView
function showBrowserViewTab(tabId: string) {
  const tab = browserViewTabs.get(tabId);
  if (!tab || !mainWindow) return;

  console.log(`[BrowserView] Showing tab ${tabId}`);

  // Hide current view if any
  if (activeTabId && activeTabId !== tabId) {
    const currentTab = browserViewTabs.get(activeTabId);
    if (currentTab) {
      console.log(`[BrowserView] Removing current tab ${activeTabId}`);
      mainWindow.removeBrowserView(currentTab.browserView);
    }
  }

  // Update bounds before showing
  const bounds = getContentBounds();
  tab.browserView.setBounds(bounds);

  // Show new view
  mainWindow.setBrowserView(tab.browserView);
  activeTabId = tabId;

  console.log(`[BrowserView] Active tab is now ${tabId}`);

  // Send event to renderer
  mainWindow.webContents.send('browser-view-activated', { id: tabId, name: tab.name, url: tab.url });
}

// Close a BrowserView tab
function closeBrowserViewTab(tabId: string) {
  const tab = browserViewTabs.get(tabId);
  if (!tab) return;

  // Remove from window if active
  if (activeTabId === tabId && mainWindow) {
    mainWindow.removeBrowserView(tab.browserView);
    activeTabId = null;

    // Try to switch to another tab
    const remainingTabs = Array.from(browserViewTabs.keys()).filter(id => id !== tabId);
    if (remainingTabs.length > 0) {
      showBrowserViewTab(remainingTabs[0]);
    }
  }

  // Just delete the reference - BrowserView will be garbage collected
  browserViewTabs.delete(tabId);

  // Send event to renderer
  if (mainWindow) {
    mainWindow.webContents.send('browser-view-closed', { id: tabId });
  }
}

// Update bounds for all views when window resizes
function updateAllBrowserViewBounds() {
  const bounds = getContentBounds();

  for (const tab of browserViewTabs.values()) {
    tab.bounds = bounds;
    tab.browserView.setBounds(bounds);
  }
}

/**
 * Get container names from docker-compose.yml dynamically
 */
function getContainerNameMap(): Record<string, string> {
  try {
    const composePath = path.join(process.env.HOME || '', '.oxlayer', 'infra', 'docker-compose.yml');
    const composeContent = fs.readFileSync(composePath, 'utf-8');
    const composeData = yaml.load(composeContent) as any;

    const containerNameMap: Record<string, string> = {};

    if (composeData.services) {
      for (const [serviceName, serviceConfig] of Object.entries(composeData.services)) {
        const config = serviceConfig as any;
        if (config.container_name) {
          // Map container name -> service name (PascalCase)
          const displayName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
          containerNameMap[config.container_name] = displayName;
        }
      }
    }

    return containerNameMap;
  } catch (error) {
    console.error('Failed to read docker-compose.yml:', error);
    // Fallback to hardcoded values
    return {
      'ox-postgres': 'Postgres',
      'ox-redis': 'Redis',
      'ox-rabbitmq': 'RabbitMQ',
      'ox-keycloak': 'Keycloak',
      'ox-prometheus': 'Prometheus',
      'ox-grafana': 'Grafana',
      'ox-traefik': 'Traefik',
    };
  }
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      // Note: Not using webviewTag - using BrowserView API instead for security
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // Handle window resize to update BrowserView bounds
  mainWindow.on('resize', () => {
    updateAllBrowserViewBounds();
  });

  // Initialize the infrastructure service
  infraService = new GlobalInfraService();

  // Start status polling when window is created
  startStatusPolling();

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

// Function to start polling
function startStatusPolling() {
  // Clear existing interval if any
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
  }

  // Poll for status updates
  statusPollingInterval = setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        // Get overall infra status
        const status = await getDockerContainerStatus();
        mainWindow.webContents.send('infra-status-update', status);

        // Get individual service statuses
        const servicesResult = await getServicesStatusData();
        if (servicesResult) {
          mainWindow.webContents.send('services-status-update', servicesResult);
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }
  }, pollingFrequency);

  console.log(`Status polling started with ${pollingFrequency}ms interval`);
}

// Helper function to get services status (reused by polling and IPC handler)
async function getServicesStatusData(): Promise<Record<string, string> | null> {
  try {
    const { stdout } = await execAsync('docker ps -a --format "{{.Names}}|{{.Status}}"');

    const containerNameMap = getContainerNameMap();

    // Initialize all services from the map as unknown
    const servicesStatus: Record<string, string> = {};
    for (const serviceName of Object.values(containerNameMap)) {
      servicesStatus[serviceName] = 'unknown';
    }

    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      const [name, status] = line.split('|');
      if (containerNameMap[name]) {
        const serviceName = containerNameMap[name];
        if (status.includes('Up')) {
          servicesStatus[serviceName] = 'running';
        } else if (status.includes('Exited')) {
          servicesStatus[serviceName] = 'stopped';
        } else {
          servicesStatus[serviceName] = 'unknown';
        }
      }
    }

    return servicesStatus;
  } catch (error) {
    console.error('Failed to get services status:', error);
    return null;
  }
}

// Function to stop polling
function stopStatusPolling() {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
    statusPollingInterval = null;
    console.log('Status polling stopped');
  }
}

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
  stopStatusPolling();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up when window is closed
app.on('before-quit', () => {
  stopStatusPolling();
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

// Function to get real Docker container status
async function getDockerContainerStatus(): Promise<string> {
  try {
    // Get all containers (running and stopped)
    const { stdout } = await execAsync('docker ps -a --format "{{.Names}}|{{.Status}}"');

    // Get container names dynamically
    const containerNameMap = getContainerNameMap();
    const oxlayerContainers = Object.keys(containerNameMap);

    const lines = stdout.trim().split('\n');
    let runningCount = 0;
    let totalCount = 0;

    for (const line of lines) {
      const [name, status] = line.split('|');
      if (oxlayerContainers.some(container => name.includes(container))) {
        totalCount++;
        if (status.includes('Up')) {
          runningCount++;
        }
      }
    }

    // If we have containers and at least one is running, return 'running'
    if (totalCount > 0 && runningCount > 0) {
      return 'running';
    } else if (totalCount > 0 && runningCount === 0) {
      return 'stopped';
    } else {
      return 'unknown';
    }
  } catch (error: any) {
    console.error('Failed to get Docker status:', error);
    return 'error';
  }
}

ipcMain.handle('oxlayer:get-infra-status', async () => {
  try {
    // Use real Docker status instead of SDK
    return await getDockerContainerStatus();
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

ipcMain.handle('oxlayer:login', async (_email: string, _password: string) => {
  // TODO: Integrate with SDK for login
  return { success: false, error: 'Not implemented' };
});

// Open folder in file explorer (Finder on macOS, Explorer on Windows, Nautilus/Thunar on Linux)
ipcMain.handle('oxlayer:open-folder', async (_, folderPath: string) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Open folder in VSCode
ipcMain.handle('oxlayer:open-vscode', async (_, folderPath: string) => {
  try {
    const { exec } = require('child_process');
    const isWSL = process.env.WSL_DISTRO_NAME !== undefined;

    if (isWSL) {
      // In WSL, use code command with WSL path
      exec(`code --folder-uri vscode-remote://wsl+${process.env.WSL_DISTRO_NAME}${folderPath}`, (error: any) => {
        if (error) {
          console.error('Failed to open VSCode:', error);
          throw error;
        }
      });
    } else {
      // On macOS/Linux/Windows native
      exec(`code "${folderPath}"`, (error: any) => {
        if (error) {
          console.error('Failed to open VSCode:', error);
          throw error;
        }
      });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Open folder in Cursor
ipcMain.handle('oxlayer:open-cursor', async (_, folderPath: string) => {
  try {
    const { exec } = require('child_process');
    const isWSL = process.env.WSL_DISTRO_NAME !== undefined;

    if (isWSL) {
      // In WSL, use cursor command with WSL path
      exec(`cursor --folder-uri cursor-remote://wsl+${process.env.WSL_DISTRO_NAME}${folderPath}`, (error: any) => {
        if (error) {
          console.error('Failed to open Cursor:', error);
          throw error;
        }
      });
    } else {
      // On macOS/Linux/Windows native
      exec(`cursor "${folderPath}"`, (error: any) => {
        if (error) {
          console.error('Failed to open Cursor:', error);
          throw error;
        }
      });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Open folder in Antigravity (JetBrains IDEs)
ipcMain.handle('oxlayer:open-antigravity', async (_, folderPath: string) => {
  try {
    const { exec } = require('child_process');
    const isWSL = process.env.WSL_DISTRO_NAME !== undefined;

    if (isWSL) {
      // In WSL, Antigravity needs the Windows path
      // Convert WSL path to Windows path
      const { execSync } = require('child_process');
      const windowsPath = execSync(`wslpath -w "${folderPath}"`).toString().trim();

      // Try to open with Antigravity (assuming it's installed in Windows)
      exec(`antigravity "${windowsPath}"`, (error: any) => {
        if (error) {
          console.error('Failed to open Antigravity:', error);
          throw error;
        }
      });
    } else {
      // On macOS/Linux/Windows native
      exec(`antigravity "${folderPath}"`, (error: any) => {
        if (error) {
          console.error('Failed to open Antigravity:', error);
          throw error;
        }
      });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Set polling frequency
ipcMain.handle('oxlayer:set-polling-frequency', async (_, frequency: number) => {
  try {
    pollingFrequency = frequency;
    startStatusPolling(); // Restart with new frequency
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get polling frequency
ipcMain.handle('oxlayer:get-polling-frequency', () => {
  return pollingFrequency;
});

// Get Docker logs for a specific service
ipcMain.handle('oxlayer:get-service-logs', async (_, serviceName: string) => {
  try {
    // Get container names dynamically and create reverse map
    const containerNameMap = getContainerNameMap();
    const reverseMap: Record<string, string> = {};
    for (const [containerName, displayName] of Object.entries(containerNameMap)) {
      reverseMap[displayName] = containerName;
    }

    const containerName = reverseMap[serviceName];
    if (!containerName) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    // Get logs from Docker (last 100 lines)
    const { stdout } = await execAsync(`docker logs --tail 100 ${containerName}`);

    // Parse logs into array of strings
    const logs = stdout.trim().split('\n').filter(line => line.length > 0);

    return { success: true, logs };
  } catch (error: any) {
    // If container doesn't exist or has no logs, return empty array
    if (error.message.includes('No such container')) {
      return { success: true, logs: [] };
    }
    return { success: false, error: error.message };
  }
});

// Get status of all individual services
ipcMain.handle('oxlayer:get-services-status', async () => {
  try {
    const servicesStatus = await getServicesStatusData();
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

// ============================================================================
// BrowserView Tab Management IPC Handlers
// ============================================================================

// Open a new BrowserView tab
ipcMain.handle('oxlayer:browserview-open', async (_, tabId: string, name: string, url: string) => {
  try {
    const tab = createBrowserViewTab(tabId, name, url);
    showBrowserViewTab(tabId);
    return { success: true, tab: { id: tab.id, name: tab.name, url: tab.url } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Switch to a specific BrowserView tab
ipcMain.handle('oxlayer:browserview-switch', async (_, tabId: string) => {
  try {
    // Special case: if switching to 'overview', remove any active BrowserView
    if (tabId === 'overview' && mainWindow && activeTabId) {
      const currentTab = browserViewTabs.get(activeTabId);
      if (currentTab) {
        console.log(`[BrowserView] Switching to overview, removing BrowserView ${activeTabId}`);
        mainWindow.removeBrowserView(currentTab.browserView);
        activeTabId = null;
      }
      return { success: true };
    }

    // Otherwise, show the requested BrowserView tab
    showBrowserViewTab(tabId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Close a BrowserView tab
ipcMain.handle('oxlayer:browserview-close', async (_, tabId: string) => {
  try {
    closeBrowserViewTab(tabId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// List all BrowserView tabs
ipcMain.handle('oxlayer:browserview-list', async () => {
  try {
    const tabs = Array.from(browserViewTabs.values()).map(tab => ({
      id: tab.id,
      name: tab.name,
      url: tab.url,
    }));
    return { success: true, tabs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Reload current BrowserView
ipcMain.handle('oxlayer:browserview-reload', async () => {
  try {
    if (activeTabId) {
      const tab = browserViewTabs.get(activeTabId);
      if (tab) {
        tab.browserView.webContents.reload();
        return { success: true };
      }
    }
    return { success: false, error: 'No active tab' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Navigate back in current BrowserView
ipcMain.handle('oxlayer:browserview-back', async () => {
  try {
    if (activeTabId) {
      const tab = browserViewTabs.get(activeTabId);
      if (tab && tab.browserView.webContents.canGoBack()) {
        tab.browserView.webContents.goBack();
        return { success: true };
      }
    }
    return { success: false, error: 'Cannot go back' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Navigate forward in current BrowserView
ipcMain.handle('oxlayer:browserview-forward', async () => {
  try {
    if (activeTabId) {
      const tab = browserViewTabs.get(activeTabId);
      if (tab && tab.browserView.webContents.canGoForward()) {
        tab.browserView.webContents.goForward();
        return { success: true };
      }
    }
    return { success: false, error: 'Cannot go forward' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
