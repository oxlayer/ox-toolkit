/**
 * OxLayer Tower - Preload Script
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('oxlayer', {
  getVersion: () => ipcRenderer.invoke('oxlayer:get-version'),
  getProjects: () => ipcRenderer.invoke('oxlayer:get-projects'),
  getInfraStatus: () => ipcRenderer.invoke('oxlayer:get-infra-status'),
  getConnections: (projectName: string) =>
    ipcRenderer.invoke('oxlayer:get-connections', projectName),
  login: (email: string, password: string) =>
    ipcRenderer.invoke('oxlayer:login', email, password),
  registerProject: (projectName: string, projectPath: string) =>
    ipcRenderer.invoke('oxlayer:register-project', projectName, projectPath),
  unregisterProject: (projectName: string) =>
    ipcRenderer.invoke('oxlayer:unregister-project', projectName),
  resetProject: (projectName: string, confirm: boolean) =>
    ipcRenderer.invoke('oxlayer:reset-project', projectName, confirm),
  runDoctor: () => ipcRenderer.invoke('oxlayer:run-doctor'),
  startInfra: () => ipcRenderer.invoke('oxlayer:start-infra'),
  stopInfra: () => ipcRenderer.invoke('oxlayer:stop-infra'),
  openFolder: (folderPath: string) =>
    ipcRenderer.invoke('oxlayer:open-folder', folderPath),
  openVSCode: (folderPath: string) =>
    ipcRenderer.invoke('oxlayer:open-vscode', folderPath),
  openCursor: (folderPath: string) =>
    ipcRenderer.invoke('oxlayer:open-cursor', folderPath),
  openAntigravity: (folderPath: string) =>
    ipcRenderer.invoke('oxlayer:open-antigravity', folderPath),
  setPollingFrequency: (frequency: number) =>
    ipcRenderer.invoke('oxlayer:set-polling-frequency', frequency),
  getPollingFrequency: () => ipcRenderer.invoke('oxlayer:get-polling-frequency'),
  getServiceLogs: (serviceName: string) =>
    ipcRenderer.invoke('oxlayer:get-service-logs', serviceName),
  getServicesStatus: () => ipcRenderer.invoke('oxlayer:get-services-status'),
  onInfraStatusUpdate: (callback: (status: string) => void) => {
    ipcRenderer.on('infra-status-update', (_, status) => callback(status));
  },
  onServicesStatusUpdate: (callback: (services: Record<string, string>) => void) => {
    ipcRenderer.on('services-status-update', (_, services) => callback(services));
  },
  // BrowserView Tab Management
  browserView: {
    open: (tabId: string, name: string, url: string) =>
      ipcRenderer.invoke('oxlayer:browserview-open', tabId, name, url),
    switch: (tabId: string) =>
      ipcRenderer.invoke('oxlayer:browserview-switch', tabId),
    close: (tabId: string) =>
      ipcRenderer.invoke('oxlayer:browserview-close', tabId),
    list: () =>
      ipcRenderer.invoke('oxlayer:browserview-list'),
    reload: () =>
      ipcRenderer.invoke('oxlayer:browserview-reload'),
    back: () =>
      ipcRenderer.invoke('oxlayer:browserview-back'),
    forward: () =>
      ipcRenderer.invoke('oxlayer:browserview-forward'),
    onActivated: (callback: (tab: { id: string; name: string; url: string }) => void) => {
      ipcRenderer.on('browser-view-activated', (_, tab) => callback(tab));
    },
    onClosed: (callback: (tab: { id: string }) => void) => {
      ipcRenderer.on('browser-view-closed', (_, tab) => callback(tab));
    },
  },
});
