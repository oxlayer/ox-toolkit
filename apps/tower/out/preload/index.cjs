"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("oxlayer", {
  getVersion: () => electron.ipcRenderer.invoke("oxlayer:get-version"),
  getProjects: () => electron.ipcRenderer.invoke("oxlayer:get-projects"),
  getInfraStatus: () => electron.ipcRenderer.invoke("oxlayer:get-infra-status"),
  getConnections: (projectName) => electron.ipcRenderer.invoke("oxlayer:get-connections", projectName),
  login: (email, password) => electron.ipcRenderer.invoke("oxlayer:login", email, password),
  registerProject: (projectName, projectPath) => electron.ipcRenderer.invoke("oxlayer:register-project", projectName, projectPath),
  unregisterProject: (projectName) => electron.ipcRenderer.invoke("oxlayer:unregister-project", projectName),
  resetProject: (projectName, confirm) => electron.ipcRenderer.invoke("oxlayer:reset-project", projectName, confirm),
  runDoctor: () => electron.ipcRenderer.invoke("oxlayer:run-doctor"),
  startInfra: () => electron.ipcRenderer.invoke("oxlayer:start-infra"),
  stopInfra: () => electron.ipcRenderer.invoke("oxlayer:stop-infra"),
  openFolder: (folderPath) => electron.ipcRenderer.invoke("oxlayer:open-folder", folderPath),
  openVSCode: (folderPath) => electron.ipcRenderer.invoke("oxlayer:open-vscode", folderPath),
  openCursor: (folderPath) => electron.ipcRenderer.invoke("oxlayer:open-cursor", folderPath),
  openAntigravity: (folderPath) => electron.ipcRenderer.invoke("oxlayer:open-antigravity", folderPath),
  setPollingFrequency: (frequency) => electron.ipcRenderer.invoke("oxlayer:set-polling-frequency", frequency),
  getPollingFrequency: () => electron.ipcRenderer.invoke("oxlayer:get-polling-frequency"),
  getServiceLogs: (serviceName) => electron.ipcRenderer.invoke("oxlayer:get-service-logs", serviceName),
  getServicesStatus: () => electron.ipcRenderer.invoke("oxlayer:get-services-status"),
  onInfraStatusUpdate: (callback) => {
    electron.ipcRenderer.on("infra-status-update", (_, status) => callback(status));
  },
  onServicesStatusUpdate: (callback) => {
    electron.ipcRenderer.on("services-status-update", (_, services) => callback(services));
  },
  // BrowserView Tab Management
  browserView: {
    open: (tabId, name, url) => electron.ipcRenderer.invoke("oxlayer:browserview-open", tabId, name, url),
    switch: (tabId) => electron.ipcRenderer.invoke("oxlayer:browserview-switch", tabId),
    close: (tabId) => electron.ipcRenderer.invoke("oxlayer:browserview-close", tabId),
    list: () => electron.ipcRenderer.invoke("oxlayer:browserview-list"),
    reload: () => electron.ipcRenderer.invoke("oxlayer:browserview-reload"),
    back: () => electron.ipcRenderer.invoke("oxlayer:browserview-back"),
    forward: () => electron.ipcRenderer.invoke("oxlayer:browserview-forward"),
    onActivated: (callback) => {
      electron.ipcRenderer.on("browser-view-activated", (_, tab) => callback(tab));
    },
    onClosed: (callback) => {
      electron.ipcRenderer.on("browser-view-closed", (_, tab) => callback(tab));
    }
  }
});
//# sourceMappingURL=index.cjs.map
