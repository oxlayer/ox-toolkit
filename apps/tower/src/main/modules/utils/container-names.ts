/**
 * Container Name Mapping Utility
 * Dynamically reads docker-compose.yml to get container names
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CONTAINER_NAME_FALLBACK } from './constants';

/**
 * Get container names from docker-compose.yml dynamically
 */
export function getContainerNameMap(): Record<string, string> {
  try {
    const composePath = path.join(process.env.HOME || '', '.oxlayer', 'infra', 'docker-compose.yml');
    const composeContent = fs.readFileSync(composePath, 'utf-8');
    const composeData = yaml.load(composeContent) as any;

    const containerNameMap: Record<string, string> = {};

    if (composeData.services) {
      for (const [serviceName, serviceConfig] of Object.entries(composeData.services)) {
        const config = serviceConfig as any;
        if (config.container_name) {
          // Map container name -> service name (PascalCase)
          const displayName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
          containerNameMap[config.container_name] = displayName;
        }
      }
    }

    return containerNameMap;
  } catch (error) {
    console.error('Failed to read docker-compose.yml:', error);
    // Fallback to hardcoded values
    return CONTAINER_NAME_FALLBACK;
  }
}

/**
 * Get reverse map (service name -> container name)
 */
export function getReverseContainerNameMap(): Record<string, string> {
  const containerNameMap = getContainerNameMap();
  const reverseMap: Record<string, string> = {};

  for (const [containerName, displayName] of Object.entries(containerNameMap)) {
    reverseMap[displayName] = containerName;
  }

  return reverseMap;
}

/**
 * Get list of all OxLayer container names
 */
export function getOxlayerContainerNames(): string[] {
  return Object.keys(getContainerNameMap());
}

/**
 * Get list of all service display names
 */
export function getServiceDisplayNames(): string[] {
  return Object.values(getContainerNameMap());
}
