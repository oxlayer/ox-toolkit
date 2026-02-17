/**
 * Tabs Service
 * Manages application tabs state using Electron's BrowserView API
 */

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
} catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
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

    // Listen for BrowserView events from main process
    if (window.oxlayer && window.oxlayer.browserView) {
      window.oxlayer.browserView.onActivated((tab) => {
        console.log('BrowserView activated:', tab);
        this.activeTabId = tab.id;
        this.notify();
      });

      window.oxlayer.browserView.onClosed((tab) => {
        console.log('BrowserView closed:', tab);
        // Remove from our local state
        this.tabs = this.tabs.filter(t => t.id !== tab.id);
        this.browserViewTabs.delete(tab.id);
        this.notify();
      });
    } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
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
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

  /**
   * Notify all listeners of tab changes
   */
  private notify() {
    this.listeners.forEach(listener => listener(this.tabs, this.activeTabId));
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

  /**
   * Get all tabs
   */
  getTabs(): Tab[] {
    return [...this.tabs];
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

  /**
   * Get active tab
   */
  getActiveTab(): Tab {
    return this.tabs.find(tab => tab.id === this.activeTabId) || this.tabs[0];
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

  /**
   * Get active tab ID
   */
  getActiveTabId(): string {
    return this.activeTabId;
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
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
          } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
        } catch (error) {
          console.error('BrowserView API error:', error);
          // Fall back to regular tab without BrowserView
          delete newTab.browserViewId;
        } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
      } else {
        console.warn('BrowserView API not available, opening tab without embedded view');
        // BrowserView not available - tab will still work but won't have embedded view
      } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
    } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

    this.activeTabId = id;
    this.notify();

    return id;
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
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
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
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
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
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
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
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
      } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
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
        } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
      } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
    } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

    this.notify();
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
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
      } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
    } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

    this.activeTabId = tabId;
    this.notify();
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
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
      } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
    } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

    this.tabs = this.tabs.filter(t => !t.closable);
    this.activeTabId = 'overview';
    this.notify();
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
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
      } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
    } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

    this.tabs = this.tabs.filter(t => t.id === tabId || !t.closable);
    this.activeTabId = tabId;
    this.notify();
  } catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }
} catch (error) {
          console.error('Failed to close BrowserView:', error);
        }
      }

// Export singleton instance
export const tabsService = new TabsService();
