/**
 * Global Infrastructure Commands
 *
 * Commands for managing the global OxLayer infrastructure
 */

import { GlobalInfraService } from '../services/global-infra.service.js';
import { info, success, warning, error, header } from '../utils/cli.js';
import { dirname, basename } from 'path';
import { readFileSync } from 'fs';

const globalService = new GlobalInfraService();

/**
 * Initialize global infrastructure
 */
export async function globalInit(): Promise<void> {
  header('Initialize Global OxLayer Infrastructure');

  try {
    await globalService.initialize();
    success('Global infrastructure initialized successfully');
    console.log();
    info('Next steps:');
    console.log('  1. Start global infra: oxlayer global start');
    console.log('  2. Register projects: ox infra register');
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Start global infrastructure
 */
export async function globalStart(): Promise<void> {
  header('Start Global OxLayer Infrastructure');

  try {
    await globalService.start();
    success('Global infrastructure is running');
    console.log();

    const projects = globalService.listProjects();
    if (projects.length > 0) {
      info('Registered projects:');
      for (const project of projects) {
        console.log(`  • ${project.name} (${project.path})`);
      }
      console.log();
    }

    info('Service URLs:');
    console.log('  • PostgreSQL: postgresql://postgres:postgres@localhost:5432');
    console.log('  • Redis: redis://localhost:6379');
    console.log('  • RabbitMQ Management: http://localhost:15672');
    console.log('  • Keycloak: http://localhost:8080');
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Stop global infrastructure
 */
export async function globalStop(): Promise<void> {
  header('Stop Global OxLayer Infrastructure');

  try {
    await globalService.stop();
    success('Global infrastructure stopped');
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Show global infrastructure status
 */
export async function globalStatus(): Promise<void> {
  header('Global OxLayer Infrastructure Status');

  try {
    await globalService.getStatus();

    const projects = globalService.listProjects();
    if (projects.length > 0) {
      console.log();
      info(`Registered Projects (${projects.length}):`);
      for (const project of projects) {
        const services = Object.keys(project.services)
          .filter((s) => project.services[s as keyof typeof project.services]?.enabled)
          .join(', ');
        console.log(`  • ${project.name}`);
        console.log(`    Path: ${project.path}`);
        console.log(`    Services: ${services || 'none'}`);
      }
    } else {
      console.log();
      info('No projects registered yet');
      console.log('  Register a project with: ox infra register');
    }
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Show logs from global infrastructure
 */
export async function globalLogs(service?: string, follow = false): Promise<void> {
  header('Global OxLayer Infrastructure Logs');

  if (service) {
    info(`Showing logs for service: ${service}${follow ? ' (following)' : ''}`);
  } else {
    info(`Showing logs for all services${follow ? ' (following)' : ''}`);
  }
  console.log();

  try {
    await globalService.getLogs(service, follow);
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Register current project to global infrastructure
 */
export async function registerProject(services?: string[]): Promise<void> {
  header('Register Project to Global Infrastructure');

  try {
    // Get current project name from package.json
    const projectName = getProjectName();
    const projectPath = process.cwd();

    info(`Project: ${projectName}`);
    info(`Path: ${projectPath}`);
    console.log();

    // Check if already registered
    const existing = globalService.getProject(projectName);
    if (existing) {
      warning(`Project '${projectName}' is already registered`);
      console.log();
      info('To update registration, unregister first:');
      console.log(`  ox infra unregister ${projectName}`);
      return;
    }

    // Default services if not specified
    const selectedServices = services || ['postgres', 'redis', 'rabbitmq', 'keycloak'];

    info('Registering with services:', selectedServices.join(', '));
    console.log();

    // Check if global infra is running
    const isRunning = await globalService.isRunning();
    if (!isRunning) {
      warning('Global infrastructure is not running');
      console.log();
      info('Starting global infrastructure...');
      await globalService.start();
      console.log();
    }

    // Register the project
    const projectConfig = await globalService.registerProject(
      projectName,
      projectPath,
      selectedServices
    );

    success('Project registered successfully');
    console.log();

    header('Connection Strings');
    const strings = globalService.getConnectionStrings(projectName);

    if (strings.postgres) {
      console.log(`  PostgreSQL: ${strings.postgres}`);
    }
    if (strings.redis) {
      console.log(`  Redis: ${strings.redis}`);
    }
    if (strings.rabbitmq) {
      console.log(`  RabbitMQ: ${strings.rabbitmq}`);
    }
    if (strings.keycloak) {
      console.log(`  Keycloak: ${strings.keycloak}`);
    }
    console.log();

    info('Next steps:');
    console.log(`  • Generate .env file: ox infra env`);
    console.log(`  • View all projects: oxlayer global status`);
    console.log(`  • View logs: oxlayer global logs [service]`);
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Unregister a project from global infrastructure
 */
export async function unregisterProject(projectName?: string): Promise<void> {
  header('Unregister Project from Global Infrastructure');

  try {
    const name = projectName || getProjectName();

    info(`Project: ${name}`);
    console.log();

    const existing = globalService.getProject(name);
    if (!existing) {
      warning(`Project '${name}' is not registered`);
      return;
    }

    await globalService.unregisterProject(name);
    success('Project unregistered successfully');
    console.log();
    info('Note: Project data (databases, vhosts) has been preserved');
    info('To cleanup data, use the database/RabbitMQ management tools');
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Generate environment file for current project
 */
export async function generateProjectEnv(outputPath?: string): Promise<void> {
  header('Generate Project Environment File');

  try {
    const projectName = getProjectName();
    const project = globalService.getProject(projectName);

    if (!project) {
      error(`Project '${projectName}' is not registered`);
      console.log();
      info('Register the project first:');
      console.log(`  ox infra register`);
      process.exit(1);
    }

    const output = outputPath || process.cwd() + '/.env.local';

    await globalService.generateEnvFile(projectName, output);
    success('Environment file generated');
    console.log();
    info('You can now load this file in your application');
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}

/**
 * Get project name from package.json
 */
function getProjectName(): string {
  try {
    const packagePath = process.cwd() + '/package.json';
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return pkg.name || basename(process.cwd());
  } catch {
    return basename(process.cwd());
  }
}

/**
 * Show connection URLs for current project
 */
export async function showConnections(): Promise<void> {
  header('Project Connection URLs');

  try {
    const projectName = getProjectName();
    const project = globalService.getProject(projectName);

    if (!project) {
      error(`Project '${projectName}' is not registered`);
      console.log();
      info('Register the project first:');
      console.log(`  ox infra register`);
      process.exit(1);
    }

    const strings = globalService.getConnectionStrings(projectName);

    console.log();
    if (strings.postgres) {
      console.log(`  PostgreSQL:  ${strings.postgres}`);
    }
    if (strings.redis) {
      console.log(`  Redis:       ${strings.redis}`);
    }
    if (strings.rabbitmq) {
      console.log(`  RabbitMQ:    ${strings.rabbitmq}`);
    }
    if (strings.keycloak) {
      console.log(`  Keycloak:    ${strings.keycloak}`);
    }
    console.log();
  } catch (err: any) {
    error(err.message);
    process.exit(1);
  }
}
