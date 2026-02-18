/**
 * BrowserView-related IPC Handlers
 * Handles BrowserView tab operations
 */

import { ipcMain } from 'electron';
import { BrowserViewManager } from '../window/browser-view';

export function registerBrowserViewHandlers(browserViewManager: BrowserViewManager): void {
  // Open a new BrowserView tab
  ipcMain.handle('oxlayer:browserview-open', async (_event, tabId: string, name: string, url: string) => {
    try {
      const tab = browserViewManager.createTab(tabId, name, url);
      browserViewManager.showTab(tabId);
      return { success: true, tab: { id: tab.id, name: tab.name, url: tab.url } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Switch to a specific BrowserView tab
  ipcMain.handle('oxlayer:browserview-switch', async (_event, tabId: string) => {
    try {
      // Special case: if switching to 'overview', remove any active BrowserView
      if (tabId === 'overview') {
        browserViewManager.removeActiveView();
        return { success: true };
      }

      // Otherwise, show the requested BrowserView tab
      browserViewManager.showTab(tabId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Close a BrowserView tab
  ipcMain.handle('oxlayer:browserview-close', async (_event, tabId: string) => {
    try {
      browserViewManager.closeTab(tabId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // List all BrowserView tabs
  ipcMain.handle('oxlayer:browserview-list', async () => {
    try {
      const tabs = browserViewManager.getAllTabs().map(tab => ({
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
      const success = browserViewManager.reloadActiveTab();
      if (success) {
        return { success: true };
      }
      return { success: false, error: 'No active tab' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Navigate back in current BrowserView
  ipcMain.handle('oxlayer:browserview-back', async () => {
    try {
      const success = browserViewManager.goBackActiveTab();
      if (success) {
        return { success: true };
      }
      return { success: false, error: 'Cannot go back' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Navigate forward in current BrowserView
  ipcMain.handle('oxlayer:browserview-forward', async () => {
    try {
      const success = browserViewManager.goForwardActiveTab();
      if (success) {
        return { success: true };
      }
      return { success: false, error: 'Cannot go forward' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
