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
});
