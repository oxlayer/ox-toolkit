/**
 * Utility functions for Global OxLayer Infrastructure Service
 */

import { randomBytes } from 'crypto';

/**
 * Generate secure random password
 */
export function generatePassword(length = 32): string {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Sanitize name for database/vhost usage
 */
export function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 63);
}

/**
 * Ensure all dependencies of selected services are included
 */
export function ensureDependencies(services: string[], serviceDefinitions: any[]): string[] {
  const result = new Set(services);

  let changed = true;
  while (changed) {
    changed = false;
    for (const service of result) {
      const def = serviceDefinitions.find(s => s.id === service);
      if (def?.dependsOn) {
        for (const dep of def.dependsOn) {
          if (!result.has(dep)) {
            result.add(dep);
            changed = true;
          }
        }
      }
    }
  }

  return Array.from(result);
}

/**
 * Prompt user to select which services to include in global infrastructure
 */
export async function promptServiceSelection(serviceDefinitions: any[], coreServices: string[], allServices: string[]): Promise<string[]> {
  const { default: prompts } = await import('prompts');

  console.log();
  console.log('Select services for global OxLayer infrastructure:');
  console.log();

  const { choice } = await prompts({
    type: 'select',
    name: 'choice',
    message: 'Which services would you like to run?',
    choices: [
      { title: 'Core services only (PostgreSQL, Redis, RabbitMQ, Keycloak)', value: 'core' },
      { title: 'All services (Core + Monitoring + Proxy)', value: 'all' },
      { title: 'Custom (select individual services)', value: 'custom' },
    ],
    initial: 0,
  });

  if (choice === 'core') {
    return [...coreServices];
  }

  if (choice === 'all') {
    return [...allServices];
  }

  // Custom selection
  const { services } = await prompts({
    type: 'multiselect',
    name: 'services',
    message: 'Select services to include:',
    choices: serviceDefinitions.map(service => ({
      title: `${service.name} - ${service.description}`,
      value: service.id,
      selected: coreServices.includes(service.id),
    })),
  });

  const selected = services || coreServices;

  return selected;
}

/**
 * Generate docker-compose.yml for selected services
 */
export function generateDockerCompose(services: string[], serviceConfigs: Record<string, string>): string {
  const selectedServices: string[] = [];
  const volumes: string[] = [];

  for (const serviceId of services) {
    const config = serviceConfigs[serviceId];
    if (config) {
      selectedServices.push(config);
      // Collect volumes
      const volumeMatches = config.match(/- ox_\w+_data:/g);
      if (volumeMatches) {
        volumeMatches.forEach(v => {
          const volumeName = v.replace(/- |:/g, '');
          if (!volumes.includes(volumeName)) {
            volumes.push(volumeName);
          }
        });
      }
    }
  }

  return `services:
${selectedServices.join('\n')}

volumes:
${volumes.map((v: string) => `  ${v}:\n    driver: local`).join('\n')}

networks:
  ox_net:
    driver: bridge
`;
}
