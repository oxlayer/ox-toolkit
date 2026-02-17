/**
 * OxLayer SDK Service
 * Wraps all IPC calls to the OxLayer backend
 */

export class OxlayerService {
  /**
   * Project Management
   */
  async getProjects() {
    return window.oxlayer.getProjects();
  }

  async registerProject(name: string, path: string) {
    return window.oxlayer.registerProject(name, path);
  }

  async unregisterProject(name: string) {
    return window.oxlayer.unregisterProject(name);
  }

  async resetProject(name: string, confirm: boolean) {
    return window.oxlayer.resetProject(name, confirm);
  }

  async getConnections(projectName: string) {
    return window.oxlayer.getConnections(projectName);
  }

  /**
   * Infrastructure Management
   */
  async getInfraStatus() {
    return window.oxlayer.getInfraStatus();
  }

  async getServicesStatus() {
    return window.oxlayer.getServicesStatus();
  }

  async startInfra() {
    return window.oxlayer.startInfra();
  }

  async stopInfra() {
    return window.oxlayer.stopInfra();
  }

  async getServiceLogs(serviceName: string) {
    return window.oxlayer.getServiceLogs(serviceName);
  }

  /**
   * System Operations
   */
  async runDoctor() {
    return window.oxlayer.runDoctor();
  }

  async getVersion() {
    return window.oxlayer.getVersion();
  }

  /**
   * IDE Integration
   */
  async openFolder(path: string) {
    return window.oxlayer.openFolder(path);
  }

  async openVSCode(path: string) {
    return window.oxlayer.openVSCode(path);
  }

  async openCursor(path: string) {
    return window.oxlayer.openCursor(path);
  }

  async openAntigravity(path: string) {
    return window.oxlayer.openAntigravity(path);
  }

  /**
   * Polling Control
   */
  async setPollingFrequency(frequency: number) {
    return window.oxlayer.setPollingFrequency(frequency);
  }

  async getPollingFrequency() {
    return window.oxlayer.getPollingFrequency();
  }

  /**
   * Event Listeners
   */
  onServicesStatusUpdate(callback: (services: Record<string, string>) => void) {
    window.oxlayer.onServicesStatusUpdate(callback);
  }

  onInfraStatusUpdate(callback: (status: string) => void) {
    window.oxlayer.onInfraStatusUpdate(callback);
  }
}

// Export singleton instance
export const oxlayerService = new OxlayerService();
