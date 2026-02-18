/**
 * IDE Integration IPC Handlers
 * Handles opening projects in various IDEs (VSCode, Cursor, Antigravity)
 */

import { ipcMain } from 'electron';
import { exec, execSync } from 'child_process';
import { IDE_COMMANDS } from '../utils/constants';

export interface IDEOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Generic function to open folder in an IDE
 */
async function openFolderInIDE(
  folderPath: string,
  ideCommand: string,
  isWSL: boolean
): Promise<IDEOperationResult> {
  try {
    if (isWSL) {
      // WSL-specific handling
      if (ideCommand === IDE_COMMANDS.ANTIGRAVITY) {
        // Antigravity needs Windows path in WSL
        const windowsPath = execSync(`wslpath -w "${folderPath}"`).toString().trim();
        await new Promise<void>((resolve, reject) => {
          exec(`${ideCommand} "${windowsPath}"`, (error: any) => {
            if (error) reject(error);
            else resolve();
          });
        });
      } else if (ideCommand === IDE_COMMANDS.VSCODE) {
        // VSCode WSL remote URI
        const wslDistro = process.env.WSL_DISTRO_NAME || 'unknown';
        await new Promise<void>((resolve, reject) => {
          exec(`${ideCommand} --folder-uri vscode-remote://wsl+${wslDistro}${folderPath}`, (error: any) => {
            if (error) reject(error);
            else resolve();
          });
        });
      } else if (ideCommand === IDE_COMMANDS.CURSOR) {
        // Cursor WSL remote URI
        const wslDistro = process.env.WSL_DISTRO_NAME || 'unknown';
        await new Promise<void>((resolve, reject) => {
          exec(`${ideCommand} --folder-uri cursor-remote://wsl+${wslDistro}${folderPath}`, (error: any) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }
    } else {
      // Native macOS/Linux/Windows
      await new Promise<void>((resolve, reject) => {
        exec(`${ideCommand} "${folderPath}"`, (error: any) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error(`Failed to open ${ideCommand}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Register IDE integration IPC handlers
 */
export function registerIDEHandlers(): void {
  const isWSL = process.env.WSL_DISTRO_NAME !== undefined;

  // Open folder in VSCode
  ipcMain.handle('oxlayer:open-vscode', async (_event, folderPath: string) => {
    return openFolderInIDE(folderPath, IDE_COMMANDS.VSCODE, isWSL);
  });

  // Open folder in Cursor
  ipcMain.handle('oxlayer:open-cursor', async (_event, folderPath: string) => {
    return openFolderInIDE(folderPath, IDE_COMMANDS.CURSOR, isWSL);
  });

  // Open folder in Antigravity (JetBrains IDEs)
  ipcMain.handle('oxlayer:open-antigravity', async (_event, folderPath: string) => {
    return openFolderInIDE(folderPath, IDE_COMMANDS.ANTIGRAVITY, isWSL);
  });
}
