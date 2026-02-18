/**
 * Docker Status Monitoring Module
 * Handles Docker container status checking and polling
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { getContainerNameMap, getOxlayerContainerNames } from '../utils/container-names';

const execAsync = promisify(exec);

export type ContainerStatus = 'running' | 'stopped' | 'unknown' | 'error';

export interface DockerContainerStatus {
  overall: ContainerStatus;
  services: Record<string, ContainerStatus>;
}

/**
 * Get real Docker container status for all OxLayer containers
 */
export async function getDockerContainerStatus(): Promise<ContainerStatus> {
  try {
    // Get all containers (running and stopped)
    const { stdout } = await execAsync('docker ps -a --format "{{.Names}}|{{.Status}}"');

    // Get container names dynamically
    const containerNameMap = getContainerNameMap();
    const oxlayerContainers = Object.keys(containerNameMap);

    const lines = stdout.trim().split('\n');
    let runningCount = 0;
    let totalCount = 0;

    for (const line of lines) {
      const [name, status] = line.split('|');
      if (oxlayerContainers.some(container => name.includes(container))) {
        totalCount++;
        if (status.includes('Up')) {
          runningCount++;
        }
      }
    }

    // If we have containers and at least one is running, return 'running'
    if (totalCount > 0 && runningCount > 0) {
      return 'running';
    } else if (totalCount > 0 && runningCount === 0) {
      return 'stopped';
    } else {
      return 'unknown';
    }
  } catch (error) {
    console.error('Failed to get Docker status:', error);
    return 'error';
  }
}

/**
 * Get status of individual services
 */
export async function getServicesStatus(): Promise<Record<string, string> | null> {
  try {
    const { stdout } = await execAsync('docker ps -a --format "{{.Names}}|{{.Status}}"');

    const containerNameMap = getContainerNameMap();

    // Initialize all services from the map as unknown
    const servicesStatus: Record<string, string> = {};
    for (const serviceName of Object.values(containerNameMap)) {
      servicesStatus[serviceName] = 'unknown';
    }

    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      const [name, status] = line.split('|');
      if (containerNameMap[name]) {
        const serviceName = containerNameMap[name];
        if (status.includes('Up')) {
          servicesStatus[serviceName] = 'running';
        } else if (status.includes('Exited')) {
          servicesStatus[serviceName] = 'stopped';
        } else {
          servicesStatus[serviceName] = 'unknown';
        }
      }
    }

    return servicesStatus;
  } catch (error) {
    console.error('Failed to get services status:', error);
    return null;
  }
}

/**
 * Get logs for a specific service
 */
export async function getServiceLogs(serviceName: string, tailLines = 100): Promise<string[]> {
  try {
    const containerNameMap = getContainerNameMap();

    // Create reverse map (service name -> container name)
    const reverseMap: Record<string, string> = {};
    for (const [containerName, displayName] of Object.entries(containerNameMap)) {
      reverseMap[displayName] = containerName;
    }

    const containerName = reverseMap[serviceName];
    if (!containerName) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    // Get logs from Docker
    const { stdout } = await execAsync(`docker logs --tail ${tailLines} ${containerName}`);

    // Parse logs into array of strings
    return stdout.trim().split('\n').filter(line => line.length > 0);
  } catch (error: any) {
    // If container doesn't exist or has no logs, return empty array
    if (error.message.includes('No such container')) {
      return [];
    }
    throw error;
  }
}
