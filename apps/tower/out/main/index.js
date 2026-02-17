"use strict";
const electron = require("electron");
const path = require("path");
const cli = require("@oxlayer/cli");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
let mainWindow = null;
let infraService;
const createWindow = () => {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    webPreferences: {
      preload: path__namespace.join(__dirname, "../preload"),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path__namespace.join(__dirname, "../../assets/icon.png")
  });
  infraService = new cli.GlobalInfraService();
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path__namespace.join(__dirname, "../renderer/index.html"));
  }
};
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.handle("oxlayer:get-version", () => {
  return "1.0.0";
});
electron.ipcMain.handle("oxlayer:get-projects", async () => {
  try {
    return infraService.listProjects();
  } catch (error) {
    throw new Error(error.message);
  }
});
electron.ipcMain.handle("oxlayer:get-infra-status", async () => {
  try {
    return await infraService.getStatus();
  } catch (error) {
    throw new Error(error.message);
  }
});
electron.ipcMain.handle("oxlayer:register-project", async (_, name, projectPath) => {
  try {
    await infraService.registerProject(name, projectPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("oxlayer:unregister-project", async (_, name) => {
  try {
    await infraService.unregisterProject(name);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("oxlayer:reset-project", async (_, name, confirm) => {
  try {
    await infraService.resetProject(name, confirm);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("oxlayer:get-connections", async (_, name) => {
  try {
    return infraService.getConnectionStrings(name);
  } catch (error) {
    throw new Error(error.message);
  }
});
electron.ipcMain.handle("oxlayer:run-doctor", async () => {
  try {
    await infraService.runDoctor();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("oxlayer:start-infra", async () => {
  try {
    await infraService.start();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("oxlayer:stop-infra", async () => {
  try {
    await infraService.stop();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("oxlayer:login", async (_, email, password) => {
  return { success: false, error: "Not implemented" };
});
//# sourceMappingURL=index.js.map
