/**
 * BrowserView Management Module
 * Handles creation, switching, and lifecycle of BrowserView tabs
 */

import { BrowserView, BrowserWindow } from 'electron';
import { CONTENT_BOUNDS, BROWSERVIEW_SECURITY } from '../utils/constants';

export interface BrowserViewTab {
  id: string;
  name: string;
  url: string;
  browserView: BrowserView;
  bounds: { x: number; y: number; width: number; height: number };
}

export class BrowserViewManager {
  private tabs = new Map<string, BrowserViewTab>();
  private activeTabId: string | null = null;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupWindowResizeHandler();
  }

  /**
   * Calculate content bounds (below header and tab bar)
   */
  private getContentBounds() {
    if (!this.mainWindow) return { x: 0, y: 0, width: 800, height: 600 };

    const [width, height] = this.mainWindow.getSize();
    return {
      x: CONTENT_BOUNDS.X_OFFSET,
      y: CONTENT_BOUNDS.Y_OFFSET,
      width: width - CONTENT_BOUNDS.SIDEBAR_WIDTH,
      height: height - CONTENT_BOUNDS.Y_OFFSET,
    };
  }

  /**
   * Setup window resize handler to update BrowserView bounds
   */
  private setupWindowResizeHandler() {
    this.mainWindow.on('resize', () => {
      this.updateAllBounds();
    });
  }

  /**
   * Update bounds for all views when window resizes
   */
  private updateAllBounds() {
    const bounds = this.getContentBounds();

    for (const tab of this.tabs.values()) {
      tab.bounds = bounds;
      tab.browserView.setBounds(bounds);
    }
  }

  /**
   * Create a new BrowserView tab with security restrictions
   */
  createTab(id: string, name: string, url: string): BrowserViewTab {
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

      const isAllowed = BROWSERVIEW_SECURITY.ALLOWED_HOSTS.includes(hostname) ||
                       hostname.endsWith('.localhost');

      if (!isAllowed) {
        console.warn(`[BrowserView] Blocked navigation to: ${navigationUrl}`);
        event.preventDefault();
      }
    });

    // Block new windows (popups)
    view.webContents.setWindowOpenHandler(({ url }) => {
      console.warn(`[BrowserView] Blocked popup to: ${url}`);
      return { action: 'deny' };
    });

    // Deny all permissions for embedded services
    view.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });

    const bounds = this.getContentBounds();

    const tab: BrowserViewTab = {
      id,
      name,
      url,
      browserView: view,
      bounds,
    };

    this.tabs.set(id, tab);

    // Preload the URL but don't add to window yet
    view.webContents.loadURL(`http://${url}`);

    console.log(`[BrowserView] Created tab ${id} for ${url} (not attached to window yet)`);

    return tab;
  }

  /**
   * Show a specific tab's BrowserView
   */
  showTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (!tab || !this.mainWindow) return;

    console.log(`[BrowserView] Showing tab ${tabId}`);

    // Hide current view if any
    if (this.activeTabId && this.activeTabId !== tabId) {
      const currentTab = this.tabs.get(this.activeTabId);
      if (currentTab) {
        console.log(`[BrowserView] Removing current tab ${this.activeTabId}`);
        this.mainWindow.removeBrowserView(currentTab.browserView);
      }
    }

    // Update bounds before showing
    const bounds = this.getContentBounds();
    tab.browserView.setBounds(bounds);

    // Show new view
    this.mainWindow.setBrowserView(tab.browserView);
    this.activeTabId = tabId;

    console.log(`[BrowserView] Active tab is now ${tabId}`);

    // Send event to renderer
    this.mainWindow.webContents.send('browser-view-activated', {
      id: tabId,
      name: tab.name,
      url: tab.url
    });
  }

  /**
   * Close a BrowserView tab
   */
  closeTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    // Remove from window if active
    if (this.activeTabId === tabId && this.mainWindow) {
      this.mainWindow.removeBrowserView(tab.browserView);
      this.activeTabId = null;

      // Try to switch to another tab
      const remainingTabs = Array.from(this.tabs.keys()).filter(id => id !== tabId);
      if (remainingTabs.length > 0) {
        this.showTab(remainingTabs[0]);
      }
    }

    // Delete the reference - BrowserView will be garbage collected
    this.tabs.delete(tabId);

    // Send event to renderer
    if (this.mainWindow) {
      this.mainWindow.webContents.send('browser-view-closed', { id: tabId });
    }
  }

  /**
   * Get all tabs
   */
  getAllTabs(): BrowserViewTab[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Get a specific tab
   */
  getTab(tabId: string): BrowserViewTab | undefined {
    return this.tabs.get(tabId);
  }

  /**
   * Get the active tab ID
   */
  getActiveTabId(): string | null {
    return this.activeTabId;
  }

  /**
   * Reload the active tab
   */
  reloadActiveTab(): boolean {
    if (this.activeTabId) {
      const tab = this.tabs.get(this.activeTabId);
      if (tab) {
        tab.browserView.webContents.reload();
        return true;
      }
    }
    return false;
  }

  /**
   * Navigate back in the active tab
   */
  goBackActiveTab(): boolean {
    if (this.activeTabId) {
      const tab = this.tabs.get(this.activeTabId);
      if (tab && tab.browserView.webContents.canGoBack()) {
        tab.browserView.webContents.goBack();
        return true;
      }
    }
    return false;
  }

  /**
   * Navigate forward in the active tab
   */
  goForwardActiveTab(): boolean {
    if (this.activeTabId) {
      const tab = this.tabs.get(this.activeTabId);
      if (tab && tab.browserView.webContents.canGoForward()) {
        tab.browserView.webContents.goForward();
        return true;
      }
    }
    return false;
  }

  /**
   * Remove the active BrowserView (e.g., when switching to overview)
   */
  removeActiveView(): void {
    if (this.activeTabId && this.mainWindow) {
      const currentTab = this.tabs.get(this.activeTabId);
      if (currentTab) {
        console.log(`[BrowserView] Removing BrowserView ${this.activeTabId}`);
        this.mainWindow.removeBrowserView(currentTab.browserView);
        this.activeTabId = null;
      }
    }
  }
}
