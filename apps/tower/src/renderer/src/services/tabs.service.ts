/**
 * Tabs Service
 * Manages application tabs state using Electron's BrowserView API
 */

import React from 'react';

export interface Tab {
  id: string;
  title: string;
  type: 'overview' | 'service' | 'project' | 'logs';
  url?: string;
  iconName?: string;
  closable: boolean;
  content?: React.ReactNode;
  // For service tabs with BrowserView
  browserViewId?: string;
}

export class TabsService {
  private tabs: Tab[] = [];
  private activeTabId: string = 'overview';
  private listeners: Set<(tabs: Tab[], activeTabId: string) => void> = new Set();
  private browserViewTabs: Map<string, { id: string; name: string; url: string }> = new Map();

  constructor() {
    // Initialize with overview tab
    this.tabs = [
      {
        id: 'overview',
        title: 'Overview',
        type: 'overview',
        closable: false,
      },
    ];

    this.activeTabId = 'overview';

    // Debug: Check if we're in Electron
    console.log('[TabsService] Environment check:', {
      hasWindow: typeof window !== 'undefined',
      hasOxlayer: !!(window as any).oxlayer,
      hasBrowserView: !!(window as any).oxlayer?.browserView,
      userAgent: navigator.userAgent,
    });

    // Listen for BrowserView events from main process
    try {
      if (window.oxlayer && window.oxlayer.browserView) {
        console.log('[TabsService] BrowserView API available, setting up listeners');

        window.oxlayer.browserView.onActivated((tab) => {
          console.log('[TabsService] BrowserView activated:', tab);
          this.activeTabId = tab.id;
          this.notify();
        });

        window.oxlayer.browserView.onClosed((tab) => {
          console.log('[TabsService] BrowserView closed:', tab);
          // Remove from our local state
          this.tabs = this.tabs.filter(t => t.id !== tab.id);
          this.browserViewTabs.delete(tab.id);
          this.notify();
        });
      } else {
        console.warn('[TabsService] BrowserView API not available - running in browser mode or API not exposed');
      }
    } catch (error) {
      console.error('[TabsService] Failed to setup BrowserView listeners:', error);
    }
  }

  /**
   * Subscribe to tab changes
   */
  subscribe(listener: (tabs: Tab[], activeTabId: string) => void) {
    this.listeners.add(listener);
    listener(this.tabs, this.activeTabId);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of tab changes
   */
  private notify() {
    this.listeners.forEach(listener => listener(this.tabs, this.activeTabId));
  }

  /**
   * Get all tabs
   */
  getTabs(): Tab[] {
    return [...this.tabs];
  }

  /**
   * Get active tab
   */
  getActiveTab(): Tab {
    return this.tabs.find(tab => tab.id === this.activeTabId) || this.tabs[0];
  }

  /**
   * Get active tab ID
   */
  getActiveTabId(): string {
    return this.activeTabId;
  }

  /**
   * Open a new tab
   */
  async openTab(tab: Omit<Tab, 'id'>): Promise<string> {
    const id = `${tab.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTab: Tab = {
      ...tab,
      id,
    };

    this.tabs = [...this.tabs, newTab];

    // If it's a service tab with URL, create BrowserView
    if (tab.type === 'service' && tab.url) {
      // Check if BrowserView API is available
      if (window.oxlayer && window.oxlayer.browserView) {
        const browserViewId = `bv-${id}`;
        newTab.browserViewId = browserViewId;

        try {
          const result = await window.oxlayer.browserView.open(browserViewId, tab.title, tab.url);
          if (result.success) {
            this.browserViewTabs.set(browserViewId, { id: browserViewId, name: tab.title, url: tab.url });
          } else {
            console.error('Failed to create BrowserView:', result.error);
            // Fall back to regular tab without BrowserView
            delete newTab.browserViewId;
          }
        } catch (error) {
          console.error('BrowserView API error:', error);
          // Fall back to regular tab without BrowserView
          delete newTab.browserViewId;
        }
      } else {
        console.warn('BrowserView API not available, opening tab without embedded view');
        // BrowserView not available - tab will still work but won't have embedded view
      }
    }

    this.activeTabId = id;
    this.notify();

    return id;
  }

  /**
   * Open a service tab with BrowserView
   */
  async openServiceTab(serviceName: string, url: string): Promise<string> {
    return this.openTab({
      title: serviceName,
      type: 'service',
      url,
      iconName: 'server',
      closable: true,
    });
  }

  /**
   * Open a project tab
   */
  async openProjectTab(projectName: string, content: React.ReactNode): Promise<string> {
    return this.openTab({
      title: projectName,
      type: 'project',
      content,
      closable: true,
    });
  }

  /**
   * Open a logs tab
   */
  async openLogsTab(serviceName: string, content: React.ReactNode): Promise<string> {
    return this.openTab({
      title: `${serviceName} Logs`,
      type: 'logs',
      content,
      iconName: 'terminal',
      closable: true,
    });
  }

  /**
   * Close a tab
   */
  async closeTab(tabId: string): Promise<void> {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || !tab.closable) return;

    // If it has a BrowserView, close it
    if (tab.browserViewId && window.oxlayer && window.oxlayer.browserView) {
      try {
        await window.oxlayer.browserView.close(tab.browserViewId);
        this.browserViewTabs.delete(tab.browserViewId);
      } catch (error) {
        console.error('Failed to close BrowserView:', error);
      }
    }

    const index = this.tabs.findIndex(t => t.id === tabId);
    this.tabs = this.tabs.filter(t => t.id !== tabId);

    // If we closed the active tab, switch to the previous one
    if (this.activeTabId === tabId) {
      const newIndex = Math.max(0, index - 1);
      this.activeTabId = this.tabs[newIndex]?.id || 'overview';

      // Switch the BrowserView if needed
      const newTab = this.tabs[newIndex];
      if (newTab?.browserViewId && window.oxlayer && window.oxlayer.browserView) {
        try {
          await window.oxlayer.browserView.switch(newTab.browserViewId);
        } catch (error) {
          console.error('Failed to switch BrowserView:', error);
        }
      }
    }

    this.notify();
  }

  /**
   * Switch to a tab
   */
  async switchTab(tabId: string): Promise<void> {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    // If it has a BrowserView, switch to it
    if (tab.browserViewId && window.oxlayer && window.oxlayer.browserView) {
      try {
        await window.oxlayer.browserView.switch(tab.browserViewId);
      } catch (error) {
        console.error('Failed to switch BrowserView:', error);
      }
    }

    this.activeTabId = tabId;
    this.notify();
  }

  /**
   * Close all tabs except dashboard
   */
  async closeAllTabs(): Promise<void> {
    const tabsToClose = this.tabs.filter(t => t.closable);

    for (const tab of tabsToClose) {
      if (tab.browserViewId && window.oxlayer && window.oxlayer.browserView) {
        try {
          if (tab.browserViewId) {
            await window.oxlayer.browserView.close(tab.browserViewId);
            this.browserViewTabs.delete(tab.browserViewId);
          }
        } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
    }

    this.tabs = this.tabs.filter(t => !t.closable);
    this.activeTabId = 'overview';
    this.notify();
  }

  /**
   * Close other tabs except the specified one
   */
  async closeOtherTabs(tabId: string): Promise<void> {
    const tabsToClose = this.tabs.filter(t => t.id !== tabId && t.closable);

    for (const tab of tabsToClose) {
      if (tab.browserViewId && window.oxlayer && window.oxlayer.browserView) {
        try {
          if (tab.browserViewId) {
            await window.oxlayer.browserView.close(tab.browserViewId);
            this.browserViewTabs.delete(tab.browserViewId);
          }
        } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
    }

    this.tabs = this.tabs.filter(t => t.id === tabId || !t.closable);
    this.activeTabId = tabId;
    this.notify();
  }
}

// Export singleton instance
export const tabsService = new TabsService();
