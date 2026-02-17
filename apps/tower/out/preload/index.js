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
  stopInfra: () => electron.ipcRenderer.invoke("oxlayer:stop-infra")
});
//# sourceMappingURL=index.js.map
