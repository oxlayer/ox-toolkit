/**
 * IPC Handler Registry
 * Registers all IPC handlers for the Electron main process
 */

import { GlobalInfraService } from '@oxlayer/cli';
import { BrowserViewManager } from '../window/browser-view';
import { StatusPollingManager } from '../monitoring/polling';
import { registerProjectHandlers } from './project-handlers';
import { registerInfraHandlers } from './infra-handlers';
import { registerSystemHandlers } from './system-handlers';
import { registerBrowserViewHandlers } from './browserview-handlers';
import { registerIDEHandlers } from './ide-handlers';

export function registerIPCHandlers(
  infraService: GlobalInfraService,
  browserViewManager: BrowserViewManager,
  pollingManager: StatusPollingManager
): void {
  registerProjectHandlers(infraService);
  registerInfraHandlers(infraService);
  registerSystemHandlers(infraService, pollingManager);
  registerBrowserViewHandlers(browserViewManager);
  registerIDEHandlers();

  console.log('All IPC handlers registered successfully');
}
